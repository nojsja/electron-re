"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Executor = /*#__PURE__*/function () {
  function Executor(_ref) {
    var taskTimeout = _ref.taskTimeout,
        transferList = _ref.transferList,
        taskRetry = _ref.taskRetry;
    (0, _classCallCheck2["default"])(this, Executor);
    this.taskTimeout = taskTimeout;
    this.transferList = transferList;
    this.taskRetry = taskRetry;
    Executor.paramsCheck({
      taskRetry: this.taskRetry,
      taskTimeout: this.taskTimeout
    });
  }
  /**
   * @name setTaskRetry [set task retry count]
   * @param {Number} taskRetry
   */


  (0, _createClass2["default"])(Executor, [{
    key: "setTaskRetry",
    value: function setTaskRetry(taskRetry) {
      Executor.paramsCheck({
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
      this.transferList = transferList;
      return this;
    }
    /**
     * @name setTaskTimeout [set task timeout]
     * @param {Number} taskTimeout [timeout time in milliseconds]
     */

  }, {
    key: "setTaskTimeout",
    value: function setTaskTimeout(taskTimeout) {
      this.taskTimeout = taskTimeout;
      return this;
    }
  }], [{
    key: "paramsCheck",
    value: function paramsCheck(_ref2) {
      var taskRetry = _ref2.taskRetry,
          taskTimeout = _ref2.taskTimeout;

      if (taskRetry !== undefined && (taskRetry > ThreadPool.maxTaskRetry || taskRetry < 0)) {
        throw new Error("WorkerThreadPool: param - taskRetry must be an positive integer that no more than ".concat(ThreadPool.maxTaskRetry, "."));
      }

      if (taskTimeout !== undefined && taskTimeout < 0) {
        throw new Error("WorkerThreadPool: param - taskTimeout must be an positive integer.");
      }
    }
  }]);
  return Executor;
}();

Executor.defaultOptions = {
  taskRetry: 0,
  taskTimeout: 60e3
};
Executor.maxTaskRetry = 5;
module.exports = Executor;