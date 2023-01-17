"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _require = require('electron'),
    ipcMain = _require.ipcMain,
    app = _require.app,
    BrowserWindow = _require.BrowserWindow;

var path = require('path');

var url = require('url');

var conf = require('../../conf/global.json');

var _require2 = require('../consts'),
    KILL_SIGNAL = _require2.KILL_SIGNAL,
    OPEN_DEVTOOLS_SIGNAL = _require2.OPEN_DEVTOOLS_SIGNAL,
    CATCH_SIGNAL = _require2.CATCH_SIGNAL,
    START_TIMER_SIGNAL = _require2.START_TIMER_SIGNAL;

var EventCenter = require('../EventCenter.class');

var ProcessManagerUI = /*#__PURE__*/function () {
  function ProcessManagerUI(host) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, ProcessManagerUI);

    this.getAddress = function () {
      var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'prod';
      _this.url = env === 'dev' ? url.format({
        pathname: conf.uiDevServer,
        protocol: 'http:',
        slashes: true
      }) : url.format({
        pathname: path.join(__dirname, '../../ui/index.html'),
        protocol: 'file:',
        slashes: true
      });
      return _this.url;
    };

    this.sendToWeb = function (action, data) {
      try {
        if (_this.win && !_this.win.isDestroyed()) {
          _this.win.webContents.send(action, data);
        }
      } catch (error) {
        console.error(err);
      }
    };

    this.onReadyToShow = function () {
      _this.win.show();

      _this.host.pid = _this.win.webContents.getOSProcessId();
      EventCenter.emit("process-manager:".concat(START_TIMER_SIGNAL), conf.uiRefreshInterval);
    };

    this.onClosed = function () {
      _this.win.off('ready-to-show', _this.onReadyToShow);

      _this.host.ui = null;
      _this.win = null;
    };

    this.show = function () {
      _this.win && _this.win.show();
    };

    this.open = /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
      var env,
          _args = arguments;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              env = _args.length > 0 && _args[0] !== undefined ? _args[0] : 'prod';
              _context.next = 3;
              return app.whenReady();

            case 3:
              _this.win = new BrowserWindow({
                show: false,
                width: 600,
                height: 400,
                autoHideMenuBar: true,
                webPreferences: {
                  nodeIntegration: true,
                  contextIsolation: false,
                  enableRemoteModule: true,
                  webSecurity: false
                }
              });

              _this.win.loadURL(_this.getAddress(env));

              _this.win.on('closed', _this.onClosed);

              _context.next = 8;
              return new Promise(function (resolve) {
                _this.win.once('ready-to-show', function () {
                  _this.onReadyToShow();

                  resolve();
                });
              });

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    this.host = host;
    this.url = null;
    this.win = null;
    this.initTemplate();
  }
  /* template functions */


  (0, _createClass2["default"])(ProcessManagerUI, [{
    key: "initTemplate",
    value: function initTemplate() {
      ipcMain.on(KILL_SIGNAL, function (event, args) {
        EventCenter.emit("process-manager:".concat(KILL_SIGNAL), args);
      });
      ipcMain.on(OPEN_DEVTOOLS_SIGNAL, function (event, args) {
        EventCenter.emit("process-manager:".concat(OPEN_DEVTOOLS_SIGNAL), args);
      });
      ipcMain.on(CATCH_SIGNAL, function (event, args) {
        EventCenter.emit("process-manager:".concat(CATCH_SIGNAL), args || event);
      });
    }
    /* get dev/prod ui address */

  }]);
  return ProcessManagerUI;
}();

module.exports = ProcessManagerUI;