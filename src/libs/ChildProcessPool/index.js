const _path = require('path');
const EventEmitter = require('events');

const ForkedProcess = require('./ForkedProcess');
const ProcessLifeCycle = require('../ProcessLifeCycle.class');
const ProcessManager = require('../ProcessManager/index');
const { defaultLifecycle } = require('../ProcessLifeCycle.class');
const LoadBalancer = require('../LoadBalancer');
let { inspectStartIndex } = require('../../conf/global.json');
const { getRandomString, removeForkedFromPool, convertForkedToMap, isValidValue } = require('../utils');
const { UPDATE_CONNECTIONS_SIGNAL } = require('../consts');

const defaultStrategy = LoadBalancer.ALGORITHM.POLLING;

class ChildProcessPool extends EventEmitter {
  constructor({
    path,
    max=6,
    cwd,
    env={},
    weights=[], // weights of processes, the length is equal to max
    strategy=defaultStrategy,
    lifecycle={ // lifecycle of processes
      expect: defaultLifecycle.expect, // default timeout 10 minutes
      internal: defaultLifecycle.internal // default loop interval 30 seconds
    },
  }) {
    super();
    this.cwd = cwd || _path.dirname(path);
    this.env = {
      ...process.env,
      ...env
    };
    this.callbacks = {};
    this.pidMap = new Map();
    this.callbacksMap = new Map();
    this.connectionsMap={};
    this.forked = [];
    this.connectionsTimer = null;
    this.forkedMap = {};
    this.forkedPath = path;
    this.forkIndex = 0;
    this.maxInstance = max;
    this.weights = new Array(max).fill().map(
      (_, i) => (isValidValue(weights[i]) ? weights[i] : 1)
    );
    this.LB = new LoadBalancer({
      algorithm: strategy,
      targets: [],
    });
    this.lifecycle = new ProcessLifeCycle({
      expect: lifecycle.expect,
      internal: lifecycle.internal
    });

    this.lifecycle.start();
    this.initEvents();
  }

  /* -------------- internal -------------- */

  /* init events */
  initEvents = () => {
    // let process sleep when no activity in expect time
    /* this.lifecycle.on('sleep', (ids) => {
      ids.forEach(pid => {
        if (this.forkedMap[pid]) {
          this.forkedMap[pid].sleep();
        }
      });
    }); */
    // process manager refresh connections
    this.connectionsTimer = setInterval(() => {
      ProcessManager.emit(UPDATE_CONNECTIONS_SIGNAL, this.connectionsMap);
    }, 1e3);
    // message from forked process
    this.on('forked_message', ({data, id}) => {
      this.onMessage({data, id});
    });
    // process exit
    this.on('forked_exit', (pid) => {
      this.onForkedDisconnect(pid);
    });
    // process error
    this.on('forked_error', (err, pid) => {
      this.onProcessError(err, pid);
    });
  }
  
  /* Received data from a child process */
  dataRespond = (data, id) => {
    if (id && this.callbacks[id]) {
      this.callbacks[id](data);
      delete this.callbacks[id];
    };
  }

  /* Received data from multi child processes */
  dataRespondAll = (data, id) => {
    if (!id) return;
    let resultAll = this.callbacksMap.get(id);
    if (resultAll !== undefined) {
      this.callbacksMap.set(id, [...resultAll, data]);
    } else {
      this.callbacksMap.set(id, [data]);
    }
    resultAll = this.callbacksMap.get(id);
    if (resultAll.length === this.forked.length) {
      this.callbacks[id](resultAll);
      delete this.callbacks[id];
      this.callbacksMap.delete(id);
    }
  }

  /**
    * onForkedCreate [triggered when a process instance created]
    * @param  {[String]} pid [process pid]
    */
  onForkedCreate = (forked) => {
    const pidsValue = this.forked.map(f => f.pid);
    const length = this.forked.length;

    ProcessManager.pipe(forked.child);
    this.LB.add({
      id: forked.pid,
      weight: this.weights[length - 1],
    });
    this.forkedMap = convertForkedToMap(this.forked);
    this.lifecycle.watch([forked.pid]);
    ProcessManager.listen(pidsValue, 'node', this.forkedPath);
  }

  /**
    * onForkedDisconnect [triggered when a process instance disconnect]
    * @param  {[String]} pid [process pid]
    */
   onForkedDisconnect = (pid) => {
    const length = this.forked.length;

    removeForkedFromPool(this.forked, pid, this.pidMap);
    this.forkedMap = convertForkedToMap(this.forked);
    this.LB.del({
      id: pid,
      weight: this.weights[length - 1],
    });
    this.lifecycle.unwatch([pid]);
    ProcessManager.unlisten([pid]);
    console.log(this.forked.map(f => f.pid), pid, '>>>>>>>>>>>>>>>>>>')
  }

