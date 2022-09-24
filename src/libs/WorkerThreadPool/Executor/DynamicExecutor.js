const Executor = require('./Executor');

class DynamicExecutor extends Executor {
  constructor(options) {
    super(options);
    this.type = 'dynamic';
    this.execPath = options.execPath || null;
    this.execString = options.execString || null;
    this.execFunction = options.execFunction || null;
    this.paramsCheck(options);
  }

  paramsCheck(params) {
    if (!params.execFunction && !params.execPath && !params.execString) {
      throw new Error('DynamicExecutor: params - execPath/execString/execFunction is required');
    }
  }

  setExecPath(execPath) {
    this.execPath = execPath;
  }

  setExecString(execString) {
    this.execString = execString;
  }

  setExecFunction(execFunction) {
    this.execFunction = execFunction;
  }

  exec(payload) {
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