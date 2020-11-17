'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var electron = require('electron');

var _require = require('electron'),
    app = _require.app,
    BrowserWindow = _require.BrowserWindow,
    Menu = _require.Menu,
    Tray = _require.Tray,
    dialog = _require.dialog;

var _require2 = require('child_process'),
    fork = _require2.fork;

var path = require('path');

var _require3 = require('events'),
    EventEmitter = _require3.EventEmitter;

var _require4 = require('./utils'),
    getRandomString = _require4.getRandomString;

var ChildProcess = function () {
  function ChildProcess(_ref) {
    var _this = this;

    var ipc = _ref.ipc,
        path = _ref.path,
        _ref$max = _ref.max,
        max = _ref$max === undefined ? 6 : _ref$max,
        cwd = _ref.cwd,
        env = _ref.env;

    _classCallCheck(this, ChildProcess);

    this.dataRespond = function (data, id) {
      if (id && _this.callbacks[id]) {
        _this.callbacks[id](data.result);
        delete _this.callbacks[id];
      };
    };

    this.dataRespondAll = function (data, id) {
      if (!id) return;
      var resultAll = _this.collaborationMap.get(id);
      if (resultAll !== undefined) {
        _this.collaborationMap.set(id, [].concat(_toConsumableArray(resultAll), [data.result]));
      } else {
        _this.collaborationMap.set(id, [data.result]);
      }
      resultAll = _this.collaborationMap.get(id);
      if (resultAll.length === _this.forked.length) {
        _this.callbacks[id](resultAll);
        delete _this.callbacks[id];
        _this.collaborationMap.delete(id);
      }
    };

    this.cwd = cwd || process.cwd;
    this.env = env || process.env;
    this.ipc = ipc;
    this.inspectStartIndex = 5858;
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.event = new EventEmitter();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.forkMaxIndex = max;
    this.event.on('fork-callback', function (_ref2) {
      var data = _ref2.data,
          id = _ref2.id;

      if (_this.collaborationMap.get(id) !== undefined) {
        _this.dataRespondAll(data, id);
      } else {
        _this.dataRespond(data, id);
      }
    });
  }

  /* 子进程数据回调 */


  /* 所有子进程协同数据回调 */


  _createClass(ChildProcess, [{
    key: 'getForkedFromPool',


    /* 从子进程池中获取一个进程 */
    value: function getForkedFromPool() {
      var _this2 = this;

      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";

      var forked = void 0;
      if (!this.pidMap.get(id)) {
        if (this.forked.length < this.forkMaxIndex) {
          this.inspectStartIndex++;
          forked = fork(this.forkedPath, this.env.NODE_ENV === "development" ? ['--inspect=' + this.inspectStartIndex] : [], {
            cwd: this.cwd,
            env: _extends({}, this.env, { id: id })
          });
          this.forked.push(forked);
          this.forkIndex += 1;
          forked.on('message', function (data) {
            _this2.event.emit('fork-callback', { data: data, id: id });
          });
          this.pidMap.set(id, forked.pid);
        } else {
          this.forkIndex = this.forkIndex % this.forkMaxIndex;
          forked = this.forked[this.forkIndex];
          this.pidMap.set(id, forked.pid);
          this.forkIndex += 1;
        }
      } else {
        forked = this.forked.filter(function (f) {
          return f.pid === _this2.pidMap.get(id);
        })[0];
        if (!forked) throw new Error('Get forked process from pool failed! the process pid: ' + this.pidMap.get(id) + '.');
      }

      return forked;
    }

    /* 向子进程发送请求 */

  }, {
    key: 'send',
    value: function send(params, givenId) {
      var _this3 = this;

      var id = givenId || getRandomString();
      var forked = this.getForkedFromPool(id);
      return new Promise(function (resolve) {
        _this3.callbacks[id] = resolve;
        forked.send(params);
      });
    }

    /* 向所有进程发送请求 */

  }, {
    key: 'sendToAll',
    value: function sendToAll(params) {
      var _this4 = this;

      var id = getRandomString();
      return new Promise(function (resolve) {
        _this4.callbacks[id] = resolve;
        _this4.collaborationMap.set(id, []);
        if (_this4.forked.length) {
          _this4.forked.forEach(function (forked) {
            forked.send(params);
          });
        } else {
          _this4.getForkedFromPool().send(params);
        }
      });
    }
  }]);

  return ChildProcess;
}();

module.exports = ChildProcess;