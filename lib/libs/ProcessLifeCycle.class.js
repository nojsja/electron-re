"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var EventEmitter = require('events');

var defaultLifecycle = {
  expect: 600e3,
  // default timeout 10 minutes
  internal: 30e3 // default loop check interval 30 seconds

};

var ProcessLifeCycle = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(ProcessLifeCycle, _EventEmitter);

  var _super = _createSuper(ProcessLifeCycle);

  function ProcessLifeCycle(options) {
    var _this;

    (0, _classCallCheck2["default"])(this, ProcessLifeCycle);
    _this = _super.call(this);

    _this.taskLoop = function () {
      if (_this.timer) return console.warn('ProcessLifeCycle: the task loop is already running');
      _this.timer = setInterval(function () {
        var sleepTasks = [];
        var date = new Date();
        var activities = _this.params.activities;
        (0, _toConsumableArray2["default"])(activities.entries()).map(function (_ref) {
          var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
              key = _ref2[0],
              value = _ref2[1];

          if (date - value > _this.expect) {
            sleepTasks.push(key);
          }
        });

        if (sleepTasks.length) {
          // this.unwatch(sleepTasks);
          _this.emit('sleep', sleepTasks);
        }
      }, _this.internal);
    };

    _this.watch = function () {
      var ids = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      ids.forEach(function (id) {
        _this.params.activities.set(id, new Date());
      });
    };

    _this.unwatch = function () {
      var ids = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      ids.forEach(function (id) {
        _this.params.activities["delete"](id);
      });
    };

    _this.stop = function () {
      clearInterval(_this.timer);
      _this.timer = null;
    };

    _this.start = function () {
      _this.taskLoop();
    };

    _this.refresh = function () {
      var ids = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      ids.forEach(function (id) {
        if (_this.params.activities.has(id)) {
          _this.params.activities.set(id, new Date());
        } else {
          console.warn("The task with id ".concat(id, " is not being watched."));
        }
      });
    };

    var _options$expect = options.expect,
        expect = _options$expect === void 0 ? defaultLifecycle.expect : _options$expect,
        _options$internal = options.internal,
        internal = _options$internal === void 0 ? defaultLifecycle.internal : _options$internal;
    _this.timer = null;
    _this.internal = internal;
    _this.expect = expect;
    _this.params = {
      activities: new Map()
    };
    return _this;
  }
  /* task check loop */


  return ProcessLifeCycle;
}(EventEmitter);

module.exports = Object.assign(ProcessLifeCycle, {
  defaultLifecycle: defaultLifecycle
});