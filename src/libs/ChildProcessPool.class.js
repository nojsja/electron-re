const { fork } = require('child_process');
const _path = require('path');

const { getRandomString, removeForkedFromPool } = require('./utils');

class ChildProcessPool {
  constructor({ path, max=6, cwd, env }) {
    this.cwd = cwd || _path.dirname(path);
    this.env = env || process.env;
    this.inspectStartIndex = 5858;
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.forkMaxIndex = max;
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
      if (this.forked.length < this.forkMaxIndex) {
        this.inspectStartIndex ++;
        forked = fork(
          this.forkedPath,
          this.env.NODE_ENV === "development" ? [`--inspect=${this.inspectStartIndex}`] : [],
          { cwd: this.cwd, env: { ...this.env, id } }
        );
        this.forked.push(forked);
        forked.on('message', (data) => {
          const id = data.id;
          delete data.id;
          delete data.action;
          this.onMessage({ data, id });
        });
        forked.on('exit', () => { this.onProcessDisconnect(forked.pid) });
        forked.on('closed', () => { this.onProcessDisconnect(forked.pid) });
        forked.on('error', (err) => { this.onProcessError(err, forked.pid) });
      } else {
        this.forkIndex = this.forkIndex % this.forkMaxIndex;
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
    removeForkedFromPool(this.forked, pid, this.pidMap);
  }

  /**
    * onProcessError [triggered when a process instance break]
    * @param  {[Error]} err [error]
    * @param  {[String]} pid [process pid]
    */
  onProcessError(err, pid) {
    console.error("ChildProcessPool: ", err);
    removeForkedFromPool(this.forked, pid, this.pidMap);
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
}

module.exports = ChildProcessPool;