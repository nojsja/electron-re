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
    this.win = null;
    this.initTemplate();
  }

  /* template functions */
  initTemplate() {
    ipcMain.on(KILL_SIGNAL, (event, args) => this.host.emit(KILL_SIGNAL, args));
    ipcMain.on(OPEN_DEVTOOLS_SIGNAL, (event, args) => this.host.emit(OPEN_DEVTOOLS_SIGNAL, args));
    ipcMain.on(CATCH_SIGNAL, (event, args) => this.host.emit(CATCH_SIGNAL, args || event));
  }

  /* get dev/prod ui address */
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

  /* send data to webContents */
  sendToWeb = (action, data) => {
    if (this.win && !this.win.isDestroyed())
      this.win.webContents.send(action, data);
  }

  /* open main window */
  open = async (env = 'prod') => {
    await app.whenReady();
    this.win = new BrowserWindow({
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

    this.win.loadURL(this.getAddress(env));
    await new Promise((resolve) => {
      this.win.once('ready-to-show', () => {
        this.win.show();
        this.host.pid = this.win.webContents.getOSProcessId();
        this.host.emit(START_TIMER_SIGNAL, conf.uiRefreshInterval)
        resolve();
      });
    });
  }
}

module.exports = ProcessManagerUI;