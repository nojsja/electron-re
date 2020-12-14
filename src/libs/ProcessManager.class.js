const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const pidusage = require('pidusage');
const { statSync, stat } = require('fs');
const MessageChannel = require('./MessageChannel.class');
const { promises } = require('dns');
const { measureMemory } = require('vm');

class ProcessManager {
  constructor() {
    this.pidList = [];
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
  setRefreshListTimer(time = 1000) {
    if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

    MessageChannel.event.on('registry', () => {
      console.log(MessageChannel.services);
      this.pidList =
        Object.keys(MessageChannel.services)
        .map(name => (MessageChannel.services[name].pid))
    });
    MessageChannel.event.emit('registry');
    
    const interval = async (time) => {
      setTimeout(async () => {
        await this.refreshList()
        interval(time)
      }, time)
    }

    this.status = 'started';
    interval(time)
  }

  /* open a process list window */
  openProcessManager(env = 'prod') {
    app.whenReady().then(async() => {
      this.processWindow = new BrowserWindow({
        show: false,
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
        this.setRefreshListTimer();
      });
      
      this.processWindow.loadURL(loadingUrl);
    });
  }

}


global.processManager = global.processManager || new ProcessManager();

module.exports = global.processManager;