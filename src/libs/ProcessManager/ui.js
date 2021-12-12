const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const conf = require('../../conf/global.json');

const {
  KILL_SIGNAL,
  OPEN_DEVTOOLS_SIGNAL,
  CATCH_SIGNAL,
  START_TIMER_SIGNAL
} = require('../consts');

class ProcessManagerUI {
  constructor(host) {
    this.host = host;
    this.url = null;
    this.window = null;
  }

  getAddress = (env = 'prod') => {
    this.url = (env === 'dev') ?
      url.format({
        pathname: conf.uiDevServer,
        protocol: 'http:',
        slashes: true,
      }) :
      url.format({
        pathname: path.join(__dirname, '../../ui/index.html'),
        protocol: 'file:',
        slashes: true,
      });

    return this.url;
  }

  sendToWeb = (action, data) => {
    if (!this.window.isDestroyed())
      this.window.webContents.send(action, data);
  }

  /* open a process list window */
  open = (env = 'prod') => {
    app.whenReady().then(() => {
      this.window =
        new BrowserWindow({
          show: false,
          width: 600,
          height: 400,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false,
          },
        });

      this.window.once('ready-to-show', () => {
        this.window.show();
        this.host.pid = this.window.webContents.getOSProcessId();
        this.host.emit(START_TIMER_SIGNAL, conf.uiRefreshInterval)
        ipcMain.on(KILL_SIGNAL, (event, args) => this.host.emit(KILL_SIGNAL, args));
        ipcMain.on(OPEN_DEVTOOLS_SIGNAL, (event, args) => this.host.emit(OPEN_DEVTOOLS_SIGNAL, args));
        ipcMain.on(CATCH_SIGNAL, (event, args) => this.host.emit(CATCH_SIGNAL, args || event));
      });

      this.window.loadURL(this.getAddress(env));
    });
  }
}

module.exports = ProcessManagerUI;