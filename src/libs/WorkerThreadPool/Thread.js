/* -------------------------------------------------------
  Thread:
    线程具有唯一的线程ID
    - taskId：线程ID
    - execPath: 执行文件路径
    - status：任务状态
------------------------------------------------------- */
const path = require('path');
const EventEmitter = require('events');

const { THREAD_STATUS, THREAD_TYPE } = require('./consts');
const EvalWorker = require('./Worker/EvalWorker');
const ExecWorker = require('./Worker/ExecWorker');

class Thread extends EventEmitter {
  constructor(execContent, type) {
    super();
    this.type = type;
    this.status = THREAD_STATUS.IDLE;
    this.worker = null;
    this.threadId = null;
    this.execPath = null;
    this.execString = null;
    if (type === THREAD_TYPE.EVAL) {
      this.execString = execContent;
    } else {
      this.execPath = path.resolve(execContent);
    }
    this._initWorker();
  }

  get isIdle() {
    return this.status === THREAD_STATUS.IDLE;
  }

  _initWorker() {
    if (this.type === THREAD_TYPE.EVAL) {
      this.worker = new EvalWorker(this.execString);
    } else {
      this.worker = new ExecWorker(this.execPath);
    }
    this.threadId = worker.threadId;
    this.worker.on('response', this._onResponse);
    this.worker.on('error', this._onError);
    this.worker.on('exit', this._onExit);
  }

  _onError = (err) => {
    console.error('Worker Error: ', err);
    this.emit('error', err);
  }

  _onExit = (exitCode) => {
    console.log(`Worker stopped with exit code ${exitCode}`);
    this.status = THREAD_STATUS.DEAD;
    this.emit('exit', {
      threadId: this.threadId,
      exitCode,
    });
  }

  _onResponse = (info) => {
    this.status = THREAD_STATUS.IDLE;
    this.emit('response', {
      ...info,
      threadId: this.threadId,
    });
  }

  runTask(task) {
    switch (this.status) {
      case THREAD_STATUS.IDLE:
        this.status = THREAD_STATUS.WORKING;
        this.worker.postMessage(task);
        return true;
      case THREAD_STATUS.WORKING:
        return false;
      case THREAD_STATUS.DEAD:
        return false;
      default:
        return false;
    }
  }
}

module.exports = Thread;