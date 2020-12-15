"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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

    _classCallCheck(this, ProcessManager);

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
    this.typeMap = _defineProperty({}, process.pid, 'main');
    this.status = 'pending';
    this.processWindow = null;
    this.time = 2e3;
  }
  /* -------------- internal -------------- */

  /* refresh process list */


  _createClass(ProcessManager, [{
    key: "setTimer",

    /* set timer to refresh */
    value: function setTimer() {
      var _this2 = this;

      if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

      var interval = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  setTimeout( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                    return regeneratorRuntime.wrap(function _callee$(_context) {
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

    /* listen processes with pids */

  }, {
    key: "listen",
    value: function listen(pids) {
      var _this3 = this;

      var mark = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "renderer";
      pids = pids instanceof Array ? pids : [pids];
      pids.forEach(function (pid) {
        _this3.typeMap[pid] = mark;
      });
      this.pidList = Array.from(new Set(this.pidList.concat(pids)));
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
      var _this4 = this;

      var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'prod';
      app.whenReady().then( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var loadingUrl;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _this4.processWindow = new BrowserWindow({
                  show: false,
                  width: 600,
                  height: 400,
                  autoHideMenuBar: true,
                  webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true
                  }
                });
                loadingUrl = env === 'dev' ? url.format({
                  pathname: '127.0.0.1:3000',
                  protocol: 'http:',
                  slashes: true
                }) : url.format({
                  pathname: path.join(__dirname, '../ui/index.html'),
                  protocol: 'file:',
                  slashes: true
                });

                _this4.processWindow.once('ready-to-show', function () {
                  _this4.processWindow.show();

                  _this4.setTimer(2e3);

                  ipcMain.on('process:kill-process', function (event, args) {
                    return _this4.killProcess(args);
                  });
                  ipcMain.on('process:open-devtools', function (event, args) {
                    return _this4.openDevTools(args);
                  });
                });

                _this4.processWindow.loadURL(loadingUrl);

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      })));
    }
  }]);

  return ProcessManager;
}();

global.processManager = global.processManager || new ProcessManager();
module.exports = global.processManager;