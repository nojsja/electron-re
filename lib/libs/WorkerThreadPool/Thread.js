"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/* -------------------------------------------------------
  Thread:
    线程具有唯一的线程ID
    - taskId：线程ID
    - execPath: 执行文件路径
    - status：任务状态
------------------------------------------------------- */
var EventEmitter = require('events');

var _require = require('./consts'),
    THREAD_STATUS = _require.THREAD_STATUS,
    THREAD_TYPE = _require.THREAD_TYPE;

var EvalWorker = require('./Worker/EvalWorker');

var ExecWorker = require('./Worker/ExecWorker');

var Thread = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(Thread, _EventEmitter);

  var _super = _createSuper(Thread);

  function Thread(execContent, type) {
    var _this;

    (0, _classCallCheck2["default"])(this, Thread);
    _this = _super.call(this);

    _this._onError = function (err) {
      console.error('Worker Error: ', err);

      _this.emit('error', err);
    };

    _this._onExit = function (exitCode) {
      console.log("Worker stopped with exit code ".concat(exitCode));
      _this.status = THREAD_STATUS.DEAD;

      _this.emit('exit', {
        threadId: _this.threadId,
        exitCode: exitCode
      });
    };

    _this._onResponse = function (info) {
      _this.status = THREAD_STATUS.IDLE;

      _this.emit('response', _objectSpread(_objectSpread({}, info), {}, {
        threadId: _this.threadId
      }));
    };

    _this.type = type;
    _this.status = THREAD_STATUS.IDLE;
    _this.worker = null;
    _this.threadId = null;
    _this.execPath = null;
    _this.execString = null;

    if (type === THREAD_TYPE.EVAL) {
      _this.execString = execContent;
    } else {
      _this.execPath = execContent;
    }

    _this._initWorker();

    return _this;
  }

  (0, _createClass2["default"])(Thread, [{
    key: "isIdle",
    get: function get() {
      return this.status === THREAD_STATUS.IDLE;
    }
  }, {
    key: "_initWorker",
    value: function _initWorker() {
      if (this.type === THREAD_TYPE.EVAL) {
        this.worker = new EvalWorker(this.execString);
      } else {
        this.worker = new ExecWorker(this.execPath);
      }

      this.threadId = this.worker.threadId;
      this.worker.on('response', this._onResponse);
      this.worker.on('error', this._onError);
      this.worker.on('exit', this._onExit);
    }
  }, {
    key: "runTask",
    value: function runTask(task) {
      switch (this.status) {
        case THREAD_STATUS.IDLE:
          this.status = THREAD_STATUS.WORKING;
          task.start();
          this.worker.postMessage(task);
          return true;

        case THREAD_STATUS.WORKING:
          return false;

        case THREAD_STATUS.DEAD:
          return false;

        default:
          return false;
      }
    }
  }]);
  return Thread;
}(EventEmitter);

module.exports = Thread;