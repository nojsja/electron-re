"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

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
      _this.on(KILL_SIGNAL, function () {
        var _this2;

        return (_this2 = _this).killProcess.apply(_this2, arguments);
      });

      _this.on(OPEN_DEVTOOLS_SIGNAL, function () {
        var _this3;

        return (_this3 = _this).openDevTools.apply(_this3, arguments);
      });

      _this.on(CATCH_SIGNAL, function () {
        var _this4;

        return (_this4 = _this).ipcSignalsRecorder.apply(_this4, arguments);
      });

      _this.on(START_TIMER_SIGNAL, function () {
        var _this5;

        return (_this5 = _this).startTimer.apply(_this5, arguments);
      });
    };

    _this.ipcSignalsRecorder = function (params, e) {
      _this.ui.sendToWeb(CATCH_SIGNAL, params);
    };

    _this.refreshProcessList = function () {
      return new Promise(function (resolve, reject) {
        if (_this.pidList.length) {
          pidusage(_this.pidList, function (err, records) {
            if (err) {
              console.log("ProcessManager: refreshList errored -> ".concat(err));
            } else {
              _this.pidMap = Object.assign(_this.pidMap, records);

              _this.emit('refresh', _this.pidMap);

              _this.ui.sendToWeb(UPDATE_SIGNAL, {
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

    _this.startTimer = function () {
      if (_this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

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
                            return _this.refreshProcessList();

                          case 2:
                            interval(_this.time);

                          case 3:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  })), _this.time);

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

      _this.status = 'started';
      interval();
    };

    _this.stdout = function (pid, data) {
      if (_this.ui) {
        if (!_this.callSymbol) {
          _this.callSymbol = true;
          setTimeout(function () {
            _this.ui.sendToWeb(LOG_SIGNAL, _this.logs);

            _this.logs = [];
            _this.callSymbol = false;
          }, _this.time);
        } else {
          _this.logs.push({
            pid: pid,
            data: String.prototype.trim.call(data)
          });
        }
      }
    };

    _this.pipe = function (pinstance) {
      if (pinstance.stdout) {
        pinstance.stdout.on('data', function (trunk) {
          _this.stdout(pinstance.pid, trunk);
        });
      }
    };

    _this.listen = function (pids) {
      var mark = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "renderer";
      var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
      pids = pids instanceof Array ? pids : [pids];
      pids.forEach(function (pid) {
        if (!_this.pidList.includes(pid)) {
          _this.pidList.push(pid);
        }

        _this.typeMap[pid] = _this.typeMap[pid] || {};
        _this.typeMap[pid].type = mark;
        _this.typeMap[pid].url = url;
      });
    };

    _this.unlisten = function (pids) {
      pids = pids instanceof Array ? pids : [pids];
      _this.pidList = _this.pidList.filter(function (pid) {
        return !pids.includes(pid);
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

    _this.openWindow = /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
      var env,
          _args3 = arguments;
      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              env = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : 'prod';

              if (_this.ui) {
                _context3.next = 8;
                break;
              }

              _this.ui = new ProcessManagerUI((0, _assertThisInitialized2["default"])(_this));

              _this.initTemplate();

              _context3.next = 6;
              return _this.ui.open(env);

            case 6:
              _context3.next = 9;
              break;

            case 8:
              _this.ui.show();

            case 9:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    _this.ui = null;
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
    return _this;
  }
  /* -------------- internal -------------- */

  /* template functions */


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