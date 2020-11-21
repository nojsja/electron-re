const { BrowserWindow, WebContents, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { isEnvDev, loadView, fnDebounce, getRandomString, getModuleFilePath } = require('./utils');
const MessageChannel = require('./MessageChannel.class');

const debouncer = fnDebounce();

class BrowserService {
  /**
    * constructor
    * @param  {[String]} name [service name]
    * @param  {[String]} _path [path to service file]
    * @param  {[Object]} options [options to create BrowserWindow]
    */
  constructor(name, _path, options={}) {
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
      const reloadWindow = (id) => {
        console.log(this.id);
        this._super.webContents.reload();
      };
      const pid = getRandomString();
      this.callbacks.push(() => this._super.webContents.send('get-watching-files', { pid }));
      ipcMain.once(pid, (event, result) => {
        result.depends.forEach(depend => {
          fs.watch((depend), () => {
            debouncer(reloadWindow, 1e3, false, null);
          });
        });
      });
      fs.watch(this.exec, (eventType, filename) => {
        debouncer(this.webContents.reload.bind(this.webContents), 1e3, false, null);
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
              base: url.format({
                  pathname: path.dirname(this.exec),
                  protocol: 'file:',
                  slashes: true
              })
          }),
          {
            baseURLForDataURL: path.dirname(_path)
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
    return this._super.loadURL(
      loadView({
          webSecurity: false,
          src: this.exec,
          title: `${this.name} service`,
          base: url.format({
              pathname: path.dirname(this.exec),
              protocol: 'file:',
              slashes: true
          })
      }),
      {
        baseURLForDataURL: path.dirname(_path)
      }
    ).catch(err => {
      this.didFailLoad(err);
      console.error(err);
    });
  }
}

module.exports = BrowserService;
