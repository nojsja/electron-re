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

var ExecWorker = /*#__PURE__*/function (_WorkerClass) {
  (0, _inherits2["default"])(ExecWorker, _WorkerClass);

  var _super = _createSuper(ExecWorker);

  function ExecWorker(execPath) {
    var _this;

    (0, _classCallCheck2["default"])(this, ExecWorker);

    if (!execPath) {
      throw new Error('ExecWorker: execPath is required');
    }

    _this = _super.call(this);
    _this.execPath = execPath;
    _this.runner = null;

    _this.init();

    return _this;
  }

  (0, _createClass2["default"])(ExecWorker, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      this.runner = new Worker(path.join(__dirname, 'exec-worker-runner.js'), {
        workerData: {
          execPath: this.execPath
        }
      });
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
  return ExecWorker;
}(WorkerClass);

module.exports = ExecWorker;