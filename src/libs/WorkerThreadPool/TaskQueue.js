const Task = require('./Task');
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

  remember(task) {
    if (task instanceof Task) {
      this.taskMap.set(task.taskId, task);
    }
  }

  forget(taskId) {
    this.taskMap.delete(taskId)
  }

  push(task) {
    if (task instanceof Task) {
      this.remember(task);
      this.queue.push(task);
    }
  }

  pop() {
    const length = this.length;
    for (let i = 0; i < length; i++) {
      if (this.queue[i].isPending) {
        return this.queue[i];
      }
    }

    return null;
  }

  getTask(taskId) {
    return this.taskMap.get(taskId) || null;
  }

  retryTask(taskId) {
    const task = this.getTask(taskId);

    if (!task) {
      if (this.isFull) return false;
      this.queue.push(task);
    } else {
      const removedTask = this.removeTask(taskId);
      this.push(removedTask);
      task.retry();
    }
    return true;
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
    if (!task) return null;
    const index = this.queue.indexOf(task);

    this.forget(taskId);
    if (index > -1) this.queue.splice(index, 1);

    return task;
  }

  wipeTask() {
    this.taskMap.clear();
    this.queue = [];
  }

  /**
   * setMaxLength [set max task queue length]
   * @param {Number} length
   */
   setMaxLength(length) {
    this.maxLength = length;
  }
}

module.exports = TaskQueue;