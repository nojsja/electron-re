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
const EventCenter = require('../EventCenter.class');

class ProcessManagerUI {
  constructor(host) {
    this.host = host;
    this.url = null;
    this.win = null;
    this.initTemplate();
  }

  /* template functions */
  initTemplate() {
    ipcMain.on(KILL_SIGNAL, (event, args) => {
      EventCenter.emit(`process-manager:${KILL_SIGNAL}`, args);
    });
    ipcMain.on(OPEN_DEVTOOLS_SIGNAL, (event, args) => {
      EventCenter.emit(`process-manager:${OPEN_DEVTOOLS_SIGNAL}`, args);
    });
    ipcMain.on(CATCH_SIGNAL, (event, args) => {
      EventCenter.emit(`process-manager:${CATCH_SIGNAL}`, args || event);
    });
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
    try {
      if (this.win && !this.win.isDestroyed()) {
        this.win.webContents.send(action, data);
      }
    } catch (error) {
      console.error(err)
    }
  }

  onReadyToShow = () => {
    this.win.show();
    this.host.pid = this.win.webContents.getOSProcessId();
    EventCenter.emit(`process-manager:${START_TIMER_SIGNAL}`, conf.uiRefreshInterval);
  }

  onClosed = () => {
    this.win.off('ready-to-show', this.onReadyToShow);
    this.host.ui = null;
    this.win = null;
  }

  /* show */
  show = () => {
    this.win && this.win.show();
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

    this.win.on('closed', this.onClosed);

    await new Promise((resolve) => {
      this.win.once('ready-to-show', () => {
        this.onReadyToShow();
        resolve();
      });
    });
  }
}

module.exports = ProcessManagerUI;