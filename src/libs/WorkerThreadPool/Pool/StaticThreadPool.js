const ThreadPool = require('./ThreadPool');
const StaticExecutor = require('../Executor/StaticExecutor');

class StaticThreadPool extends ThreadPool {
  static paramsCheckForSetup(options = {}) {
    const { execPath, execString, execFunction } = options;

    if (!execPath && !execString && !execFunction) {
      throw new Error(`StaticThreadPool: param - execPath/execString/execFunction is required!`);
    }
  }

  static paramsCheckForExec(options = {}) {
    const { execPath, execString, execFunction } = options;

    if (execPath || execString || execFunction) {
      throw new Error(`StaticThreadPool: param - execPath/execString/execFunction is not allowed in StaticThreadPool!`);
    }
  }

  /**
   * @param {Object} options [options to create pool]
   *  - @param {Function} execFunction [execution function, conflict with option - execPath/execString]
   *  - @param {String} execPath [execution file Path or execution file content, conflict with option - execString/execFunction]
   *  - @param {String} execString [execution file content, conflict with option - execPath/execFunction]
   *  - @param {Boolean} lazyLoad [whether to create threads lazily when the thread pool is initialized]
   *  - @param {Number} maxThreads [max threads count]
   *  - @param {Number} maxTasks [max tasks count]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Number} taskLoopTime [task queue refresh time]
   * @param {Object} threadOptions [options to create worker threads, the same as options in original `new Worker(filename, [options])`]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   *  ...
   */
  constructor(options = {}, threadOptions = {}) {
    super(options, threadOptions);
    this.type = 'static';
    StaticThreadPool.paramsCheckForSetup(options);
  }

  setExecPath() {
    throw new Error(`StaticThreadPool: function - setExecPath() is not allowed in StaticThreadPool!`)
  }

  setExecString() {
    throw new Error(`StaticThreadPool: function - setExecString() is not allowed in StaticThreadPool!`)
  }

  setExecFunction() {
    throw new Error(`StaticThreadPool: function - setExecFunction() is not allowed in StaticThreadPool!`)
  }

  /**
   * @name queue [save a request to queue]
   * @param {*} payload [request payload data to send]
   * @param {Object} options [options to create a task]
   *  - @param {Number} taskTimeout [task timeout in milliseconds]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   * @return {Promise}
   */
  queue(payload, options={}) {
    StaticThreadPool.paramsCheckForExec(options);
    return super.queue.call(this, payload, options);
  }

  /**
   * @name exec [send a request to pool]
   * @param {*} payload [request payload data to send]
   * @param {Object} options [options to create a task]
   *  - @param {Number} taskTimeout [task timeout in milliseconds]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   * @return {Promise}
   */
  exec = (payload, options={}) => {
    StaticThreadPool.paramsCheckForExec(options);
    return super.exec.call(this, payload, options);
  }

  /**
   * @name createExecutor [Create an executor to execute tasks]
   * @param {Object} options [options to create a task]
   *  - @param {Number} taskTimeout [task timeout in milliseconds]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   * @return {Promise}
   */
  createExecutor(options={}) {
    return new StaticExecutor(this, options);
  }

}

module.exports = StaticThreadPool;