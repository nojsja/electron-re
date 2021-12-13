"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var _require = require('electron'),
    BrowserWindow = _require.BrowserWindow;

var _require2 = require('stream'),
    EventEmitter = _require2.EventEmitter;

var pidusage = require('pidusage');

var _require3 = require('../consts'),
    KILL_SIGNAL = _require3.KILL_SIGNAL,
    OPEN_DEVTOOLS_SIGNAL = _require3.OPEN_DEVTOOLS_SIGNAL,
    CATCH_SIGNAL = _require3.CATCH_SIGNAL,
    LOG_SIGNAL = _require3.LOG_SIGNAL,
    UPDATE_SIGNAL = _require3.UPDATE_SIGNAL,
    START_TIMER_SIGNAL = _require3.START_TIMER_SIGNAL;

var ProcessManagerUI = require('./ui');

var ProcessManager = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(ProcessManager, _EventEmitter);

  var _super = _createSuper(ProcessManager);

  function ProcessManager() {
    var _this;

    (0, _classCallCheck2["default"])(this, ProcessManager);
    _this = _super.call(this);

    _this.initTemplate = function () {
      _this.on(KILL_SIGNAL, function (event) {
        var _this2;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return (_this2 = _this).killProcess.apply(_this2, args);
      });

      _this.on(OPEN_DEVTOOLS_SIGNAL, function (event) {
        var _this3;

        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return (_this3 = _this).openDevTools.apply(_this3, args);
      });

      _this.on(CATCH_SIGNAL, function (event) {
        var _this4;

        for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
          args[_key3 - 1] = arguments[_key3];
        }

        return (_this4 = _this).ipcSignalsRecorder.apply(_this4, args);
      });

      _this.on(START_TIMER_SIGNAL, function (event) {
        var _this5;

        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }

        return (_this5 = _this).startTimer.apply(_this5, args);
      });
    };

    _this.ipcSignalsRecorder = function (params, e) {
      _this.win.sendToWeb(CATCH_SIGNAL, params);
    };

    _this.refreshProcessList = function () {
      return new Promise(function (resolve, reject) {
        if (_this.pidList.length) {
          pidusage(_this.pidList, function (err, records) {
            if (err) {
              console.log("ProcessManager: refreshList errored -> ".concat(err));
            } else {
              _this.pidMap = Object.assign(_this.pidMap, records);

              _this.win.sendToWeb(UPDATE_SIGNAL, {
                records: records,
                types: _this.typeMap
              });
            }

            resolve();
          });
        } else {
          resolve([]);
        }
      });
    };

    _this.openDevTools = function (pid) {
      BrowserWindow.getAllWindows().forEach(function (win) {
        if (win.webContents.getOSProcessId() === Number(pid)) {
          win.webContents.openDevTools({
            mode: 'undocked'
          });
        }
      });
    };

    _this.killProcess = function (pid) {
      try {
        process.kill(pid);
      } catch (error) {
        console.error("ProcessManager: killProcess -> ".concat(pid, " errored: ").concat(error));
      }
    };

    _this.setIntervalTime = function (time) {
      time = Number(time);
      if (isNaN(time)) throw new Error('ProcessManager: the time value is invalid!');
      if (time < 100) console.warn("ProcessManager: the refresh interval is too small!");
      _this.time = time;
    };

    _this.openWindow = function () {
      var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'prod';

      _this.win.open(env);
    };

    _this.win = new ProcessManagerUI((0, _assertThisInitialized2["default"])(_this));
    _this.pidList = [process.pid];
    _this.pid = null;
    _this.typeMap = (0, _defineProperty2["default"])({}, process.pid, {
      type: 'main',
      url: ''
    });
    _this.status = 'pending';
    _this.time = 1e3;
    _this.callSymbol = false;
    _this.logs = [];
    _this.pidMap = {};

    _this.initTemplate();

    return _this;
  }
  /* -------------- internal -------------- */

  /* template functions */


  (0, _createClass2["default"])(ProcessManager, [{
    key: "startTimer",
    value:
    /* set timer to refresh */
    function startTimer() {
      var _this6 = this;

      if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

      var interval = /*#__PURE__*/function () {
        var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                    return _regenerator["default"].wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return _this6.refreshProcessList();

                          case 2:
                            interval(_this6.time);

                          case 3:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  })), _this6.time);

                case 1:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function interval() {
          return _ref.apply(this, arguments);
        };
      }();

      this.status = 'started';
      interval();
    }
    /* -------------- function -------------- */

    /* send stdout to ui-processor */

  }, {
    key: "stdout",
    value: function stdout(pid, data) {
      var _this7 = this;

      if (this.win) {
        if (!this.callSymbol) {
          this.callSymbol = true;
          setTimeout(function () {
            _this7.win.sendToWeb(LOG_SIGNAL, _this7.logs);

            _this7.logs = [];
            _this7.callSymbol = false;
          }, this.time);
        } else {
          this.logs.push({
            pid: pid,
            data: String.prototype.trim.call(data)
          });
        }
      }
    }
    /* pipe to process.stdout */

  }, {
    key: "pipe",
    value: function pipe(pinstance) {
      var _this8 = this;

      if (pinstance.stdout) {
        pinstance.stdout.on('data', function (trunk) {
          _this8.stdout(pinstance.pid, trunk);
        });
      }
    }
    /* listen processes with pids */

  }, {
    key: "listen",
    value: function listen(pids) {
      var _this9 = this;

      var mark = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "renderer";
      var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
      pids = pids instanceof Array ? pids : [pids];
      pids.forEach(function (pid) {
        if (!_this9.pidList.includes(pid)) {
          _this9.pidList.push(pid);
        }

        _this9.typeMap[pid] = _this9.typeMap[pid] || {};
        _this9.typeMap[pid].type = mark;
        _this9.typeMap[pid].url = url;
      });
    }
    /* unlisten processes with pids */

  }, {
    key: "unlisten",
    value: function unlisten(pids) {
      pids = pids instanceof Array ? pids : [pids];
      this.pidList = this.pidList.filter(function (pid) {
        return !pids.includes(pid);
      });
    }
    /* openDevTools */

  }]);
  return ProcessManager;
}(EventEmitter);

if (!('electronre:$processManager' in global)) {
  Object.defineProperty(global, "electronre:$processManager", {
    value: new ProcessManager(),
    writable: false,
    configurable: false,
    enumerable: true
  });
}

module.exports = global['electronre:$processManager'];