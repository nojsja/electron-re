const { Task } = require('./Task');
const { TASK_STATUS } = require('./consts');
class TaskQueue {
  constructor({ maxLength=Infinity }) {
    this.queue = [];
    this.taskMap = new Map();
    this.maxLength = maxLength;
  }

  get length() {
    return this.queue.length;
  }

  get isFull() {
    return this.queue.length >= this.maxLength;
  }

  push(task) {
    if (task instanceof Task) {
      this.taskMap.set(task.taskId, task);
      this.queue.push(task);
    }
  }

  pop() {
    const task = this.queue.shift();
    if (task) this.taskMap.delete(task.taskId);

    return task || null;
  }

  getTask(taskId) {
    this.taskMap.get(taskId) || null;
  }

  /**
   * @name setTaskStatus [set single task status]
   * @param {String} taskId [task ID]
   * @param {Enum} taskStatus [task status]
   * @returns {void}
   */
  setTaskStatus(taskId, taskStatus) {
    const task = this.getTask(taskId);
    if (!task) return;

    switch (taskStatus) {
      case TASK_STATUS.PENDING:
        task.stop();
        break;
      case TASK_STATUS.RUNNING:
        task.start();
        break;
      case TASK_STATUS.SUCCESS:
        task.succeed();
        break;
      case TASK_STATUS.CANCELLED:
        task.cancel();
        break;
      case TASK_STATUS.FAILED:
        task.fail();
        break;
      default:
        console.warn('Task: invalid task status');
        break;
    }
  }

  /**
   * @name setTaskPayload [set single task payload]
   * @param {String} taskId [task ID]
   * @param {Any} payload [task payload]
   * @returns {void}
   */
  setTaskPayload(taskId, payload) {
    const task = this.getTask(taskId);
    if (!task) return;

    task.setPayload(payload);
  }

  removeTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) return;
    const index = this.queue.indexOf(task);

    this.taskMap.delete(taskId);
    if (index > -1) this.queue.splice(index, 1);
  }

  wipeTask() {
    this.taskMap.clear();
    this.queue = [];
  }
}

module.exports = TaskQueue;