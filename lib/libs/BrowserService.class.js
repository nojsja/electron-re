"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var _require = require('electron'),
    BrowserWindow = _require.BrowserWindow,
    ipcMain = _require.ipcMain;

var path = require('path');

var fs = require('fs');

var url = require('url');

var conf = require('../conf/global.json');

var _require2 = require('./utils'),
    isEnvDev = _require2.isEnvDev,
    loadView = _require2.loadView,
    fnDebounce = _require2.fnDebounce,
    getRandomString = _require2.getRandomString;

var MessageChannel = require('./MessageChannel.class');

var FileWatcher = require('./FileWatcher.class');

var BrowserService = /*#__PURE__*/function () {
  /**
    * constructor
    * @param  {[String]} name [service name]
    * @param  {[String]} _path [path to service file]
    * @param  {[Object]} options [options to create BrowserWindow]
    */
  function BrowserService(name, _path2) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
      dev: false
    };
    (0, _classCallCheck2["default"])(this, BrowserService);

    this.didFinishLoad = function () {
      _this.serviceReady = true;

      _this.callbacks.forEach(function (callback) {
        callback(_this.id);
      });
    };

    this.didFailLoad = function (error) {
      _this.serviceReady = false;

      _this.fails.forEach(function (handle) {
        handle(error.toString());
      });
    };

    this.loadURL_SAFE = function (_path) {
      return new Promise(function (resolve, reject) {
        fs.readFile(_path, {
          encoding: 'utf-8'
        }, function (err, buffer) {
          if (err) {
            reject(err);

            _this.didFailLoad(err);

            return console.error(err);
          }

          _this._super.loadURL(loadView({
            webSecurity: true,
            script: buffer.toString(),
            title: "".concat(_this.name, " service"),
            base: _path
          }), {// baseURLForDataURL: `${conf.protocolName}://${path.dirname(_path)}` 
          }).then(resolve)["catch"](function (err) {
            reject(err);

            _this.didFailLoad(err);

            console.error(err);
          });
        });
      });
    };

    this.loadURL_UNSAFE = function (_path) {
      return _this._super.loadURL(loadView({
        webSecurity: false,
        src: _this.exec,
        title: "".concat(_this.name, " service"),
        base: _path
      }), {// baseURLForDataURL: `${conf.protocolName}://${path.dirname(_path)}`
      })["catch"](function (err) {
        _this.didFailLoad(err);

        console.error(err);
      });
    };

    options.webPreferences = options.webPreferences || {};
    options.webPreferences.nodeIntegration = true;
    options.webPreferences.contextIsolation = false;
    this._super = new BrowserWindow(_objectSpread(_objectSpread({}, options), {}, {
      show: false
    }));
    this.serviceReady = false;
    this.exec = _path2;
    this.name = name;
    this.listeners = [];
    this.callbacks = [];
    this.fails = [];
    this.id = this._super.id;
    this.callbacks.push(function () {
      MessageChannel.registry(name, _this.id, _this._super.webContents.getOSProcessId());
    });
    /* state change */

    this._super.webContents.on('did-finish-load', this.didFinishLoad);

    this._super.webContents.on('did-fail-load', this.didFailLoad);
    /* load contents immediately */


    this.loadURL(this.exec, {
      webSecurity: options.webPreferences.webSecurity !== false
    });
    /* watch file change */

    this.watchService(!!options.dev);
    this._super.connected = this.connected.bind(this);
    this._super.openDevTools = this.openDevTools.bind(this);
    return this._super;
  }
  /* --- function extends --- */


  (0, _createClass2["default"])(BrowserService, [{
    key: "openDevTools",
    value: function openDevTools() {
      this._super.webContents.openDevTools({
        mode: 'undocked'
      });
    }
    /* --- function expands --- */

    /* state listeners */

  }, {
    key: "watchService",
    value:
    /* auto reload */
    function watchService(isEnvDev) {
      var _this2 = this;

      if (isEnvDev) {
        var debouncer = fnDebounce();

        var reloadWindow = function () {
          this._super.webContents.reload();
        }.bind(this);

        var pid = getRandomString(); // watch service depends

        this.callbacks.push(function () {
          return _this2._super.webContents.send('get-watching-files', {
            pid: pid
          });
        });
        ipcMain.once(pid, function (event, result) {
          result.depends.forEach(function (depend) {
            FileWatcher.watch(depend, function () {
              debouncer(reloadWindow, 1e3, false, null);
            });
          });
        }); // watch service

        FileWatcher.watch(this.exec, function () {
          debouncer(_this2._super.webContents.reload.bind(_this2._super.webContents), 1e3, false, null);
        });
      }
    }
    /**
      * connected [service加载完成后触发回调监听者]
      * @param  {[windowId]} param [desc]
      * @param  {[Function]} callback [回调]
      */

  }, {
    key: "connected",
    value: function connected(callback) {
      var _this3 = this;

      if (callback && !(callback instanceof Function)) throw new Error('Param - callback must be function type!');

      if (this.serviceReady) {
        callback && callback(this.id);
        return Promise.resolve(this.id);
      } else {
        callback && this.callbacks.push(callback);
        return new Promise(function (resolve, reject) {
          _this3.callbacks.push(resolve);

          _this3.fails.push(reject);
        });
      }
    }
    /* --- function rewritten --- */

    /* loadURL */

  }, {
    key: "loadURL",
    value: function loadURL(_path) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (options.webSecurity) {
        return this.loadURL_SAFE(_path);
      } else {
        return this.loadURL_UNSAFE(_path);
      }
    }
    /* loadURL - safe function with script injection */

  }]);
  return BrowserService;
}();

module.exports = BrowserService;