const electron = require('electron');
const { app, BrowserWindow, Menu, Tray, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const { getRandomString } = require('./utils');

class ChildProcess {
  constructor({ ipc, path, max=6, cwd, env })
  {
    this.cwd = cwd || process.cwd;
    this.env = env || process.env;
    this.ipc = ipc;
    this.inspectStartIndex = 5858;
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.event = new EventEmitter();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.forkMaxIndex = max;
    this.event.on('fork-callback', ({ data, id }) => {
      if (this.collaborationMap.get(id) !== undefined) {
        this.dataRespondAll(data, id)
      } else {
        this.dataRespond(data, id);
      }
    })
  }
  
  /* 子进程数据回调 */
  dataRespond = (data, id) => {
    if (id && this.callbacks[id]) {
      this.callbacks[id](data.result);
      delete this.callbacks[id];
    };
  }

  /* 所有子进程协同数据回调 */
  dataRespondAll = (data, id) => {
    if (!id) return;
    let resultAll = this.collaborationMap.get(id);
    if (resultAll !== undefined) {
      this.collaborationMap.set(id, [...resultAll, data.result]);
    } else {
      this.collaborationMap.set(id, [data.result]);
    }
    resultAll = this.collaborationMap.get(id);
    if (resultAll.length === this.forked.length) {
      this.callbacks[id](resultAll);
      delete this.callbacks[id];
      this.collaborationMap.delete(id);
    }
  }

  /* 从子进程池中获取一个进程 */
  getForkedFromPool(id="default") {
    let forked;
    if (!this.pidMap.get(id)) {
      if (this.forked.length < this.forkMaxIndex) {
        this.inspectStartIndex ++;
        forked = fork(
          this.forkedPath,
          this.env.NODE_ENV === "development" ? [`--inspect=${this.inspectStartIndex}`] : [],
          {
            cwd: this.cwd,
            env: { ...this.env, id },
          }
        );
        this.forked.push(forked);
        this.forkIndex += 1;
        forked.on('message', (data) => {
          this.event.emit('fork-callback', { data, id: id });
        });
        this.pidMap.set(id, forked.pid);
      } else {
        this.forkIndex = this.forkIndex % this.forkMaxIndex;
        forked = this.forked[this.forkIndex];
        this.pidMap.set(id, forked.pid);
        this.forkIndex += 1;
      }
    } else {
      forked = this.forked.filter(f => f.pid === this.pidMap.get(id))[0];
      if (!forked) throw new Error(`Get forked process from pool failed! the process pid: ${this.pidMap.get(id)}.`);
    }

    return forked;
  }

  /* 向子进程发送请求 */
  send(params, givenId) {
    const id = givenId || getRandomString();
    const forked = this.getForkedFromPool(id);
    return new Promise(resolve => {
      this.callbacks[id] = resolve;
      forked.send(params);
    });
  }

  /* 向所有进程发送请求 */
  sendToAll(params) {
    const id = getRandomString(); 
    return new Promise(resolve => {
      this.callbacks[id] = resolve;
      this.collaborationMap.set(id, []);
      if (this.forked.length) {
        this.forked.forEach((forked) => {
          forked.send(params);
        })
      } else {
        this.getForkedFromPool().send(params);
      }
    });
  }
}

module.exports = ChildProcess;
