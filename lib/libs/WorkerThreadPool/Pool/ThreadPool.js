"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _excluded = ["taskId", "threadId", "code"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/* -------------------------------------------------------
  WorkerThreadPool:
    线程池通过维护一系列工作线程的创建、调用和销毁，最大化地提升多线程的工作效率。同时其自带的任务调度系统支持任务排队、繁忙等待、自动重试、任务拒绝等功能。
    线程池隔离线程的调度和任务的调度，具有高可用性和稳定性。
      - lazyLoad - 是否延迟创建工作线程，默认true，当调用线程池时动态创建，否则线程池初始化后全量创建。
      - maxThreads - 线程池最大线程数，默认50。
      - maxTasks - 线程池任务队列最大长度，默认100，超出限制后抛出错误，可设置为无限大。
      - taskRetry - 失败任务重试次数，默认0，不重试，最大可设置值5。
      - taskTime - 任务队列刷新时间间隔，默认1000ms。
      - taskQueue - 任务队列，目前没有空闲线程时，任务排队等待。
------------------------------------------------------- */
var EventEmitter = require('events');

var TaskQueue = require('../TaskQueue');

var Thread = require('../Thread');

var Task = require('../Task');

var _require = require('../utils'),
    funcStringify = _require.funcStringify;

var _require2 = require('../consts'),
    THREAD_TYPE = _require2.THREAD_TYPE,
    CODE = _require2.CODE,
    TASK_TYPE = _require2.TASK_TYPE,
    CONF = _require2.CONF;

