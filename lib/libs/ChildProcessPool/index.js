"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

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

var _require = require('../utils'),
    getRandomString = _require.getRandomString,
    removeForkedFromPool = _require.removeForkedFromPool;

var ProcessManager = require('../ProcessManager/index');

var _require2 = require('../../conf/global.json'),
    inspectStartIndex = _require2.inspectStartIndex;

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
        env = _ref$env === void 0 ? {} : _ref$env;
    (0, _classCallCheck2["default"])(this, ChildProcessPool);
    _this = _super.call(this);

    _this.initEvents = function () {
      _this.on('fork', function (pids) {
        ProcessManager.listen(pids, 'node', _this.forkedPath);
      });

      _this.on('unfork', function (pids) {
        ProcessManager.unlisten(pids);
      });

      _this.on('forked_message', function (_ref2) {
        var data = _ref2.data,
            id = _ref2.id;

        _this.onMessage({
          data: data,
          id: id
        });
      });

      _this.on('forked_exit', function (pid) {
        _this.onProcessDisconnect(pid);
      });

      _this.on('forked_closed', function (pid) {
        _this.onProcessDisconnect(pid);
      });

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

      var resultAll = _this.collaborationMap.get(id);

      if (resultAll !== undefined) {
        _this.collaborationMap.set(id, [].concat((0, _toConsumableArray2["default"])(resultAll), [data]));
      } else {
        _this.collaborationMap.set(id, [data]);
      }

      resultAll = _this.collaborationMap.get(id);

      if (resultAll.length === _this.forked.length) {
        _this.callbacks[id](resultAll);

        delete _this.callbacks[id];

        _this.collaborationMap["delete"](id);
      }
    };

    _this.cwd = cwd || _path.dirname(path);
    _this.env = _objectSpread(_objectSpread({}, process.env), env);
    _this.callbacks = {};
    _this.pidMap = new Map();
    _this.collaborationMap = new Map();
    _this.forked = [];
    _this.forkedPath = path;
    _this.forkIndex = 0;
    _this.maxInstance = max;

    _this.initEvents();

    return _this;
  }
  /* -------------- internal -------------- */

  /* init events */


  (0, _createClass2["default"])(ChildProcessPool, [{
    key: "getForkedFromPool",
    value:
    /* Get a process instance from the pool */
    function getForkedFromPool() {
      var _this2 = this;

      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";
      var forked;

      if (!this.pidMap.get(id)) {
        // create new process
        if (this.forked.length < this.maxInstance) {
          inspectStartIndex++;
          forked = new ForkedProcess(this, this.forkedPath, this.env.NODE_ENV === "development" ? ["--inspect=".concat(inspectStartIndex)] : [], {
            cwd: this.cwd,
            env: _objectSpread(_objectSpread({}, this.env), {}, {
              id: id
            }),
            stdio: 'pipe'
          });
          this.forked.push(forked);
          ProcessManager.pipe(forked.child);
          this.emit('fork', this.forked.map(function (fork) {
            return fork.pid;
          }));
        } else {
          this.forkIndex = this.forkIndex % this.maxInstance;
          forked = this.forked[this.forkIndex];
        }

        if (id !== 'default') this.pidMap.set(id, forked.pid);
        if (this.pidMap.keys.length === 1000) console.warn('ChildProcessPool: The count of pidMap is over than 1000, suggest to use unique id!');
        this.forkIndex += 1;
      } else {
        // use existing processes
        forked = this.forked.find(function (f) {
          return f.pid === _this2.pidMap.get(id);
        });
        if (!forked) throw new Error("Get forked process from pool failed! the process pid: ".concat(this.pidMap.get(id), "."));
      }

      return forked;
    }
    /**
      * onProcessDisconnect [triggered when a process instance disconnect]
      * @param  {[String]} pid [process pid]
      */

  }, {
    key: "onProcessDisconnect",
    value: function onProcessDisconnect(pid) {
      this.emit('unfork', pid);
      removeForkedFromPool(this.forked, pid, this.pidMap);
    }
    /**
      * onProcessError [triggered when a process instance break]
      * @param  {[Error]} err [error]
      * @param  {[String]} pid [process pid]
      */

  }, {
    key: "onProcessError",
    value: function onProcessError(err, pid) {
      console.error("ChildProcessPool: ", err);
      this.onProcessDisconnect(pid);
    }
    /**
      * onMessage [Received data from a process]
      * @param  {[Any]} data [response data]
      * @param  {[String]} id [process tmp id]
      */

  }, {
    key: "onMessage",
    value: function onMessage(_ref3) {
      var data = _ref3.data,
          id = _ref3.id;

      if (this.collaborationMap.get(id) !== undefined) {
        this.dataRespondAll(data, id);
      } else {
        this.dataRespond(data, id);
      }
    }
    /* -------------- caller -------------- */

    /**
    * send [Send request to a process]
    * @param  {[String]} taskName [task name - necessary]
    * @param  {[Any]} params [data passed to process - necessary]
    * @param  {[String]} id [the unique id bound to a process instance - not necessary]
    * @return {[Promise]} [return a Promise instance]
    */

  }, {
    key: "send",
    value: function send(taskName, params, givenId) {
      var _this3 = this;

      if (givenId === 'default') throw new Error('ChildProcessPool: Prohibit the use of this id value: [default] !');
      var id = getRandomString();
      var forked = this.getForkedFromPool(givenId);
      return new Promise(function (resolve) {
        _this3.callbacks[id] = resolve;
        forked.send({
          action: taskName,
          params: params,
          id: id
        });
      });
    }
    /**
    * sendToAll [Send requests to all processes]
    * @param  {[String]} taskName [task name - necessary]
    * @param  {[Any]} params [data passed to process - necessary]
    * @return {[Promise]} [return a Promise instance]
    */

  }, {
    key: "sendToAll",
    value: function sendToAll(taskName, params) {
      var _this4 = this;

      var id = getRandomString();
      return new Promise(function (resolve) {
        _this4.callbacks[id] = resolve;

        _this4.collaborationMap.set(id, []);

        if (_this4.forked.length) {
          // use process in pool
          _this4.forked.forEach(function (forked) {
            forked.send({
              action: taskName,
              params: params,
              id: id
            });
          });
        } else {
          // use default process
          _this4.getForkedFromPool().send({
            action: taskName,
            params: params,
            id: id
          });
        }
      });
    }
    /**
    * disconnect [shutdown a sub process or all sub processes]
    * @param  {[String]} id [id bound with a sub process. If none is given, all sub processes will be killed.]
    */

  }, {
    key: "kill",
    value: function kill(id) {
      if (id !== undefined) {
        var _pid = this.pidMap.get(id);

        var fork = this.forked.find(function (p) {
          return p.pid === _pid;
        });

        try {
          // don't use disconnect, that just close the ipc channel.
          if (fork) process.kill(_pid, "SIGTERM");
        } catch (error) {
          console.error("ChildProcessPool: Failed to kill the child process ".concat(_pid, "!"));
        }
      } else {
        console.warn('ChildProcessPool: The all sub processes will be shutdown!');
        this.forked.forEach(function (fork) {
          try {
            process.kill(fork.pid, "SIGTERM");
          } catch (error) {
            console.error("ChildProcessPool: Failed to kill the child process ".concat(pid, "!"));
          }
        });
      }
    }
    /**
    * setMaxInstanceLimit [set the max count of sub process instances created by pool]
    * @param  {[Number]} count [the max count instances]
    */

  }, {
    key: "setMaxInstanceLimit",
    value: function setMaxInstanceLimit(count) {
      if (!Number.isInteger(count) || count <= 0) return console.warn('ChildProcessPool: setMaxInstanceLimit - the param count must be an positive integer!');
      if (count < this.maxInstance) console.warn("ChildProcesspool: setMaxInstanceLimit - the param count is less than old value ".concat(this.maxInstance, " !"));
      this.maxInstance = count;
    }
  }]);
  return ChildProcessPool;
}(EventEmitter);

module.exports = ChildProcessPool;