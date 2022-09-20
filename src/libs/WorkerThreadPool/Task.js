/* -------------------------------------------------------
  Task:
    任务具有唯一的任务ID，每个任务还可以携带一些附加数据(payload)传递给线程实例。
    - taskId：任务ID
    - payload：附加数据
    - status：任务状态
------------------------------------------------------- */
const { getRandomString } = require('../utils');
const { TASK_STATUS, TASK_TYPE } = require('./consts');

class Task {
  static defaultOptions = {
    maxTaskRetry: 0,
    type: TASK_TYPE.STATIC,
  }
  static generateTaskId(symbol) {
    return `${symbol}_${getRandomString()}`;
  }

  constructor(payload, options = {}) {
    this.taskId = Task.generateTaskId('task');
    this.status = TASK_STATUS.PENDING;
    this.payload = payload;
    this.taskRetry = 0;
    this.taskType = options.taskType || TASK_TYPE.STATIC;
    this.execPath = options.execPath || null;
    this.execString = options.execString || null;
    this.maxTaskRetry = options.maxTaskRetry || Task.defaultOptions.maxTaskRetry;
  }

  stop() {
    this.status = TASK_STATUS.PENDING;
  }

  start() {
    this.status = TASK_STATUS.RUNNING;
  }

  get isRetryable() {
    return this.taskRetry < this.maxTaskRetry;
  }

  get isPending() {
    return this.status === TASK_STATUS.PENDING;
  }

  retry() {
    this.taskRetry += 1;
    this.status = TASK_STATUS.PENDING;
  }

  cancel() {
    this.status = TASK_STATUS.CANCELLED;
  }

  fail() {
    this.status = TASK_STATUS.FAILED;
  }

  succeed() {
    this.status = TASK_STATUS.SUCCESS;
  }

  setPayload(payload) {
    this.payload = payload;
  }
}

module.exports = Task;