var ThreadPool = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(ThreadPool, _EventEmitter);

  var _super = _createSuper(ThreadPool);

  /**
   * @param {Object} options [options to create pool]
   *  - @param {Function} execFunction [execution function, conflict with option - execPath/execString]
   *  - @param {String} execPath [execution file Path or execution file content, conflict with option - execString/execFunction]
   *  - @param {String} execString [execution file content, conflict with option - execPath/execFunction]
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
  function ThreadPool() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var threadOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, ThreadPool);
    _this = _super.call(this);

    _this._initTaskTimer = function () {
      _this.taskTimer = setInterval(function () {
        _this._checkTaskTimeout();

        var task = _this.taskQueue.pop();

        while (task && _this.consumeTask(task)) {
          task = _this.taskQueue.pop();
        }
      }, _this.options.taskLoopTime);
    };

    _this._onThreadResponse = function (_ref) {
      var taskId = _ref.taskId,
          threadId = _ref.threadId,
          code = _ref.code,
          others = (0, _objectWithoutProperties2["default"])(_ref, _excluded);

      var task = _this.taskQueue.getTask(taskId);

      var callback = _this._callbacks[taskId];

      if (code === CODE.SUCCESS) {
        callback && callback.resolve(others);

        _this.cleanTask(taskId);
      } else {
        if (task && task.isRetryable) {
          _this.retryTask(taskId, others);
        } else {
          callback && callback.reject(others);

          _this.cleanTask(taskId);
        }
      }

      var pendingTask = _this.taskQueue.pop();

      pendingTask && _this.consumeTask(pendingTask);
    };

    _this._onThreadExit = function (info) {
      var taskId = info.taskId,
          threadId = info.threadId;
      var callback = _this._callbacks[taskId];
      _this.threadPool = _this.threadPool.filter(function (thread) {
        return thread.id !== threadId;
      });
      callback && callback.reject(info);

      _this.cleanTask(taskId);

      _this.emit('thread:exit', info);
    };

    _this.options = Object.assign(ThreadPool.defaultOptions, options);

    if (options.execFunction || options.execString) {
      _this.options.type = THREAD_TYPE.EVAL;
      _this.execString = options.execString || funcStringify(execFunction);
    }

    if (options.execPath) {
      _this.options.type = THREAD_TYPE.EXEC;
      _this.execPath = options.execPath;
    }

    _this.threadOptions = threadOptions;
    ThreadPool.paramsCheck(_this.options);
    _this.taskQueue = new TaskQueue({
      maxLength: _this.options.maxTasks
    });
    _this.threadPool = [];
    _this._callbacks = {};
    _this.taskTimer = null;

    _this._initTaskTimer();

    if (!_this.options.lazyLoad) {
      _this.fillPoolWithIdleThreads();
    }

    return _this;
  }

  (0, _createClass2["default"])(ThreadPool, [{
    key: "isFull",
    get: function get() {
      return this.threadPool.length >= this.options.maxThreads;
    }
  }, {
    key: "threadLength",
    get: function get() {
      return this.threadPool.length;
    }
  }, {
    key: "taskLength",
    get: function get() {
      return this.taskQueue.length;
    }
  }, {
    key: "idleThread",
    get: function get() {
      return this.threadPool.find(function (thread) {
        return thread.isIdle;
      });
    }
  }, {
    key: "_checkTaskTimeout",
    value: function _checkTaskTimeout() {
      var threads = this.threadPool;
      var length = threads.length;
      var task;

      for (var i = 0; i < length; i++) {
        if (!threads[i].isWorking) continue;
        task = this.taskQueue.getTask(threads[i].taskId);
        if (!task) continue;

        if (task.isTimeout) {
          threads[i].terminate();
        }
      }
    }
  }, {
    key: "_cancelTaskTimer",
    value: function _cancelTaskTimer() {
      clearInterval(this.taskTimer);
      this.taskTimer = null;
    }
  }, {
    key: "_handleThreadEvent",
    value: function _handleThreadEvent(thread) {
      var _this2 = this;

      if (!thread) return;
      thread.on('response', this._onThreadResponse);
      thread.on('error', function (err) {
        _this2.emit('thread:error', {
          threadId: thread.threadId,
          error: err
        });
      });
      thread.on('exit', this._onThreadExit);
    }
  }, {
    key: "fillPoolWithIdleThreads",
    value: function fillPoolWithIdleThreads() {
      var _this3 = this;

      var countToFill = this.options.maxThreads - this.threadPool.length;
      var threads = new Array(countToFill).fill(0).map(function () {
        var thread = ThreadPool.generateNewThread(_objectSpread(_objectSpread({}, _this3.threadOptions), {}, {
          execPath: _this3.execPath,
          execString: _this3.execString
        }));

        _this3._handleThreadEvent(thread);

        return thread;
      });
      this.threadPool = this.threadPool.concat(threads);
      return this;
    }
  }, {
    key: "retryTask",
    value: function retryTask(taskId, others) {
      var isSuccessful = this.taskQueue.retryTask(taskId);

      if (!isSuccessful) {
        var callback = this._callbacks[taskId];
        callback && callback.reject(others);
        this.cleanTask(taskId);
      }
    }
  }, {
    key: "cleanTask",
    value: function cleanTask(taskId) {
      var task = this.taskQueue.getTask(taskId);
      delete this._callbacks[taskId];
      if (!task) return;
      this.taskQueue.removeTask(taskId);
    }
    /**
     * @name consumeTask [consume task in taskQueue]
     * @param {Task} task [pending task]
     * @returns {Boolean} [whether consume task successfully]
     */

  }, {
    key: "consumeTask",
    value: function consumeTask(task) {
      if (!(task instanceof Task)) return false;

      if (!this.isFull) {
        var isDynamic = task.execPath || task.execString;
        var execString = isDynamic ? task.execString : this.execString;
        var execPath = isDynamic ? task.execPath : this.execPath;
        var thread = ThreadPool.generateNewThread(_objectSpread(_objectSpread({}, this.threadOptions), {}, {
          execString: execString,
          execPath: execPath
        }));

        this._handleThreadEvent(thread);

        this.threadPool.push(thread);
        thread.runTask(task);
      } else {
        var idleThread = this.idleThread;
        if (!idleThread) return false;
        idleThread.runTask(task);
      }

      return true;
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

  }, {
    key: "exec",
    value: function exec(payload) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      ThreadPool.paramsCheck(options);
      return new Promise(function (resolve, reject) {
        var poolOptions = _this4.options;
        var threadOptions = _this4.threadOptions;
        var isDynamic = options.execFunction || options.execPath || options.execString;
        var execString = isDynamic ? options.execFunction ? funcStringify(options.execFunction) : options.execString : _this4.execString;
        var execPath = isDynamic ? options.execPath : _this4.execPath;
        var taskOptions = {
          execPath: execPath,
          execString: execString,
          taskRetry: options.taskRetry || poolOptions.taskRetry,
          transferList: options.transferList || threadOptions.transferList,
          taskTimeout: options.taskTimeout || poolOptions.taskTimeout
        };
        ThreadPool.paramsCheckForExec(taskOptions);
        var task = ThreadPool.generateNewTask(payload, taskOptions);

        if (!_this4.isFull) {
          var thread = ThreadPool.generateNewThread(_objectSpread(_objectSpread({}, _this4.threadOptions), {}, {
            execString: execString,
            execPath: execPath
          }));

          _this4._handleThreadEvent(thread);

          _this4.threadPool.push(thread);

          _this4.taskQueue.remember(task);

          thread.runTask(task);
        } else {
          var idleThread = _this4.idleThread;

          if (idleThread) {
            _this4.taskQueue.remember(task);

            idleThread.runTask(task);
          } else if (!_this4.taskQueue.isFull) {
            _this4.taskQueue.push(task);
          } else {
            throw new Error('WorkerThreadPool: no idle thread and task queue is full.');
          }
        }

        _this4._callbacks[task.taskId] = {
          resolve: resolve,
          reject: reject
        };
      });
    }
    /**
     * @name wipeTask [wipe all tasks of queue]
     */

  }, {
    key: "wipeTaskQueue",
    value: function wipeTaskQueue() {
      this.taskQueue.wipeTask();
      return this;
    }
    /**
     * @name wipeThreadPool [wipe all threads of pool]
     */

  }, {
    key: "wipeThreadPool",
    value: function wipeThreadPool() {
      this.threadPool = [];
      this._callbacks = {};
      return this;
    }
    /**
     * @name setMaxThreads [set max thread count]
     * @param {Number} maxThreads
     */

  }, {
    key: "setMaxThreads",
    value: function setMaxThreads(maxThreads) {
      ThreadPool.paramsCheck({
        maxThreads: maxThreads
      });
      this.options.maxThreads = maxThreads;
      return this;
    }
    /**
     * @name setMaxTasks [set max task count]
     * @param {Number} maxTasks
     */

  }, {
    key: "setMaxTasks",
    value: function setMaxTasks(maxTasks) {
      ThreadPool.paramsCheck({
        maxTasks: maxTasks
      });
      this.taskQueue.setMaxLength(maxTasks);
      return this;
    }
    /**
     * @name setTaskLoopTime [set task loop time]
     * @param {Number} taskLoopTime
     */

  }, {
    key: "setTaskLoopTime",
    value: function setTaskLoopTime(taskLoopTime) {
      ThreadPool.paramsCheck({
        taskLoopTime: taskLoopTime
      });
      this.options.taskLoopTime = taskLoopTime;
      return this;
    }
    /**
     * @name setTaskRetry [set task retry count]
     * @param {Number} taskRetry
     */

  }, {
    key: "setTaskRetry",
    value: function setTaskRetry(taskRetry) {
      ThreadPool.paramsCheck({
        taskRetry: taskRetry
      });
      this.options.taskRetry = taskRetry;
      return this;
    }
    /**
     * @name setTransferList [set transfer list for worker threads]
     * @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
     */

  }, {
    key: "setTransferList",
    value: function setTransferList(transferList) {
      this.threadOptions.transferList = transferList;
      return this;
    }
  }, {
    key: "setExecPath",
    value: function setExecPath(execPath) {
      this.execPath = execPath;
      this.execString = null;
      this.options.type = THREAD_TYPE.EXEC;
      return this;
    }
  }, {
    key: "setExecString",
    value: function setExecString(execString) {
      this.execString = execString;
      this.execPath = null;
      this.options.type = THREAD_TYPE.EVAL;
      return this;
    }
  }, {
    key: "setExecFunction",
    value: function setExecFunction(execFunction) {
      this.execString = funcStringify(execFunction);
      this.execPath = null;
      this.options.type = THREAD_TYPE.EVAL;
      return this;
    }
  }], [{
    key: "generateNewThread",
    value: function generateNewThread(options) {
      return new Thread(options);
    }
  }, {
    key: "generateNewTask",
    value: function generateNewTask(payload) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var taskType = TASK_TYPE.STATIC;

      if (options.execPath || options.execString) {
        taskType = TASK_TYPE.DYNAMIC;
      }

      return new Task(payload, _objectSpread({
        taskType: taskType
      }, options));
    }
  }, {
    key: "paramsCheck",
    value: function paramsCheck() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var taskRetry = options.taskRetry,
          maxThreads = options.maxThreads,
          maxTasks = options.maxTasks,
          taskLoopTime = options.taskLoopTime;

      if (taskRetry !== undefined && (taskRetry > ThreadPool.maxTaskRetry || taskRetry < 0)) {
        throw new Error("WorkerThreadPool: param - taskRetry must be an positive integer that no more than ".concat(ThreadPool.maxTaskRetry, "."));
      }

      if (maxThreads !== undefined && (!Number.isInteger(maxThreads) || maxThreads < 1)) {
        throw new Error('WorkerThreadPool: param - maxThreads must be an positive integer.');
      }

      if (maxTasks !== undefined && (!Number.isInteger(maxTasks) || maxTasks < 1)) {
        throw new Error('WorkerThreadPool: param - maxTasks must be an positive integer.');
      }

      if (taskLoopTime !== undefined && (!Number.isInteger(taskLoopTime) || taskLoopTime < ThreadPool.minTaskLoopTime)) {
        throw new Error("WorkerThreadPool: param - taskTimer must be an positive integer that no less than ".concat(ThreadPool.minTaskLoopTime, "ms."));
      }
    }
  }, {
    key: "paramsCheckForExec",
    value: function paramsCheckForExec() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var execPath = options.execPath,
          execString = options.execString;

      if (!execPath && !execString) {
        throw new Error("WorkerThreadPool: param - execPath/execString is required!");
      }
    }
  }]);
  return ThreadPool;
}(EventEmitter);

ThreadPool.defaultOptions = {
  lazyLoad: CONF.DEFAULT_LAZYLOAD,
  maxThreads: CONF.DEFAULT_MAX_THREADS,
  maxTasks: CONF.DEFAULT_MAX_TASKS,
  taskRetry: CONF.DEFAULT_TASK_RETRY,
  taskLoopTime: CONF.DEFAULT_TASK_LOOP_TIME,
  taskTimeout: CONF.DEFAULT_TASK_TIMEOUT
};
ThreadPool.maxTaskRetry = CONF.MAX_TASK_RETRY;
ThreadPool.minTaskLoopTime = CONF.MIN_TASK_LOOP_TIME;
module.exports = ThreadPool;