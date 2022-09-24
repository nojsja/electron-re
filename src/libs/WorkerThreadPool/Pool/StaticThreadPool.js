const ThreadPool = require('./ThreadPool');
const StaticExecutor = require('../Executor/StaticExecutor');

class StaticThreadPool extends ThreadPool {
  /**
   * @param {String} execContent [thread executable js file path or file content, work with `options.type`]
   * @param {Object} options [options to create pool]
   *  - @param {Boolean} lazyLoad [whether to create threads lazily when the thread pool is initialized]
   *  - @param {Number} maxThreads [max threads count]
   *  - @param {Number} maxTasks [max tasks count]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Number} taskLoopTime [task queue refresh time]
   *  - @param {Enum} type [thread type - THREAD_TYPE.EXEC or THREAD_TYPE.EVAL]
   * @param {Object} threadOptions [options to create worker threads, the same as options in original `new Worker(filename, [options])`]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   *  ...
   */
  constructor(execContent, options = {}, threadOptions = {}) {
    super(execContent, options, threadOptions);
    this.type = 'static';
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
    return super.exec.call(this, payload, options);
  }

  createExecutor(options) {
    return new StaticExecutor(this, options);
  }

}

module.exports = StaticThreadPool;