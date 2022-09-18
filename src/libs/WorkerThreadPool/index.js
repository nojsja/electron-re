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
const { THREAD_TYPE } = require('./consts');

const TaskQueue = require('./TaskQueue');
const Thread = require('./Thread');

class WorkerThreadPool extends EventEmitter {
  static DefaultOptions = {
    lazyLoad: true,
    maxThreads: 50,
    maxTasks: 100,
    taskTimeout: 30e3,
    taskRetry: 0,
    type: THREAD_TYPE.EXEC,
    execContent: '',
  }
  static maxTaskRetry = 5
  static maxTaskTimeout = 100
  static generateNewThread(execContent, type) {
    if (type !== THREAD_TYPE.EVAL || type !== THREAD_TYPE.EXEC) {
      throw new Error('WorkerThreadPool: param - type must be THREAD_TYPE.EVAL or THREAD_TYPE.EXEC.');
    }
    return new Thread(execContent, type);
  }
  static generateNewTask(payload) {
    return new Thread(payload);
  }

  constructor(options = {}) {
    super();
    this.options = Object.assign(
      WorkerThreadPool.DefaultOptions,
      { taskRetry: options.taskRetry },
      options
    );
    this.taskQueue = new TaskQueue({
      maxLength: this.options.maxTasks,
    });
    this.threadPool = [];
    this._callbacks = {};
    if (!this.options.lazyLoad) {
      this.fillPoolWithIdleThreads();
    }
  }

  get isFull() {
    return this.threadPool.length >= this.options.maxThreads;
  }

  get IdleThread() {
    return this.threadPool.find(thread => thread.isIdle);
  }

  _handleThreadEvent(thread) {
    if (!thread) return;

    thread.on('message', this._onThreadResponse);
    thread.on('error', (err) => {
      this.emit('thread:error', {
        threadId: thread.threadId,
        error: err,
      });
    });
    thread.on('exit', this._onThreadExit);
  }

  _onThreadResponse = ({ taskId, threadId, code, ...others }) => {
    const task = this.taskQueue.getTask(taskId);
    if (!task) return;

    const callback = this._callbacks[taskId];
    delete this._callbacks[taskId];
    this.taskQueue.removeTask(taskId);

    if (callback) {
      if (code === 0) {
        callback.resolve(others);
      } else {
        callback.reject(others);
      }
    }
  }

  _onThreadExit = (info) => {
    const { taskId, threadId } = info;
    const callback = this._callbacks[taskId];

    this.taskQueue.removeTask(taskId);
    this.threadPool = this.threadPool.filter((thread) => thread.id !== threadId);
    if (callback) {
      delete this._callbacks[taskId];
      callback.reject(info);
    }
    this.emit('thread:exit', info);
  };

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

  fillPoolWithIdleThreads() {
    const countToFill = this.options.maxThreads - this.threadPool.length;
    const threads = new Array(countToFill).fill(0).map(() => {
      const thread = WorkerThreadPool.generateNewThread(this.options.execContent, this.options.type);
      this._handleThreadEvent(thread);
      return thread;
    });
    this.threadPool = this.threadPool.concat(threads);
  }

  /**
   * send [send a request to pool]
   * @param {*} payload [request payload]
   * @return {Promise}
   */
  send(payload) {
    return new Promise((resolve, reject) => {
      const task = WorkerThreadPool.generateNewTask(payload);

      if (!this.isFull) {
        const thread = WorkerThreadPool.generateNewThread(this.options.execContent, this.options.type);
        this._handleThreadEvent(thread);
        this.threadPool.push(thread);
        thread.runTask(task);
      } else {
        const idleThread = this.IdleThread;
        if (idleThread) {
          idleThread.runTask(task);
        } else if (!this.taskQueue.isFull) {
          this.taskQueue.push(task);
        } else {
          throw new Error('WorkerThreadPool: no idle thread and task queue is full.');
        }
      }
      this._callbacks[task.taskId] = { resolve, reject };
    });
  }


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