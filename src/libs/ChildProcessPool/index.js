const _path = require('path');
const EventEmitter = require('events');

const ForkedProcess = require('./ForkedProcess');
const { getRandomString, removeForkedFromPool } = require('../utils');
const ProcessManager = require('../ProcessManager/index');
let { inspectStartIndex } = require('../../conf/global.json');

class ChildProcessPool extends EventEmitter {
  constructor({ path, max=6, cwd, env={} }) {
    super();
    this.cwd = cwd || _path.dirname(path);
    this.env = {
      ...process.env,
      ...env
    };
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.maxInstance = max;
    this.initEvents();
  }

  /* -------------- internal -------------- */

  /* init events */
  initEvents = () => {
    this.on('fork', (pids) => {
      ProcessManager.listen(pids, 'node', this.forkedPath);
    });
    this.on('unfork', (pids) => {
      ProcessManager.unlisten(pids);
    });
    this.on('forked_message', ({data, id}) => {
      this.onMessage({data, id});
    });
    this.on('forked_exit', (pid) => {
      this.onProcessDisconnect(pid);
    });
    this.on('forked_closed', (pid) => {
      this.onProcessDisconnect(pid)
    });
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
    let resultAll = this.collaborationMap.get(id);
    if (resultAll !== undefined) {
      this.collaborationMap.set(id, [...resultAll, data]);
    } else {
      this.collaborationMap.set(id, [data]);
    }
    resultAll = this.collaborationMap.get(id);
    if (resultAll.length === this.forked.length) {
      this.callbacks[id](resultAll);
      delete this.callbacks[id];
      this.collaborationMap.delete(id);
    }
  }

  /* Get a process instance from the pool */
  getForkedFromPool(id="default") {
    let forked;
    if (!this.pidMap.get(id)) {
      // create new process
      if (this.forked.length < this.maxInstance) {
        inspectStartIndex ++;
        forked = new ForkedProcess(
          this,
          this.forkedPath,
          this.env.NODE_ENV === "development" ? [`--inspect=${inspectStartIndex}`] : [],
          { cwd: this.cwd, env: { ...this.env, id }, stdio: 'pipe' }
        )
        this.forked.push(forked);
        ProcessManager.pipe(forked.child);
        this.emit('fork', this.forked.map(fork => fork.pid));
      } else {
        this.forkIndex = this.forkIndex % this.maxInstance;
        forked = this.forked[this.forkIndex];
      }
      
      if(id !== 'default')
        this.pidMap.set(id, forked.pid);
      if(this.pidMap.keys.length === 1000)
        console.warn('ChildProcessPool: The count of pidMap is over than 1000, suggest to use unique id!');
        
      this.forkIndex += 1;
    } else {
      // use existing processes
      forked = this.forked.find(f => f.pid === this.pidMap.get(id));
      if (!forked) throw new Error(`Get forked process from pool failed! the process pid: ${this.pidMap.get(id)}.`);
    }

    return forked;
  }

  /**
    * onProcessDisconnect [triggered when a process instance disconnect]
    * @param  {[String]} pid [process pid]
    */
  onProcessDisconnect(pid){
    this.emit('unfork', pid);
    removeForkedFromPool(this.forked, pid, this.pidMap);
  }

  /**
    * onProcessError [triggered when a process instance break]
    * @param  {[Error]} err [error]
    * @param  {[String]} pid [process pid]
    */
  onProcessError(err, pid) {
    console.error("ChildProcessPool: ", err);
    this.onProcessDisconnect(pid);
  }

  /**
    * onMessage [Received data from a process]
    * @param  {[Any]} data [response data]
    * @param  {[String]} id [process tmp id]
    */
  onMessage({ data, id }) {
    if (this.collaborationMap.get(id) !== undefined) {
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
  send(taskName, params, givenId) {
    if (givenId === 'default') throw new Error('ChildProcessPool: Prohibit the use of this id value: [default] !')

    const id = getRandomString();
    const forked = this.getForkedFromPool(givenId);
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
  sendToAll(taskName, params) {
    const id = getRandomString(); 
    return new Promise(resolve => {
      this.callbacks[id] = resolve;
      this.collaborationMap.set(id, []);
      if (this.forked.length) {
        // use process in pool
        this.forked.forEach((forked) => {
          forked.send({ action: taskName, params, id });
        })
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
  kill(id) {
    if (id !== undefined) {
      const pid = this.pidMap.get(id);
      const fork = this.forked.find(p => p.pid === pid);
      try {
        // don't use disconnect, that just close the ipc channel.
        if (fork) process.kill(pid, "SIGTERM");
      } catch (error) {
        console.error(`ChildProcessPool: Failed to kill the child process ${pid}!`);
      }
    } else {
      console.warn('ChildProcessPool: The all sub processes will be shutdown!');
      this.forked.forEach(fork => {
        try {
          process.kill(fork.pid, "SIGTERM")
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
  setMaxInstanceLimit(count) {
    if (!Number.isInteger(count) || count <= 0)
      return console.warn('ChildProcessPool: setMaxInstanceLimit - the param count must be an positive integer!');
    if (count < this.maxInstance)
      console.warn(`ChildProcesspool: setMaxInstanceLimit - the param count is less than old value ${this.maxInstance} !`);

    this.maxInstance = count;
  }
}

module.exports = ChildProcessPool;