  /* Get a process instance from the pool */
  getForkedFromPool = (id="default") => {
    let forked;
    if (!this.pidMap.get(id)) {
      // create new process and put it into the pool
      if (this.forked.length < this.maxInstance) {
        inspectStartIndex ++;
        forked = new ForkedProcess(
          this,
          this.forkedPath,
          this.env.NODE_ENV === "development" ? [`--inspect=${inspectStartIndex}`] : [],
          { cwd: this.cwd, env: { ...this.env, id }, stdio: 'pipe' }
        );
        this.forked.push(forked);
        this.onForkedCreate(forked);
      } else {
      // get a process from the pool based on load balancing strategy
        forked = this.forkedMap[this.LB.pickOne().id];
      }
      if (id !== 'default') {
        this.pidMap.set(id, forked.pid);
      }
      if (this.pidMap.keys.length === 1000) {
        console.warn('ChildProcessPool: The count of pidMap is over than 1000, suggest to use unique id!');
      }
    } else {
      // pick a special process from the pool
      forked = this.forkedMap[this.pidMap.get(id)];
    }

    if (!forked) throw new Error(`Get forked process from pool failed! the process pid: ${this.pidMap.get(id)}.`);

    return forked;
  }

  /**
    * onProcessError [triggered when a process instance break]
    * @param  {[Error]} err [error]
    * @param  {[String]} pid [process pid]
    */
  onProcessError = (err, pid) => {
    console.error("ChildProcessPool: ", err);
    this.onForkedDisconnect(pid);
  }

  /**
    * onMessage [Received data from a process]
    * @param  {[Any]} data [response data]
    * @param  {[String]} id [process tmp id]
    */
  onMessage = ({ data, id }) => {
    if (this.callbacksMap.get(id) !== undefined) {
      this.dataRespondAll(data, id)
    } else {
      this.dataRespond(data, id);
    }
  }

  /* -------------- caller -------------- */

  /**
  * send [Send request to a process]
  * @param  {[String]} taskName [task name - necessary]
  * @param  {[Any]} params [data passed to process - necessary]
  * @param  {[String]} id [the unique id bound to a process instance - not necessary]
  * @return {[Promise]} [return a Promise instance]
  */
  send = (taskName, params, givenId) => {
    if (givenId === 'default') throw new Error('ChildProcessPool: Prohibit the use of this id value: [default] !')

    const id = getRandomString();
    const forked = this.getForkedFromPool(givenId);
    this.lifecycle.refresh([forked.pid]);

    return new Promise(resolve => {
      this.callbacks[id] = resolve;
      forked.send({action: taskName, params, id });
    });
  }

  /**
  * sendToAll [Send requests to all processes]
  * @param  {[String]} taskName [task name - necessary]
  * @param  {[Any]} params [data passed to process - necessary]
  * @return {[Promise]} [return a Promise instance]
  */
  sendToAll = (taskName, params) => {
    const id = getRandomString(); 
    return new Promise(resolve => {
      this.callbacks[id] = resolve;
      this.callbacksMap.set(id, []);
      if (this.forked.length) {
        // use process in pool
        this.forked.forEach((forked) => {
          forked.send({ action: taskName, params, id });
        });
        this.lifecycle.refresh(this.forked.map(forked => forked.pid));
      } else {
        // use default process
        this.getForkedFromPool().send({ action: taskName, params, id });
      }
    });
  }

  /**
  * disconnect [shutdown a sub process or all sub processes]
  * @param  {[String]} id [id bound with a sub process. If none is given, all sub processes will be killed.]
  */
  kill = (id) => {
    if (id !== undefined) {
      const pid = this.pidMap.get(id);
      const fork = this.forkedMap[pid];
      try {
        // don't use disconnect, that just close the ipc channel.
        if (fork) process.kill(pid, "SIGINT");
      } catch (error) {
        console.error(`ChildProcessPool: Failed to kill the child process ${pid}!`);
      }
    } else {
      console.warn('ChildProcessPool: The all sub processes will be shutdown!');
      this.forked.forEach(fork => {
        try {
          process.kill(fork.pid, "SIGINT")
        } catch (error) {
          console.error(`ChildProcessPool: Failed to kill the child process ${pid}!`);
        }
      });
    }
  }

  /**
  * setMaxInstanceLimit [set the max count of sub process instances created by pool]
  * @param  {[Number]} count [the max count instances]
  */
  setMaxInstanceLimit = (count) => {
    if (!Number.isInteger(count) || count <= 0)
      return console.warn('ChildProcessPool: setMaxInstanceLimit - the param count must be an positive integer!');
    if (count < this.maxInstance)
      console.warn(`ChildProcesspool: setMaxInstanceLimit - the param count is less than old value ${this.maxInstance} !`);

    this.maxInstance = count;
  }
}

module.exports = ChildProcessPool;