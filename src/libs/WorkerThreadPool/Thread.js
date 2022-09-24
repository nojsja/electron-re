/* -------------------------------------------------------
  Thread:
    线程具有唯一的线程ID
    - taskId：线程ID
    - execPath: 执行文件路径
    - status：任务状态
------------------------------------------------------- */
const EventEmitter = require('events');

const { THREAD_STATUS, THREAD_TYPE } = require('./consts');
const EvalWorker = require('./Worker/EvalWorker');
const ExecWorker = require('./Worker/ExecWorker');

class Thread extends EventEmitter {
  /**
   * @name constructor
   * @param {String} execContent [executable js path or executable code string]
   * @param {Enum} type [THREAD_TYPE.EXEC or THREAD_TYPE.EVAL]
   * @param {Object} options [options to create worker threads, the same as options in original `new Worker(filename, [options])`]
   */
  constructor(execContent, type, options = {}) {
    super();
    this.type = type;
    this.status = THREAD_STATUS.IDLE;
    this.worker = null;
    this.threadId = null;
    this.taskId = null;
    this.execPath = null;
    this.execString = null;
    this.options = options;
    if (type === THREAD_TYPE.EVAL) {
      this.execString = execContent;
    } else {
      this.execPath = execContent;
    }
    this._initWorker();
  }

  get isIdle() {
    return this.status === THREAD_STATUS.IDLE;
  }

  _initWorker() {
    if (this.type === THREAD_TYPE.EVAL) {
      this.worker = new EvalWorker(this.execString, this.options);
    } else {
      this.worker = new ExecWorker(this.execPath, this.options);
    }
    this.threadId = this.worker.threadId;
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
      taskId: this.taskId,
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
        task.start();
        this.worker.postMessage(task, task.transferList);
        this.taskId = task.taskId;
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