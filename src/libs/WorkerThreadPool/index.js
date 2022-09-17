/* -------------------------------------------------------
  WorkerThreadPool:
    线程池通过维护一系列工作线程的创建、调用和销毁，最大化地提升多线程的工作效率。同时其自带的任务调度系统支持任务排队、繁忙等待、自动重试、任务拒绝等功能。
    线程池隔离线程的调度和任务的调度，具有高可用性和稳定性。
      - execPath - 工作线程的执行文件路径，使用 `module.exports = () => {...}` 进行任务导出。
      - execString - 工作线程的执行代码字符串。
      - lazyLoad - 是否延迟创建工作线程，默认true，当调用线程池时动态创建，否则线程池初始化后全量创建。
      - maxThreads - 线程池最大线程数，默认50。
      - maxTasks - 线程池任务队列最大长度，默认100，超出限制后抛出错误，可设置为无限大。
      - taskTimeout - 单个任务超时时间，默认30S。
      - taskRetry - 失败任务重试次数，默认0，不重试，最大可设置值5。
      - taskQueue - 任务队列，目前没有空闲线程时，任务排队等待。
------------------------------------------------------- */

const EventEmitter = require('events');

class WorkerThreadPool extends EventEmitter {
  static DefaultOptions = {
    lazyLoad: true,
    maxThreads: 50,
    maxTasks: 100,
    taskTimeout: 30e3,
    taskRetry: 0,
  }
  static maxTaskRetry = 5
  static maxTaskTimeout = 100

  constructor(options = {}) {
    super();
    this.options = Object.assign(
      WorkerThreadPool.DefaultOptions,
      { taskRetry: options.taskRetry },
      options
    );
    this.taskQueue = [];
    this.taskMap = new WeakMap();
  }

  paramsCheck(options = {}) {
    const { taskRetry, taskTimeout, maxThreads, maxTasks } = options;

    if (taskRetry !== undefined && (taskRetry > WorkerThreadPool.maxTaskRetry || taskRetry < 0)) {
      throw new Error(`WorkerThreadPool: param - taskRetry must be an positive integer that no more than ${WorkerThreadPool.maxTaskRetry}.`);
    }
    if (maxThreads !== undefined && (!Number.isInteger(maxThreads) || maxThreads < 1)) {
      throw new Error('WorkerThreadPool: param - maxThreads must be an positive integer.');
    }
    if (maxTasks !== undefined && (!Number.isInteger(maxTasks) || maxTasks < 1)) {
      throw new Error('WorkerThreadPool: param - maxTasks must be an positive integer.');
    }
    if (taskTimeout !== undefined && (!Number.isInteger(taskTimeout) || taskTimeout < 100)) {
      throw new Error(`WorkerThreadPool: param - taskTimeout must be an positive integer that no less than ${WorkerThreadPool.maxTaskTimeout}ms.`);
    }
  }

  /**
   * send [send a request to pool]
   * @param {*} payload [request payload]
   * @return {Promise}
   */
  send(payload) {}

  /**
   * wipeTask [wipe all tasks of queue]
   * @return {Promise}
   */
  wipeTaskQueue() {
    this.taskQueue = [];
  }

  /**
   * setMaxThreads [set max thread count]
   * @param {Number} maxThreads
   */
  setMaxThreads(maxThreads) {
    this.paramsCheck({ maxThreads });
    this.maxThreads = maxThreads;
  }

  /**
   * setMaxTasks [set max task count]
   * @param {Number} maxTasks
   */
  setMaxTasks(maxTasks) {
    this.paramsCheck({ maxTasks });
    this.maxTasks = maxTasks;
  }

  /**
   * setTaskTimeout [set task timeout]
   * @param {Number} timeout
   */
  setTaskTimeout(taskTimeout) {
    this.paramsCheck({ taskTimeout });
    this.taskTimeout = timeout;
  }

  /**
   * setTaskRetry [set task retry count]
   * @param {Number} taskRetry
   */
  setTaskRetry(taskRetry) {
    this.paramsCheck({ taskRetry });
    this.taskRetry = taskRetry;
  }

}

module.exports = WorkerThreadPool;