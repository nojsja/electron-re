const Executor = require('./Executor');

class StaticExecutor extends Executor {
  constructor(parentPool, options) {
    super(options);
    this.parentPool = parentPool;
    this.type = 'static';
  }

  queue(payload) {
    return this.parentPool.queue(payload, {
      taskTimeout: this.taskTimeout,
      transferList: this.transferList,
      taskRetry: this.taskRetry,
    });
  }

  exec(payload) {
    return this.parentPool.exec(payload, {
      taskTimeout: this.taskTimeout,
      transferList: this.transferList,
      taskRetry: this.taskRetry,
    });
  }
}

module.exports = StaticExecutor;