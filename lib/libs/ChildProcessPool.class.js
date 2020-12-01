'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('child_process'),
    fork = _require.fork;

var _require2 = require('./utils'),
    getRandomString = _require2.getRandomString;

var ChildProcess = function () {
  function ChildProcess(_ref) {
    var _this = this;

    var path = _ref.path,
        _ref$max = _ref.max,
        max = _ref$max === undefined ? 6 : _ref$max,
        cwd = _ref.cwd,
        env = _ref.env;

    _classCallCheck(this, ChildProcess);

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

    this.cwd = cwd || process.cwd();
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


  _createClass(ChildProcess, [{
    key: 'getForkedFromPool',


    /* Get a process instance from the pool */
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
            _this2.onMessage({ data: data, id: data.id });
          });
          this.pidMap.set(id, forked.pid);
        } else {
          this.forkIndex = this.forkIndex % this.forkMaxIndex;
          forked = this.forked[this.forkIndex];
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

    /* Send request to a process */

  }, {
    key: 'send',
    value: function send(params, givenId) {
      var _this3 = this;

      var id = givenId || getRandomString();
      var forked = this.getForkedFromPool(id);
      return new Promise(function (resolve) {
        _this3.callbacks[id] = resolve;
        forked.send(_extends({}, params, { id: id }));
      });
    }

    /* Send requests to all processes */

  }, {
    key: 'sendToAll',
    value: function sendToAll(params) {
      var _this4 = this;

      var id = getRandomString();
      return new Promise(function (resolve) {
        _this4.callbacks[id] = resolve;
        _this4.collaborationMap.set(id, []);
        if (_this4.forked.length) {
          // use process in pool
          _this4.forked.forEach(function (forked) {
            forked.send(_extends({}, params, { id: id }));
          });
        } else {
          // use default process
          _this4.getForkedFromPool().send(_extends({}, params, { id: id }));
        }
      });
    }
  }]);

  return ChildProcess;
}();

module.exports = ChildProcess;