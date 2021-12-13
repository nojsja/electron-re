"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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
      if (!_this.window.isDestroyed()) _this.window.webContents.send(action, data);
    };

    this.open = function () {
      var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'prod';
      app.whenReady().then(function () {
        _this.window = new BrowserWindow({
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

        _this.window.once('ready-to-show', function () {
          _this.window.show();

          _this.host.pid = _this.window.webContents.getOSProcessId();

          _this.host.emit(START_TIMER_SIGNAL, conf.uiRefreshInterval);
        });

        _this.window.loadURL(_this.getAddress(env));
      });
    };

    this.host = host;
    this.url = null;
    this.window = null;
    this.initTemplate();
  }
  /* template functions */


  (0, _createClass2["default"])(ProcessManagerUI, [{
    key: "initTemplate",
    value: function initTemplate() {
      var _this2 = this;

      ipcMain.on(KILL_SIGNAL, function (event, args) {
        return _this2.host.emit(KILL_SIGNAL, args);
      });
      ipcMain.on(OPEN_DEVTOOLS_SIGNAL, function (event, args) {
        return _this2.host.emit(OPEN_DEVTOOLS_SIGNAL, args);
      });
      ipcMain.on(CATCH_SIGNAL, function (event, args) {
        return _this2.host.emit(CATCH_SIGNAL, args || event);
      });
    }
    /* get dev/prod ui address */

  }]);
  return ProcessManagerUI;
}();

module.exports = ProcessManagerUI;