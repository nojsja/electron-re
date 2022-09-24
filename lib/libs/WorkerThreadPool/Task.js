"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/* -------------------------------------------------------
  Task:
    任务具有唯一的任务ID，每个任务还可以携带一些附加数据(payload)传递给线程实例。
    - taskId：任务ID
    - payload：附加数据
    - status：任务状态
------------------------------------------------------- */
var _require = require('../utils'),
    getRandomString = _require.getRandomString;

var _require2 = require('./consts'),
    TASK_STATUS = _require2.TASK_STATUS,
    TASK_TYPE = _require2.TASK_TYPE;

var Task = /*#__PURE__*/function () {
  function Task(payload) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, Task);
    this.taskId = Task.generateTaskId('task');
    this.status = TASK_STATUS.PENDING;
    this.payload = payload;
    this.transferList = options.transferList;
    this.taskRetry = 0;
    this.taskType = options.taskType || TASK_TYPE.STATIC;
    this.execPath = options.execPath || null;
    this.execString = options.execString || null;
    this.maxTaskRetry = options.taskRetry || Task.defaultOptions.maxTaskRetry;
  }

  (0, _createClass2["default"])(Task, [{
    key: "stop",
    value: function stop() {
      this.status = TASK_STATUS.PENDING;
    }
  }, {
    key: "start",
    value: function start() {
      this.status = TASK_STATUS.RUNNING;
    }
  }, {
    key: "isRetryable",
    get: function get() {
      return this.taskRetry < this.maxTaskRetry;
    }
  }, {
    key: "isPending",
    get: function get() {
      return this.status === TASK_STATUS.PENDING;
    }
  }, {
    key: "retry",
    value: function retry() {
      this.taskRetry += 1;
      this.status = TASK_STATUS.PENDING;
    }
  }, {
    key: "cancel",
    value: function cancel() {
      this.status = TASK_STATUS.CANCELLED;
    }
  }, {
    key: "fail",
    value: function fail() {
      this.status = TASK_STATUS.FAILED;
    }
  }, {
    key: "succeed",
    value: function succeed() {
      this.status = TASK_STATUS.SUCCESS;
    }
  }, {
    key: "setPayload",
    value: function setPayload(payload) {
      this.payload = payload;
    }
  }], [{
    key: "generateTaskId",
    value: function generateTaskId(symbol) {
      return "".concat(symbol, "_").concat(getRandomString());
    }
  }]);
  return Task;
}();

Task.defaultOptions = {
  maxTaskRetry: 0,
  type: TASK_TYPE.STATIC
};
module.exports = Task;