const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const pidusage = require('pidusage');
const MessageChannel = require('./MessageChannel.class');

class ProcessManager {
  constructor() {
    this.pidList = [process.pid];
    this.status = 'pending';
    this.processWindow = null;
  }

  /* refresh process list */
  refreshList = () => {
    return new Promise((resolve, reject) => {
      if (this.pidList.length) {
        pidusage(this.pidList, (err, records) => {
          if (err) {
            console.log(`ProcessManager: refreshList -> ${err}`);
          } else {
            this.processWindow.webContents.send('process:update-list', records);
          }
          resolve();
        });
      } else {
        resolve([]);
      }
    });
  }
  
  /* set timer to refresh */
  setTimer(time = 1000) {
    if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

    const interval = async (time) => {
      setTimeout(async () => {
        await this.refreshList()
        interval(time)
      }, time)
    }

    this.status = 'started';
    interval(time)
  }

  /* listen processes with pids */
  listen(pids) {
    pids = (pids instanceof Array) ? pids : [pids];
    this.pidList = Array.from(new Set(this.pidList.concat(pids)));
  }

  /* unlisten processes with pids */
  unlisten(pids) {
    pids = (pids instanceof Array) ? pids : [pids];
    this.pidList = this.pidList.filter(pid => !pids.includes(pid));
  }

  /* open a process list window */
  openWindow(env = 'prod') {
    app.whenReady().then(async() => {
      this.processWindow = new BrowserWindow({
        show: false,
        width: 600,
        height: 400,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true
        },
      });
      const loadingUrl = (env === 'dev') ? url.format({
        pathname: '127.0.0.1:3000',
        protocol: 'http:',
        slashes: true,
      }) : '../ui/index.html';
  
      this.processWindow.once('ready-to-show', () => {
        this.processWindow.show();
        this.setTimer(2e3);
      });
      
      this.processWindow.loadURL(loadingUrl);
    });
  }

}

global.processManager = global.processManager || new ProcessManager();

MessageChannel.event.on('registry', () => {
  global.processManager.listen(
    Object
      .keys(MessageChannel.services)
      .map(name => (MessageChannel.services[name].pid))
  );
});
MessageChannel.event.on('unregistry', ({pid}) => {
  global.processManager.unlisten(pid)
});

MessageChannel.event.emit('registry');

module.exports = global.processManager;