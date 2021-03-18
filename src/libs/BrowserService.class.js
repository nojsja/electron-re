const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const conf = require('../conf/global.json');
const { isEnvDev, loadView, fnDebounce, getRandomString } = require('./utils');
const MessageChannel = require('./MessageChannel.class');
const FileWatcher = require('./FileWatcher.class');

class BrowserService {
  /**
    * constructor
    * @param  {[String]} name [service name]
    * @param  {[String]} _path [path to service file]
    * @param  {[Object]} options [options to create BrowserWindow]
    */
  constructor(name, _path, options={ dev: false }) {
    options.webPreferences = options.webPreferences || {};
    options.webPreferences.nodeIntegration = true;
    options.webPreferences.enableRemoteModule = true;

    this._super = new BrowserWindow({...options, show: false });

    this.serviceReady = false;
    this.exec= _path;
    this.name = name;
    this.listeners = [];
    this.callbacks = [];

    this.fails = [];
    this.id = this._super.id;

    this.callbacks.push(() => {
      MessageChannel.registry(name, this.id, this._super.webContents.getOSProcessId());
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

  openDevTools() {
    this._super.webContents.openDevTools({
      mode: 'undocked'
    });
  }

  /* --- function expands --- */

  /* state listeners */
  didFinishLoad = () => {
    this.serviceReady = true;
    this.callbacks.forEach(callback => {
      callback(this.id);
    });
  }

  didFailLoad = (error) => {
    this.serviceReady = false;
    this.fails.forEach(handle => {
      handle(error.toString());
    });
  }

  /* auto reload */
  watchService(isEnvDev) {
    if (isEnvDev) {
      const debouncer = fnDebounce();
      const reloadWindow = function() {
        this._super.webContents.reload();
      }.bind(this);
      const pid = getRandomString();

      // watch service depends
      this.callbacks.push(() => this._super.webContents.send('get-watching-files', { pid }));
      ipcMain.once(pid, (event, result) => {
        result.depends.forEach(depend => {
          FileWatcher.watch(depend, () => {
            debouncer(reloadWindow, 1e3, false, null);
          });
        });
      });

      // watch service
      FileWatcher.watch(this.exec, () => {
        debouncer(this._super.webContents.reload.bind(this._super.webContents), 1e3, false, null);
      });
    }
  }

  /**
    * connected [service加载完成后触发回调监听者]
    * @param  {[windowId]} param [desc]
    * @param  {[Function]} callback [回调]
    */
  connected(callback) {
    if ((callback && !(callback instanceof Function))) throw new Error('Param - callback must be function type!');

    if (this.serviceReady) {
      callback && callback(this.id)
      return Promise.resolve(this.id);
    } else {
      callback && this.callbacks.push(callback);
      return new Promise((resolve, reject) => {
        this.callbacks.push(resolve);
        this.fails.push(reject);
      });
    }
  }

  /* --- function rewritten --- */

  /* loadURL */
  loadURL(_path, options={}) {
    if (options.webSecurity) {
      return this.loadURL_SAFE(_path);
    } else {
      return this.loadURL_UNSAFE(_path);
    }
  }

  /* loadURL - safe function with script injection */
  loadURL_SAFE = (_path) => {
    const baseUrl = url.format({
      pathname: (_path),
      protocol: 'file:',
      slashes: true
    });

    return new Promise((resolve, reject) => {
      fs.readFile(_path, { encoding: 'utf-8' }, (err, buffer) => {
        if (err) {
          reject(err);
          this.didFailLoad(err);
          return console.error(err);
        }
        this._super.loadURL(
          loadView({
              webSecurity: true,
              script: buffer.toString(),
              title: `${this.name} service`,
              base: baseUrl
          }),
          {
            baseURLForDataURL: `${conf.protocolName}://${path.dirname(_path)}` 
          }
        ).then(resolve)
        .catch(err => {
          reject(err);
          this.didFailLoad(err);
          console.error(err);
        });
      })
    })
  }

  /* loadURL - unsafe function to external script and options.webSecurity closed */
  loadURL_UNSAFE = (_path) => {
    const baseUrl = url.format({
      pathname: (_path),
      protocol: 'file:',
      slashes: true
    });
    
    return this._super.loadURL(
      loadView({
          webSecurity: false,
          src: this.exec,
          title: `${this.name} service`,
          base: baseUrl
      }),
      {
        baseURLForDataURL: `${conf.protocolName}://${path.dirname(_path)}`
      }
    ).catch(err => {
      this.didFailLoad(err);
      console.error(err);
    });
  }
}

module.exports = BrowserService;
