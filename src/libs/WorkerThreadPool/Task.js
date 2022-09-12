/* -------------------------------------------------------
  Task:
    任务具有唯一的任务ID，每个任务还可以携带一些附加数据(payload)传递给线程实例。
    - taskId：任务ID
    - payload：附加数据
    - status：任务状态
------------------------------------------------------- */
const { getRandomString } = require('../utils');
const { TASK_STATUS } = require('./consts');

class Task {
  static generateTaskId(symbol) {
    return `${symbol}_${getRandomString()}`;
  }

  constructor(payload) {
    this.taskId = Task.generateTaskId('task');
    this.status = TASK_STATUS.PENDING;
    this.payload = payload;
  }

  start() {
    this.status = TASK_STATUS.RUNNING;
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
}

module.exports = Task;