"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Task = require('./Task');

var _require = require('./consts'),
    TASK_STATUS = _require.TASK_STATUS;

var TaskQueue = /*#__PURE__*/function () {
  function TaskQueue(_ref) {
    var _ref$maxLength = _ref.maxLength,
        maxLength = _ref$maxLength === void 0 ? Infinity : _ref$maxLength;
    (0, _classCallCheck2["default"])(this, TaskQueue);
    this.queue = [];
    this.taskMap = new Map();
    this.maxLength = maxLength;
  }

  (0, _createClass2["default"])(TaskQueue, [{
    key: "length",
    get: function get() {
      return this.queue.length;
    }
  }, {
    key: "isFull",
    get: function get() {
      return this.queue.length >= this.maxLength;
    }
  }, {
    key: "remember",
    value: function remember(task) {
      if (task instanceof Task) {
        this.taskMap.set(task.taskId, task);
      }
    }
  }, {
    key: "forget",
    value: function forget(taskId) {
      this.taskMap["delete"](taskId);
    }
  }, {
    key: "push",
    value: function push(task) {
      if (task instanceof Task) {
        this.remember(task);
        this.queue.push(task);
      }
    }
  }, {
    key: "pop",
    value: function pop() {
      var length = this.length;

      for (var i = 0; i < length; i++) {
        if (this.queue[i].isPending) {
          return this.queue[i];
        }
      }

      return null;
    }
  }, {
    key: "getTask",
    value: function getTask(taskId) {
      return this.taskMap.get(taskId) || null;
    }
  }, {
    key: "retryTask",
    value: function retryTask(taskId) {
      var task = this.getTask(taskId);

      if (!task) {
        if (this.isFull) return false;
        this.queue.push(task);
      } else {
        var removedTask = this.removeTask(taskId);
        this.push(removedTask);
        task.retry();
      }

      return true;
    }
    /**
     * @name setTaskStatus [set single task status]
     * @param {String} taskId [task ID]
     * @param {Enum} taskStatus [task status]
     * @returns {void}
     */

  }, {
    key: "setTaskStatus",
    value: function setTaskStatus(taskId, taskStatus) {
      var task = this.getTask(taskId);
      if (!task) return;

      switch (taskStatus) {
        case TASK_STATUS.PENDING:
          task.stop();
          break;

        case TASK_STATUS.RUNNING:
          task.start();
          break;

        case TASK_STATUS.SUCCESS:
          task.succeed();
          break;

        case TASK_STATUS.CANCELLED:
          task.cancel();
          break;

        case TASK_STATUS.FAILED:
          task.fail();
          break;

        default:
          console.warn('Task: invalid task status');
          break;
      }
    }
    /**
     * @name setTaskPayload [set single task payload]
     * @param {String} taskId [task ID]
     * @param {Any} payload [task payload]
     * @returns {void}
     */

  }, {
    key: "setTaskPayload",
    value: function setTaskPayload(taskId, payload) {
      var task = this.getTask(taskId);
      if (!task) return;
      task.setPayload(payload);
    }
  }, {
    key: "removeTask",
    value: function removeTask(taskId) {
      var task = this.getTask(taskId);
      if (!task) return null;
      var index = this.queue.indexOf(task);
      this.forget(taskId);
      if (index > -1) this.queue.splice(index, 1);
      return task;
    }
  }, {
    key: "wipeTask",
    value: function wipeTask() {
      this.taskMap.clear();
      this.queue = [];
    }
    /**
     * setMaxLength [set max task queue length]
     * @param {Number} length
     */

  }, {
    key: "setMaxLength",
    value: function setMaxLength(length) {
      this.maxLength = length;
    }
  }]);
  return TaskQueue;
}();

module.exports = TaskQueue;