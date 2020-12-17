"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _require = require('electron'),
    ipcMain = _require.ipcMain,
    app = _require.app,
    BrowserWindow = _require.BrowserWindow;

var path = require('path');

var url = require('url');

var pidusage = require('pidusage');

var ProcessManager = /*#__PURE__*/function () {
  function ProcessManager() {
    var _this = this;

    (0, _classCallCheck2["default"])(this, ProcessManager);

    this.refreshList = function () {
      return new Promise(function (resolve, reject) {
        if (_this.pidList.length) {
          pidusage(_this.pidList, function (err, records) {
            if (err) {
              console.log("ProcessManager: refreshList -> ".concat(err));
            } else {
              _this.processWindow.webContents.send('process:update-list', {
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

    this.openDevTools = function (pid) {
      BrowserWindow.getAllWindows().forEach(function (win) {
        if (win.webContents.getOSProcessId() === Number(pid)) {
          win.webContents.openDevTools({
            mode: 'undocked'
          });
        }
      });
    };

    this.killProcess = function (pid) {
      try {
        process.kill(pid);
      } catch (error) {
        console.error("ProcessManager: killProcess -> ".concat(pid, " error: ").concat(error));
      }
    };

    this.pidList = [process.pid];
    this.pid = null;
    this.typeMap = (0, _defineProperty2["default"])({}, process.pid, 'main');
    this.status = 'pending';
    this.processWindow = null;
    this.time = 1e3;
    this.callSymbol = false;
    this.logs = [];
  }
  /* -------------- internal -------------- */

  /* refresh process list */


  (0, _createClass2["default"])(ProcessManager, [{
    key: "setTimer",

    /* set timer to refresh */
    value: function setTimer() {
      var _this2 = this;

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
                            return _this2.refreshList();

                          case 2:
                            interval(_this2.time);

                          case 3:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  })), _this2.time);

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
      var _this3 = this;

      if (this.processWindow) {
        if (!this.callSymbol) {
          this.callSymbol = true;
          setTimeout(function () {
            _this3.processWindow.webContents.send('process:stdout', _this3.logs);

            _this3.logs = [];
            _this3.callSymbol = false;
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
      var _this4 = this;

      if (pinstance.stdout) {
        pinstance.stdout.on('data', function (trunk) {
          _this4.stdout(pinstance.pid, trunk);
        });
      }
    }
    /* listen processes with pids */

  }, {
    key: "listen",
    value: function listen(pids) {
      var _this5 = this;

      var mark = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "renderer";
      pids = pids instanceof Array ? pids : [pids];
      pids.forEach(function (pid) {
        if (!_this5.pidList.includes(pid)) {
          _this5.pidList.push(pid);
        }

        _this5.typeMap[pid] = mark;
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

  }, {
    key: "setIntervalTime",

    /**
      * setIntervalTime [set interval (ms)]
      * @param  {[Number]} time [a positive number to set the refresh interval]
      */
    value: function setIntervalTime(time) {
      time = Number(time);
      if (isNaN(time)) throw new Error('ProcessManager: the time value is invalid!');
      if (time < 100) console.warn("ProcessManager: the refresh interval is too small!");
      this.time = time;
    }
    /* open a process list window */

  }, {
    key: "openWindow",
    value: function openWindow() {
      var _this6 = this;

      var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'prod';
      app.whenReady().then(function () {
        _this6.processWindow = new BrowserWindow({
          show: false,
          width: 600,
          height: 400,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
          }
        }); // this.processWindow.setMenu(null);

        var loadingUrl = env === 'dev' ? url.format({
          pathname: '127.0.0.1:3000',
          protocol: 'http:',
          slashes: true
        }) : url.format({
          pathname: path.join(__dirname, '../ui/index.html'),
          protocol: 'file:',
          slashes: true
        });

        _this6.processWindow.once('ready-to-show', function () {
          _this6.processWindow.show();

          _this6.pid = _this6.processWindow.webContents.getOSProcessId();

          _this6.setTimer(2e3);

          ipcMain.on('process:kill-process', function (event, args) {
            return _this6.killProcess(args);
          });
          ipcMain.on('process:open-devtools', function (event, args) {
            return _this6.openDevTools(args);
          });
        });

        _this6.processWindow.loadURL(loadingUrl);
      });
    }
  }]);
  return ProcessManager;
}();

global.processManager = global.processManager || new ProcessManager();
module.exports = global.processManager;