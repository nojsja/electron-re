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

var path = require('path');

var EventEmitter = require('events');

var _require = require('worker_threads'),
    Worker = _require.Worker;

var WorkerRunner = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(WorkerRunner, _EventEmitter);

  var _super = _createSuper(WorkerRunner);

  function WorkerRunner() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, WorkerRunner);
    _this = _super.call(this);
    _this.execString = options.execString;
    _this.execPath = options.execPath;
    _this.runner = null;
    _this.threadId = null;

    if (!_this.execString && !_this.execPath) {
      throw new Error('WorkerRunner: code or execPath is required.');
    }

    _this.init(options);

    return _this;
  }

  (0, _createClass2["default"])(WorkerRunner, [{
    key: "init",
    value: function init(options) {
      var _this2 = this;

      this.runner = new Worker(path.join(__dirname, 'worker-runner.js'), _objectSpread(_objectSpread({}, options), {}, {
        workerData: {
          execString: this.execString,
          execPath: this.execPath
        }
      }));
      this.threadId = this.runner.threadId;
      this.runner.on('message', function (info) {
        _this2.emit('response', info);
      });
      this.runner.on('error', function (err) {
        _this2.emit('error', err);
      });
      this.runner.on('exit', function (exitCode) {
        _this2.emit('exit', exitCode);
      });
    }
  }, {
    key: "postMessage",
    value: function postMessage() {
      var _this$runner;

      (_this$runner = this.runner).postMessage.apply(_this$runner, arguments);
    }
  }]);
  return WorkerRunner;
}(EventEmitter);

module.exports = WorkerRunner;