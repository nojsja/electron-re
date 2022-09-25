const Executor = require('./Executor');

class DynamicExecutor extends Executor {
  static paramsCheck({ execFunction, execPath, execString }) {
    if ((!execFunction) && (!execPath) && (!execString)) {
      throw new Error('DynamicExecutor: params - execPath/execString/execFunction is required');
    }
  }

  constructor(pool, options) {
    super(options);
    this.type = 'dynamic';
    this.parentPool = pool;
    this.execPath = options.execPath || null;
    this.execString = options.execString || null;
    this.execFunction = options.execFunction || null;
  }

  setExecPath(execPath) {
    this.execPath = execPath;
    this.execFunction = null;
    this.setExecString = null;

    return this;
  }

  setExecString(execString) {
    this.execString = execString;
    this.execPath = null;
    this.execFunction = null;

    return this;
  }

  setExecFunction(execFunction) {
    this.execFunction = execFunction;
    this.execString = null;
    this.execPath = null;

    return this;
  }

  exec(payload) {
    DynamicExecutor.paramsCheck(this);
    return this.parentPool.exec(payload, {
      taskTimeout: this.taskTimeout,
      transferList: this.transferList,
      taskRetry: this.taskRetry,
      execPath: this.execPath,
      execString: this.execString,
      execFunction: this.execFunction,
    });
  }
}

module.exports = DynamicExecutor;