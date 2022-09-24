const Executor = require('./Executor');

class StaticExecutor extends Executor {
  constructor(parentPool, options) {
    super(options);
    this.parentPool = parentPool;
    this.type = 'static';
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