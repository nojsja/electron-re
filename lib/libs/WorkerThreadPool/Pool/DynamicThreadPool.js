"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var ThreadPool = require('./ThreadPool');

var DynamicExecutor = require('../Executor/DynamicExecutor');

var DynamicThreadPool = /*#__PURE__*/function (_ThreadPool) {
  (0, _inherits2["default"])(DynamicThreadPool, _ThreadPool);

  var _super = _createSuper(DynamicThreadPool);

  /**
   * @param {Object} options [options to create pool]
   *  - @param {Number} maxThreads [max threads count]
   *  - @param {Number} maxTasks [max tasks count]
   *  - @param {Number} taskRetry [task retry count]
   *  - @param {Number} taskTimeout [task timeout time]
   *  - @param {Number} taskLoopTime [task queue refresh time]
   * @param {Object} threadOptions [options to create worker threads, the same as options in original `new Worker(filename, [options])`]
   *  - @param {Array} transferList [a list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.]
   *  ...
   */
  function DynamicThreadPool() {
    var _thisSuper, _this;

    var _options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var threadOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, DynamicThreadPool);
    _this = _super.call(this, _objectSpread(_objectSpread({}, _options), {}, {
      lazyLoad: true
    }), threadOptions);

    _this.exec = function (payload) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      DynamicThreadPool.paramsCheckForExec(options);
      return (0, _get2["default"])((_thisSuper = (0, _assertThisInitialized2["default"])(_this), (0, _getPrototypeOf2["default"])(DynamicThreadPool.prototype)), "exec", _thisSuper).call((0, _assertThisInitialized2["default"])(_this), payload, options);
    };

    _this.type = 'dynamic';
    DynamicThreadPool.paramsCheckForSetup(_options);
    return _this;
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


  (0, _createClass2["default"])(DynamicThreadPool, [{
    key: "fillPoolWithIdleThreads",
    value: function fillPoolWithIdleThreads() {
      throw new Error("DynamicThreadPool: function - fillPoolWithIdleThreads() is not allowed in DynamicThreadPool!");
    }
  }, {
    key: "createExecutor",
    value: function createExecutor() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return new DynamicExecutor(this, options);
    }
  }], [{
    key: "paramsCheckForSetup",
    value: function paramsCheckForSetup() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var execPath = options.execPath,
          execString = options.execString,
          execFunction = options.execFunction,
          lazyLoad = options.lazyLoad;

      if (execPath || execString || execFunction) {
        throw new Error("DynamicThreadPool: param - execPath, execString and execFunction are not allowed in DynamicThreadPool!");
      }

      if (lazyLoad !== undefined && !!lazyLoad === false) {
        throw new Error("DynamicThreadPool: param - lazyLoad is not allowed in DynamicThreadPool!");
      }
    }
  }, {
    key: "paramsCheckForExec",
    value: function paramsCheckForExec() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var execPath = options.execPath,
          execString = options.execString,
          execFunction = options.execFunction;

      if (!execPath && !execString && !execFunction) {
        throw new Error("DynamicThreadPool: exec param - execPath/execString/execFunction is required!");
      }
    }
  }]);
  return DynamicThreadPool;
}(ThreadPool);

module.exports = DynamicThreadPool;