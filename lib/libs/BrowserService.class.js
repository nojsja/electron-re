'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('electron'),
    BrowserWindow = _require.BrowserWindow,
    WebContents = _require.WebContents;

var path = require('path');
var fs = require('fs');
var url = require('url');

var _require2 = require('./utils'),
    isEnvDev = _require2.isEnvDev,
    loadView = _require2.loadView,
    fnDebounce = _require2.fnDebounce;

var MessageChannel = require('./MessageChannel.class');

var debouncer = fnDebounce();

var BrowserService = function () {
  /**
    * constructor
    * @param  {[String]} name [service name]
    * @param  {[String]} _path [path to service file]
    * @param  {[Object]} options [options to create BrowserWindow]
    */
  function BrowserService(name, _path) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, BrowserService);

    _initialiseProps.call(this);

    options.webPreferences = options.webPreferences || {};
    options.webPreferences.nodeIntegration = true;
    options.webPreferences.enableRemoteModule = true;

    this._super = new BrowserWindow(_extends({}, options, { show: false }));

    this.serviceReady = false;
    this.exec = _path;
    this.name = name;
    this.listeners = [];
    this.callbacks = [];
    this.fails = [];
    this.id = this._super.id;
    MessageChannel.registry(name, this.id, this);

    /* state change */
    this._super.webContents.on('did-finish-load', this.didFinishLoad);
    this._super.webContents.on('did-fail-load', this.didFailLoad);

    /* load contents immediately */
    this.loadURL(this.exec, {
      webSecurity: options.webPreferences.webSecurity !== false
    });

    /* watch file change */
    this.watchService(isEnvDev);

    if (isEnvDev) this._super.webContents.openDevTools();

    this._super.connected = this.connected.bind(this);

    return this._super;
  }

  /* state listeners */


  _createClass(BrowserService, [{
    key: 'loadURL',


    /* function extends */

    /* function rewriten */

    /* loadURL */
    value: function loadURL(_path) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (options.webSecurity) {
        return this.loadURL_SAFE(_path);
      } else {
        return this.loadURL_UNSAFE(_path);
      }
    }

    /* loadURL - safe function with script injection */


    /* loadURL - unsafe function to external script and options.webSecurity closed */

  }, {
    key: 'watchService',


    /* auto reload */
    value: function watchService(isEnvDev) {
      var _this = this;

      if (isEnvDev) {
        fs.watch(this.exec, function (eventType, filename) {
          debouncer(_this.webContents.reload.bind(_this.webContents), 1e3, false, null);
        });
      }
    }

    /**
      * connected [service加载完成后触发回调监听者]
      * @param  {[windowId]} param [desc]
      * @param  {[Function]} callback [回调]
      */

  }, {
    key: 'connected',
    value: function connected(callback) {
      var _this2 = this;

      if (callback && !(callback instanceof Function)) throw new Error('Param - callback must be function type!');

      if (this.serviceReady) {
        callback && callback(this.id);
        return Promise.resolve(this.id);
      } else {
        callback && this.callbacks.push(callback);
        return new Promise(function (resolve, reject) {
          _this2.callbacks.push(resolve);
          _this2.fails.push(reject);
        });
      }
    }
  }]);

  return BrowserService;
}();

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.didFinishLoad = function () {
    _this3.serviceReady = true;
    _this3.callbacks.forEach(function (callback) {
      callback(_this3.id);
    });
  };

  this.didFailLoad = function (error) {
    _this3.serviceReady = false;
    _this3.fails.forEach(function (handle) {
      handle(error.toString());
    });
  };

  this.loadURL_SAFE = function (_path) {
    return new Promise(function (resolve, reject) {
      fs.readFile(_path, { encoding: 'utf-8' }, function (err, buffer) {
        if (err) {
          reject(err);
          _this3.didFailLoad(err);
          return console.error(err);
        }
        _this3._super.loadURL(loadView({
          webSecurity: true,
          script: buffer.toString(),
          title: _this3.name + ' service',
          base: url.format({
            pathname: path.dirname(_this3.exec),
            protocol: 'file:',
            slashes: true
          })
        }), {
          baseURLForDataURL: path.dirname(_path)
        }).then(resolve).catch(function (err) {
          reject(err);
          _this3.didFailLoad(err);
          console.error(err);
        });
      });
    });
  };

  this.loadURL_UNSAFE = function (_path) {
    return _this3._super.loadURL(loadView({
      webSecurity: false,
      src: _this3.exec,
      title: _this3.name + ' service',
      base: url.format({
        pathname: path.dirname(_this3.exec),
        protocol: 'file:',
        slashes: true
      })
    }), {
      baseURLForDataURL: path.dirname(_path)
    }).catch(function (err) {
      _this3.didFailLoad(err);
      console.error(err);
    });
  };
};

module.exports = BrowserService;