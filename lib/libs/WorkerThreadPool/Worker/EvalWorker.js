"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var path = require('path');

var _require = require('worker_threads'),
    Worker = _require.Worker;

var WorkerClass = require('./Worker');

var EvalWorker = /*#__PURE__*/function (_WorkerClass) {
  (0, _inherits2["default"])(EvalWorker, _WorkerClass);

  var _super = _createSuper(EvalWorker);

  function EvalWorker(code) {
    var _this;

    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2["default"])(this, EvalWorker);

    if (!code) {
      throw new Error('EvalWorker: code is required');
    }

    _this = _super.call(this);
    _this.code = code;
    _this.context = context;
    _this.runner = null;
    _this.threadId = null;

    _this.init();

    return _this;
  }

  (0, _createClass2["default"])(EvalWorker, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      this.runner = new Worker(path.join(__dirname, 'eval-worker-runner.js'), {
        workerData: {
          code: this.code,
          context: this.context
        }
      });
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
  }]);
  return EvalWorker;
}(WorkerClass);

module.exports = EvalWorker;