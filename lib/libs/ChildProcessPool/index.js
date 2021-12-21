"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var _path = require('path');

var EventEmitter = require('events');

var ForkedProcess = require('./ForkedProcess');

var ProcessLifeCycle = require('../ProcessLifeCycle.class');

var ProcessManager = require('../ProcessManager/index');

var _require = require('../ProcessLifeCycle.class'),
    defaultLifecycle = _require.defaultLifecycle;

var LoadBalancer = require('../LoadBalancer');

var _require2 = require('../../conf/global.json'),
    inspectStartIndex = _require2.inspectStartIndex;

var _require3 = require('../utils'),
    getRandomString = _require3.getRandomString,
    removeForkedFromPool = _require3.removeForkedFromPool,
    convertForkedToMap = _require3.convertForkedToMap,
    isValidValue = _require3.isValidValue;

var defaultStrategy = LoadBalancer.ALGORITHM.POLLING;

var ChildProcessPool = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(ChildProcessPool, _EventEmitter);

  var _super = _createSuper(ChildProcessPool);

  function ChildProcessPool(_ref) {
    var _this;

    var path = _ref.path,
        _ref$max = _ref.max,
        max = _ref$max === void 0 ? 6 : _ref$max,
        cwd = _ref.cwd,
        _ref$env = _ref.env,
        env = _ref$env === void 0 ? {} : _ref$env,
        _ref$weights = _ref.weights,
        weights = _ref$weights === void 0 ? [] : _ref$weights,
        _ref$strategy = _ref.strategy,
        strategy = _ref$strategy === void 0 ? defaultStrategy : _ref$strategy,
        _ref$lifecycle = _ref.lifecycle,
        lifecycle = _ref$lifecycle === void 0 ? {
      // lifecycle of processes
      expect: defaultLifecycle.expect,
      // default timeout 10 minutes
      internal: defaultLifecycle.internal // default loop interval 30 seconds

    } : _ref$lifecycle;
    (0, _classCallCheck2["default"])(this, ChildProcessPool);
    _this = _super.call(this);

    _this.initEvents = function () {
      // let process sleep when no activity in expect time
      _this.lifecycle.on('sleep', function (ids) {
        ids.forEach(function (pid) {
          if (_this.forkedMap[pid]) {
            _this.forkedMap[pid].sleep();
          }
        });
      }); // message from forked process


      _this.on('forked_message', function (_ref2) {
        var data = _ref2.data,
            id = _ref2.id;

        _this.onMessage({
          data: data,
          id: id
        });
      }); // process exit


      _this.on('forked_exit', function (pid) {
        _this.onForkedDisconnect(pid);
      }); // process error


      _this.on('forked_error', function (err, pid) {
        _this.onProcessError(err, pid);
      });
    };

    _this.dataRespond = function (data, id) {
      if (id && _this.callbacks[id]) {
        _this.callbacks[id](data);

        delete _this.callbacks[id];
      }

      ;
    };

    _this.dataRespondAll = function (data, id) {
      if (!id) return;

      var resultAll = _this.callbacksMap.get(id);

      if (resultAll !== undefined) {
        _this.callbacksMap.set(id, [].concat((0, _toConsumableArray2["default"])(resultAll), [data]));
      } else {
        _this.callbacksMap.set(id, [data]);
      }

      resultAll = _this.callbacksMap.get(id);

      if (resultAll.length === _this.forked.length) {
        _this.callbacks[id](resultAll);

        delete _this.callbacks[id];

        _this.callbacksMap["delete"](id);
      }
    };

    _this.onForkedCreate = function (forked) {
      var pidsValue = _this.forked.map(function (f) {
        return f.pid;
      });

      var length = _this.forked.length;
      ProcessManager.pipe(forked.child);

      _this.LB.add({
        id: forked.pid,
        weight: _this.weights[length - 1]
      });

      _this.forkedMap = convertForkedToMap(_this.forked);

      _this.lifecycle.watch([forked.pid]);

      ProcessManager.listen(pidsValue, 'node', _this.forkedPath);
    };

    _this.onForkedDisconnect = function (pid) {
      var length = _this.forked.length;
      removeForkedFromPool(_this.forked, pid, _this.pidMap);
      _this.forkedMap = convertForkedToMap(_this.forked);

      _this.LB.del({
        id: pid,
        weight: _this.weights[length - 1]
      });

      _this.lifecycle.unwatch([pid]);

      ProcessManager.unlisten([pid]);
    };

    _this.getForkedFromPool = function () {
      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";
      var forked;

      if (!_this.pidMap.get(id)) {
        // create new process and put it into the pool
        if (_this.forked.length < _this.maxInstance) {
          inspectStartIndex++;
          forked = new ForkedProcess((0, _assertThisInitialized2["default"])(_this), _this.forkedPath, _this.env.NODE_ENV === "development" ? ["--inspect=".concat(inspectStartIndex)] : [], {
            cwd: _this.cwd,
            env: _objectSpread(_objectSpread({}, _this.env), {}, {
              id: id
            }),
            stdio: 'pipe'
          });

          _this.forked.push(forked);

          _this.onForkedCreate(forked);
        } else {
          // get a process from the pool based on load balancing strategy
          forked = _this.forkedMap[_this.LB.pickOne().id];
        }

        if (id !== 'default') {
          _this.pidMap.set(id, forked.pid);
        }

        if (_this.pidMap.keys.length === 1000) {
          console.warn('ChildProcessPool: The count of pidMap is over than 1000, suggest to use unique id!');
        }
      } else {
        // pick a special process from the pool
        forked = _this.forkedMap[_this.pidMap.get(id)];
      }

      if (!forked) throw new Error("Get forked process from pool failed! the process pid: ".concat(_this.pidMap.get(id), "."));
      return forked;
    };

    _this.onProcessError = function (err, pid) {
      console.error("ChildProcessPool: ", err);

      _this.onForkedDisconnect(pid);
    };

    _this.onMessage = function (_ref3) {
      var data = _ref3.data,
          id = _ref3.id;

      if (_this.callbacksMap.get(id) !== undefined) {
        _this.dataRespondAll(data, id);
      } else {
        _this.dataRespond(data, id);
      }
    };

    _this.send = function (taskName, params, givenId) {
      if (givenId === 'default') throw new Error('ChildProcessPool: Prohibit the use of this id value: [default] !');
      var id = getRandomString();

      var forked = _this.getForkedFromPool(givenId);

      _this.lifecycle.refresh([forked.pid]);

      return new Promise(function (resolve) {
        _this.callbacks[id] = resolve;
        forked.send({
          action: taskName,
          params: params,
          id: id
        });
      });
    };

    _this.sendToAll = function (taskName, params) {
      var id = getRandomString();
      return new Promise(function (resolve) {
        _this.callbacks[id] = resolve;

        _this.callbacksMap.set(id, []);

        if (_this.forked.length) {
          // use process in pool
          _this.forked.forEach(function (forked) {
            forked.send({
              action: taskName,
              params: params,
              id: id
            });
          });

          _this.lifecycle.refresh(_this.forked.map(function (forked) {
            return forked.pid;
          }));
        } else {
          // use default process
          _this.getForkedFromPool().send({
            action: taskName,
            params: params,
            id: id
          });
        }
      });
    };

    _this.kill = function (id) {
      if (id !== undefined) {
        var _pid = _this.pidMap.get(id);

        var fork = _this.forkedMap[_pid];

        try {
          // don't use disconnect, that just close the ipc channel.
          if (fork) process.kill(_pid, "SIGINT");
        } catch (error) {
          console.error("ChildProcessPool: Failed to kill the child process ".concat(_pid, "!"));
        }
      } else {
        console.warn('ChildProcessPool: The all sub processes will be shutdown!');

        _this.forked.forEach(function (fork) {
          try {
            process.kill(fork.pid, "SIGINT");
          } catch (error) {
            console.error("ChildProcessPool: Failed to kill the child process ".concat(pid, "!"));
          }
        });
      }
    };

    _this.setMaxInstanceLimit = function (count) {
      if (!Number.isInteger(count) || count <= 0) return console.warn('ChildProcessPool: setMaxInstanceLimit - the param count must be an positive integer!');
      if (count < _this.maxInstance) console.warn("ChildProcesspool: setMaxInstanceLimit - the param count is less than old value ".concat(_this.maxInstance, " !"));
      _this.maxInstance = count;
    };

    _this.cwd = cwd || _path.dirname(path);
    _this.env = _objectSpread(_objectSpread({}, process.env), env);
    _this.callbacks = {};
    _this.pidMap = new Map();
    _this.callbacksMap = new Map();
    _this.forked = [];
    _this.forkedMap = {};
    _this.forkedPath = path;
    _this.forkIndex = 0;
    _this.maxInstance = max;
    _this.weights = new Array(max).fill().map(function (_, i) {
      return isValidValue(weights[i]) ? weights[i] : 1;
    });
    _this.LB = new LoadBalancer({
      algorithm: strategy,
      targets: []
    });
    _this.lifecycle = new ProcessLifeCycle({
      expect: lifecycle.expect,
      internal: lifecycle.internal
    });

    _this.lifecycle.start();

    _this.initEvents();

    return _this;
  }
  /* -------------- internal -------------- */

  /* init events */


  return ChildProcessPool;
}(EventEmitter);

module.exports = ChildProcessPool;