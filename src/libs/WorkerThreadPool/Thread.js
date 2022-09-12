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
const EvalWorker = require('./EvalWorker');
const ExecWorker = require('./ExecWorker');

class Thread extends EventEmitter {
  constructor(execContent, type) {
    super();
    this.type = type;
    this.status = THREAD_STATUS.IDLE;
    this.worker = null;
    this.execPath = null;
    this.execString = null;
    if (type === THREAD_TYPE.EVAL) {
      this.execString = execContent;
    } else {
      this.execPath = path.resolve(execContent);
    }
    this.init();
  }

  init() {
    if (this.type === THREAD_TYPE.EVAL) {
      this.worker = new EvalWorker(this.execString);
    } else {
      this.worker = new ExecWorker(this.execPath);
    }
  }

  run() {}

  stop() {}
}

module.exports = Thread;