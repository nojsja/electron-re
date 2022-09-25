const ThreadPool = require('./ThreadPool');

class DynamicThreadPool extends ThreadPool {
  /**
   * @param {Object} options [options to create pool]
   *  - @param {Boolean} lazyLoad [whether to create threads lazily when the thread pool is initialized]
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
    super(options, threadOptions);
    this.type = 'dynamic';
    this._paramsCheckForSetup(options);
  }

  _paramsCheckForSetup(options = {}) {
    const { execPath, execString, execFunction } = options;

    if (execPath || execString || execFunction) {
      throw new Error(`DynamicThreadPool: param - execPath, execString and execFunction are not allowed in DynamicThreadPool!`);
    }
  }

  _paramsCheckForExec(options = {}) {
    const { execPath, execString, execFunction } = options;

    if (!execPath && !execString && !execFunction) {
      throw new Error(`DynamicThreadPool: exec param - execPath/execString/execFunction is required!`);
    }
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
    this._paramsCheckForExec(options);
    return super.exec.call(this, payload, options);
  }

  createExecutor(options) {
    return new StaticExecutor(this, options);
  }

}

module.exports = DynamicThreadPool;