const ThreadPool = require('./ThreadPool');
const DynamicExecutor = require('../Executor/DynamicExecutor');

class DynamicThreadPool extends ThreadPool {
  static paramsCheckForSetup(options = {}) {
    const {
      execPath, execString, execFunction, lazyLoad,
    } = options;

    if (execPath || execString || execFunction) {
      throw new Error(`DynamicThreadPool: option - execPath/execString/execFunction is not allowed in constructor of DynamicThreadPool!`);
    }

    if ((lazyLoad !== undefined) && (!!lazyLoad === false)) {
      throw new Error(`DynamicThreadPool: option - lazyLoad is not allowed in DynamicThreadPool!`);
    }
  }

  static paramsCheckForExec(options = {}) {
    const { execPath, execString, execFunction } = options;

    if (!execPath && !execString && !execFunction) {
      throw new Error(`DynamicThreadPool: necessary param - execPath/execString/execFunction is not found! use setExecPath/setExecString/setExecFunction to set it!`);
    }
  }

  /**
   * @param {Object} options [options to create pool]
   *  - @param {Number} maxThreads [max threads count]
   *  - @param {Number} maxTasks [max tasks count]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Number} taskTimeout [task timeout time]
   *  - @param {Number} taskLoopTime [task queue refresh time]
   * @param {Object} threadOptions [options to create worker threads, the same as options in original `new Worker(filename, [options])`]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   *  ...
   */
  constructor(options = {}, threadOptions = {}) {
    super({
      ...options,
      lazyLoad: true,
    }, threadOptions);
    this.type = 'dynamic';
    DynamicThreadPool.paramsCheckForSetup(options);
  }

  /**
   * @name exec [send a request to pool]
   * @param {*} payload [request payload data to send]
   * @param {Object} options [options to create a task]
   *  - @param {Function} execFunction [execution function, conflict with option - execPath/execString]
   *  - @param {String} execPath [execution file Path or execution file content, conflict with option - execString/execFunction]
   *  - @param {String} execString [execution file content, conflict with option - execPath/execFunction]
   *  - @param {Number} taskTimeout [task timeout in milliseconds]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   * @return {Promise}
   */
  exec = (payload, options={}) => {
    DynamicThreadPool.paramsCheckForExec(Object.assign({}, options, this));
    return super.exec.call(this, payload, options);
  }

  fillPoolWithIdleThreads() {
    throw new Error(`DynamicThreadPool: function - fillPoolWithIdleThreads() is not allowed in DynamicThreadPool!`)
  }

  createExecutor(options={}) {
    return new DynamicExecutor(this, options);
  }

}

module.exports = DynamicThreadPool;