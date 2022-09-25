class Executor {
  static paramsCheck({ taskRetry, taskTimeout }) {
    if (taskRetry !== undefined && (taskRetry > ThreadPool.maxTaskRetry || taskRetry < 0)) {
      throw new Error(`WorkerThreadPool: param - taskRetry must be an positive integer that no more than ${ThreadPool.maxTaskRetry}.`);
    }
    if (taskTimeout !== undefined && (taskTimeout < 0)) {
      throw new Error(`WorkerThreadPool: param - taskTimeout must be an positive integer.`);
    }
  }
  static defaultOptions = {
    taskRetry: 0,
    taskTimeout: 60e3,
  }
  static maxTaskRetry = 5;

  constructor({
    taskTimeout,
    transferList,
    taskRetry,
  }) {
    this.taskTimeout = taskTimeout;
    this.transferList = transferList;
    this.taskRetry = taskRetry;
    Executor.paramsCheck({
      taskRetry: this.taskRetry,
      taskTimeout: this.taskTimeout,
    });
  }

  /**
   * @name setTaskRetry [set task retry count]
   * @param {Number} taskRetry
   */
  setTaskRetry(taskRetry) {
    Executor.paramsCheck({ taskRetry });
    this.options.taskRetry = taskRetry;

    return this;
  }

  /**
   * @name setTransferList [set transfer list for worker threads]
   * @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   */
  setTransferList(transferList) {
    this.transferList = transferList;

    return this;
  }
}

module.exports = Executor;