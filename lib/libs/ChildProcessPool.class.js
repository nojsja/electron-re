"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('child_process'),
    fork = _require.fork;

var _path = require('path');

var EventEmitter = require('events');

var _require2 = require('./utils'),
    getRandomString = _require2.getRandomString,
    removeForkedFromPool = _require2.removeForkedFromPool;

var ProcessManager = require('./ProcessManager.class');

var inspectStartIndex = 5858;

var ChildProcessPool = /*#__PURE__*/function () {
  function ChildProcessPool(_ref) {
    var _this = this;

    var path = _ref.path,
        _ref$max = _ref.max,
        max = _ref$max === void 0 ? 6 : _ref$max,
        cwd = _ref.cwd,
        env = _ref.env;

    _classCallCheck(this, ChildProcessPool);

    this.dataRespond = function (data, id) {
      if (id && _this.callbacks[id]) {
        _this.callbacks[id](data);

        delete _this.callbacks[id];
      }

      ;
    };

    this.dataRespondAll = function (data, id) {
      if (!id) return;

      var resultAll = _this.collaborationMap.get(id);

      if (resultAll !== undefined) {
        _this.collaborationMap.set(id, [].concat(_toConsumableArray(resultAll), [data]));
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

    this.cwd = cwd || _path.dirname(path);
    this.env = env || process.env;
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.maxInstance = max;
    this.event = new EventEmitter();
    this.event.on('fork', function (pids) {
      ProcessManager.listen(pids, 'node');
    });
    this.event.on('unfork', function (pids) {
      ProcessManager.unlisten(pids);
    });
  }
  /* -------------- internal -------------- */

  /* Received data from a child process */


  _createClass(ChildProcessPool, [{
    key: "getForkedFromPool",

    /* Get a process instance from the pool */
    value: function getForkedFromPool() {
      var _this2 = this;

      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";
      var forked;

      if (!this.pidMap.get(id)) {
        // create new process
        if (this.forked.length < this.maxInstance) {
          inspectStartIndex++;
          forked = fork(this.forkedPath, this.env.NODE_ENV === "development" ? ["--inspect=".concat(inspectStartIndex)] : [], {
            cwd: this.cwd,
            env: _objectSpread(_objectSpread({}, this.env), {}, {
              id: id
            })
          });
          this.forked.push(forked);
          forked.on('message', function (data) {
            var id = data.id;
            delete data.id;
            delete data.action;

            _this2.onMessage({
              data: data,
              id: id
            });
          });
          forked.on('exit', function () {
            _this2.onProcessDisconnect(forked.pid);
          });
          forked.on('closed', function () {
            _this2.onProcessDisconnect(forked.pid);
          });
          forked.on('error', function (err) {
            _this2.onProcessError(err, forked.pid);
          });
          this.event.emit('fork', this.forked.map(function (fork) {
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
      this.event.emit('unfork', pid);
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
    value: function onMessage(_ref2) {
      var data = _ref2.data,
          id = _ref2.id;

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
    key: "disconnect",
    value: function disconnect(id) {
      if (id !== undefined) {
        var pid = this.pidMap.get(id);

        var _fork = this.forked.find(function (p) {
          return p.pid === pid;
        });

        if (_fork) _fork.disconnect();
      } else {
        console.warn('ChildProcessPool: The all sub processes will be shutdown!');
        this.forked.forEach(function (fork) {
          fork.disconnect();
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
}();

module.exports = ChildProcessPool;