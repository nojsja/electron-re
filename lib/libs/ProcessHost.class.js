"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
  * ProcessHost [process tasks center]
  * @author nojsja
  */
var ProcessHost = /*#__PURE__*/function () {
  function ProcessHost() {
    (0, _classCallCheck2["default"])(this, ProcessHost);
    this.tasks = {};
    this.handleEvents();
    process.on('message', this.handleMessage.bind(this));
  }
  /* events listener */


  (0, _createClass2["default"])(ProcessHost, [{
    key: "handleEvents",
    value: function handleEvents() {
      process.on('disconnect', function () {
        console.log("ProcessHost: a child process disconnected: ".concat(process.pid, " !"));
      });
      process.on('exit', function () {
        console.log("ProcessHost: a child process exited: ".concat(process.pid, " !"));
      });
    }
    /* received message */

  }, {
    key: "handleMessage",
    value: function handleMessage(_ref) {
      var action = _ref.action,
          params = _ref.params,
          id = _ref.id;

      if (this.tasks[action]) {
        this.tasks[action](params).then(function (rsp) {
          process.send({
            action: action,
            error: null,
            result: rsp || {},
            id: id
          });
        })["catch"](function (error) {
          process.send({
            action: action,
            error: error,
            result: String(error) || {},
            id: id
          });
        });
      } else {
        process.send({
          action: action,
          error: "ProcessHost: processor for action-[".concat(action, "] is not found!"),
          result: null,
          id: id
        });
      }
    }
    /* registry a task */

  }, {
    key: "registry",
    value: function registry(taskName, processor) {
      if (this.tasks[taskName]) console.warn("ProcesHost: the task-".concat(taskName, " is registered!"));
      if (typeof processor !== 'function') throw new Error('ProcessHost: the processor must be a function!');

      this.tasks[taskName] = function (params) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(processor(params)).then(function (rsp) {
            resolve(rsp);
          })["catch"](function (error) {
            reject(error);
          });
        });
      };

      return this;
    }
  }, {
    key: "unregistry",
    value:
    /* unregistry a task */
    function unregistry(taskName) {
      if (!this.tasks[taskName]) console.warn("ProcesHost: the task-".concat(taskName, " is not registered!"));
      delete this.tasks[taskName];
      return this;
    }
  }, {
    key: "disconnect",
    value:
    /* disconnect */
    function disconnect() {
      process.disconnect();
    }
    /* exit */

  }, {
    key: "exit",
    value: function exit() {
      process.exit();
    }
  }]);
  return ProcessHost;
}();

if (!('electronre:$processHost' in global)) {
  Object.defineProperty(global, "electronre:$processHost", {
    value: new ProcessHost(),
    writable: false,
    configurable: false,
    enumerable: true
  });
}

module.exports = global['electronre:$processHost'];