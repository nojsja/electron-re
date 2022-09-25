"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var ThreadPool = require('./ThreadPool');

var StaticExecutor = require('../Executor/StaticExecutor');

var StaticThreadPool = /*#__PURE__*/function (_ThreadPool) {
  (0, _inherits2["default"])(StaticThreadPool, _ThreadPool);

  var _super = _createSuper(StaticThreadPool);

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
  function StaticThreadPool() {
    var _thisSuper, _this;

    var _options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var threadOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, StaticThreadPool);
    _this = _super.call(this, _options, threadOptions);

    _this.exec = function (payload) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      StaticThreadPool.paramsCheckForExec(options);
      return (0, _get2["default"])((_thisSuper = (0, _assertThisInitialized2["default"])(_this), (0, _getPrototypeOf2["default"])(StaticThreadPool.prototype)), "exec", _thisSuper).call((0, _assertThisInitialized2["default"])(_this), payload, options);
    };

    _this.type = 'static';
    StaticThreadPool.paramsCheckForSetup(_options);
    return _this;
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


  (0, _createClass2["default"])(StaticThreadPool, [{
    key: "createExecutor",
    value: function createExecutor(options) {
      return new StaticExecutor(this, options);
    }
  }], [{
    key: "paramsCheckForSetup",
    value: function paramsCheckForSetup() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var execPath = options.execPath,
          execString = options.execString,
          execFunction = options.execFunction;

      if (!execPath && !execString && !execFunction) {
        throw new Error("StaticThreadPool: param - execPath/execString/execFunction is required!");
      }
    }
  }, {
    key: "paramsCheckForExec",
    value: function paramsCheckForExec() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var execPath = options.execPath,
          execString = options.execString,
          execFunction = options.execFunction;

      if (execPath || execString || execFunction) {
        throw new Error("StaticThreadPool: param - execPath, execString and execFunction are not allowed in StaticThreadPool!");
      }
    }
  }]);
  return StaticThreadPool;
}(ThreadPool);

module.exports = StaticThreadPool;