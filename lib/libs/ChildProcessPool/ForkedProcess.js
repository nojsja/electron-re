"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _require = require('child_process'),
    fork = _require.fork;

var ForkedProcess = /*#__PURE__*/function () {
  function ForkedProcess(host, forkedPath) {
    var _this = this;

    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    (0, _classCallCheck2["default"])(this, ForkedProcess);

    this.send = function (params) {
      if (_this.sleeping) {
        _this.wakeup();
      }

      _this.connectionsCountPlus(params.id);

      _this.child.send(params);
    };

    this.connectionsCountPlus = function (id) {
      _this.activitiesMap.set(id, 1);

      _this.activitiesCount += 1;
      _this.host.connectionsMap[_this.pid] = _this.activitiesCount;
    };

    this.connectionsCountMinux = function (id) {
      if (_this.activitiesMap.has(id)) {
        _this.activitiesCount = _this.activitiesCount > 0 ? _this.activitiesCount - 1 : 0;

        _this.activitiesMap["delete"](id);
      }

      _this.host.connectionsMap[_this.pid] = _this.activitiesCount;
    };

    this.host = host;
    this.forkedPath = forkedPath;
    this.args = args;
    this.options = options;
    this.sleeping = false;
    this.activitiesCount = 0;
    this.activitiesMap = new Map();
    this.child = fork(this.forkedPath, this.args, this.options);
    this.pid = this.child.pid;
    this.init();
  }
  /* send STOP signal to a child process and let it freeze */


  (0, _createClass2["default"])(ForkedProcess, [{
    key: "sleep",
    value: function sleep() {
      if (this.activitiesCount) if (this.sleeping) return;
      process.kill(this.pid, 'SIGSTOP');
      this.sleeping = true;
    }
    /* send CONT signal to wake up a child process */

  }, {
    key: "wakeup",
    value: function wakeup() {
      if (!this.sleeping) return;
      process.kill(this.pid, 'SIGCONT');
      this.sleeping = false;
    }
  }, {
    key: "init",
    value: function init() {
      var _this2 = this;

      this.child.on('message', function (data) {
        var id = data.id;

        _this2.connectionsCountMinux(id);

        delete data.id;
        delete data.action;

        _this2.host.emit('forked_message', {
          data: data,
          id: id
        });
      });
      this.child.on('exit', function (code, signal) {
        if (code !== 0 && code !== null) {
          _this2.host.emit('forked_error', _this2.pid);
        } else {
          _this2.host.emit('forked_exit', _this2.pid);
        }
      });
      this.child.on('error', function (err) {
        console.log('forked error: ', err);

        _this2.host.emit('forked_error', err, _this2.pid);
      });
    }
  }]);
  return ForkedProcess;
}();

module.exports = ForkedProcess;