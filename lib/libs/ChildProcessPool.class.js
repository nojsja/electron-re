'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('child_process'),
    fork = _require.fork;

var _path = require('path');

var _require2 = require('./utils'),
    getRandomString = _require2.getRandomString,
    removeForkedFromPool = _require2.removeForkedFromPool;

var ChildProcessPool = function () {
  function ChildProcessPool(_ref) {
    var _this = this;

    var path = _ref.path,
        _ref$max = _ref.max,
        max = _ref$max === undefined ? 6 : _ref$max,
        cwd = _ref.cwd,
        env = _ref.env;

    _classCallCheck(this, ChildProcessPool);

    this.dataRespond = function (data, id) {
      if (id && _this.callbacks[id]) {
        _this.callbacks[id](data);
        delete _this.callbacks[id];
      };
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
        _this.collaborationMap.delete(id);
      }
    };

    this.cwd = cwd || _path.dirname(path);
    this.env = env || process.env;
    this.inspectStartIndex = 5858;
    this.callbacks = {};
    this.pidMap = new Map();
    this.collaborationMap = new Map();
    this.forked = [];
    this.forkedPath = path;
    this.forkIndex = 0;
    this.forkMaxIndex = max;
  }

  /* Received data from a child process */


  /* Received data from multi child processes */


  _createClass(ChildProcessPool, [{
    key: 'getForkedFromPool',


    /* Get a process instance from the pool */
    value: function getForkedFromPool() {
      var _this2 = this;

      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "default";

      var forked = void 0;
      if (!this.pidMap.get(id)) {
        // create new process
        if (this.forked.length < this.forkMaxIndex) {
          this.inspectStartIndex++;
          forked = fork(this.forkedPath, this.env.NODE_ENV === "development" ? ['--inspect=' + this.inspectStartIndex] : [], { cwd: this.cwd, env: _extends({}, this.env, { id: id }) });
          this.forked.push(forked);
          forked.on('message', function (data) {
            var id = data.id;
            delete data.id;
            delete data.action;
            _this2.onMessage({ data: data, id: id });
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
        } else {
          this.forkIndex = this.forkIndex % this.forkMaxIndex;
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
        if (!forked) throw new Error('Get forked process from pool failed! the process pid: ' + this.pidMap.get(id) + '.');
      }

      return forked;
    }

    /**
      * onProcessDisconnect [triggered when a process instance disconnect]
      * @param  {[String]} pid [process pid]
      */

  }, {
    key: 'onProcessDisconnect',
    value: function onProcessDisconnect(pid) {
      removeForkedFromPool(this.forked, pid, this.pidMap);
    }

    /**
      * onProcessError [triggered when a process instance break]
      * @param  {[Error]} err [error]
      * @param  {[String]} pid [process pid]
      */

  }, {
    key: 'onProcessError',
    value: function onProcessError(err, pid) {
      console.error("ChildProcessPool: ", err);
      removeForkedFromPool(this.forked, pid, this.pidMap);
    }

    /**
      * onMessage [Received data from a process]
      * @param  {[Any]} data [response data]
      * @param  {[String]} id [process tmp id]
      */

  }, {
    key: 'onMessage',
    value: function onMessage(_ref2) {
      var data = _ref2.data,
          id = _ref2.id;

      if (this.collaborationMap.get(id) !== undefined) {
        this.dataRespondAll(data, id);
      } else {
        this.dataRespond(data, id);
      }
    }

    /**
    * send [Send request to a process]
    * @param  {[String]} taskName [task name - necessary]
    * @param  {[Any]} params [data passed to process - necessary]
    * @param  {[String]} id [the unique id bound to a process instance - not necessary]
    * @return {[Promise]} [return a Promise instance]
    */

  }, {
    key: 'send',
    value: function send(taskName, params, givenId) {
      var _this3 = this;

      if (givenId === 'default') throw new Error('ChildProcessPool: Prohibit the use of this id value: [default] !');

      var id = getRandomString();
      var forked = this.getForkedFromPool(givenId);
      return new Promise(function (resolve) {
        _this3.callbacks[id] = resolve;
        forked.send({ action: taskName, params: params, id: id });
      });
    }

    /**
    * sendToAll [Send requests to all processes]
    * @param  {[String]} taskName [task name - necessary]
    * @param  {[Any]} params [data passed to process - necessary]
    * @return {[Promise]} [return a Promise instance]
    */

  }, {
    key: 'sendToAll',
    value: function sendToAll(taskName, params) {
      var _this4 = this;

      var id = getRandomString();
      return new Promise(function (resolve) {
        _this4.callbacks[id] = resolve;
        _this4.collaborationMap.set(id, []);
        if (_this4.forked.length) {
          // use process in pool
          _this4.forked.forEach(function (forked) {
            forked.send({ action: taskName, params: params, id: id });
          });
        } else {
          // use default process
          _this4.getForkedFromPool().send({ action: taskName, params: params, id: id });
        }
      });
    }
  }]);

  return ChildProcessPool;
}();

module.exports = ChildProcessPool;