"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Executor = require('./Executor');

var DynamicExecutor = /*#__PURE__*/function (_Executor) {
  (0, _inherits2["default"])(DynamicExecutor, _Executor);

  var _super = _createSuper(DynamicExecutor);

  function DynamicExecutor(pool, options) {
    var _this;

    (0, _classCallCheck2["default"])(this, DynamicExecutor);
    _this = _super.call(this, options);
    _this.type = 'dynamic';
    _this.parentPool = pool;
    _this.execPath = options.execPath || null;
    _this.execString = options.execString || null;
    _this.execFunction = options.execFunction || null;
    return _this;
  }

  (0, _createClass2["default"])(DynamicExecutor, [{
    key: "setExecPath",
    value: function setExecPath(execPath) {
      this.execPath = execPath;
      this.execFunction = null;
      this.setExecString = null;
      return this;
    }
  }, {
    key: "setExecString",
    value: function setExecString(execString) {
      this.execString = execString;
      this.execPath = null;
      this.execFunction = null;
      return this;
    }
  }, {
    key: "setExecFunction",
    value: function setExecFunction(execFunction) {
      this.execFunction = execFunction;
      this.execString = null;
      this.execPath = null;
      return this;
    }
  }, {
    key: "exec",
    value: function exec(payload) {
      DynamicExecutor.paramsCheck(this);
      return this.parentPool.exec(payload, {
        taskTimeout: this.taskTimeout,
        transferList: this.transferList,
        taskRetry: this.taskRetry,
        execPath: this.execPath,
        execString: this.execString,
        execFunction: this.execFunction
      });
    }
  }], [{
    key: "paramsCheck",
    value: function paramsCheck(_ref) {
      var execFunction = _ref.execFunction,
          execPath = _ref.execPath,
          execString = _ref.execString;

      if (!execFunction && !execPath && !execString) {
        throw new Error('DynamicExecutor: params - execPath/execString/execFunction is required');
      }
    }
  }]);
  return DynamicExecutor;
}(Executor);

module.exports = DynamicExecutor;