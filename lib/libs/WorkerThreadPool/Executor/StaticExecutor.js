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

var StaticExecutor = /*#__PURE__*/function (_Executor) {
  (0, _inherits2["default"])(StaticExecutor, _Executor);

  var _super = _createSuper(StaticExecutor);

  function StaticExecutor(parentPool, options) {
    var _this;

    (0, _classCallCheck2["default"])(this, StaticExecutor);
    _this = _super.call(this, options);
    _this.parentPool = parentPool;
    _this.type = 'static';
    return _this;
  }

  (0, _createClass2["default"])(StaticExecutor, [{
    key: "queue",
    value: function queue(payload) {
      return this.parentPool.queue(payload, {
        taskTimeout: this.taskTimeout,
        transferList: this.transferList,
        taskRetry: this.taskRetry
      });
    }
  }, {
    key: "exec",
    value: function exec(payload) {
      return this.parentPool.exec(payload, {
        taskTimeout: this.taskTimeout,
        transferList: this.transferList,
        taskRetry: this.taskRetry
      });
    }
  }]);
  return StaticExecutor;
}(Executor);

module.exports = StaticExecutor;