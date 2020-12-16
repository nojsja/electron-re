const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const pidusage = require('pidusage');

class ProcessManager {
  constructor() {
    this.pidList = [process.pid];
    this.typeMap = {
      [process.pid]: 'main',
    };
    this.status = 'pending';
    this.processWindow = null;
    this.time = 2e3;
  }

  /* -------------- internal -------------- */

  /* refresh process list */
  refreshList = () => {
    return new Promise((resolve, reject) => {
      if (this.pidList.length) {
        pidusage(this.pidList, (err, records) => {
          if (err) {
            console.log(`ProcessManager: refreshList -> ${err}`);
          } else {
            this.processWindow.webContents.send('process:update-list', { records, types: this.typeMap });
          }
          resolve();
        });
      } else {
        resolve([]);
      }
    });
  }
  
  /* set timer to refresh */
  setTimer() {
    if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

    const interval = async () => {
      setTimeout(async () => {
        await this.refreshList()
        interval(this.time)
      }, this.time)
    }

    this.status = 'started';
    interval()
  }

  /* -------------- function -------------- */

  /* pipe to process.stdout */
  pipe(pinstance) {
    if (pinstance.stdout) {
      pinstance.stdout.on(
        'data',
        (trunk) => {
          (this.processWindow) &&
          this.processWindow.webContents.send('process:stdout', {
            pid: pinstance.pid,  data: String.prototype.trim.call(trunk)
          });
        }
      );
    }
  }

  /* listen processes with pids */
  listen(pids, mark="renderer") {
    pids = (pids instanceof Array) ? pids : [pids];
    pids.forEach((pid) => {
      if (!this.pidList.includes(pid)) {
        this.pidList.push(pid);
      }
      this.typeMap[pid] = mark;
    });
  }

  /* unlisten processes with pids */
  unlisten(pids) {
    pids = (pids instanceof Array) ? pids : [pids];
    this.pidList = this.pidList.filter(pid => !pids.includes(pid));
  }

  /* openDevTools */
  openDevTools = (pid) => {
    BrowserWindow.getAllWindows().forEach(win => {
      if (win.webContents.getOSProcessId() === Number(pid)) {
        win.webContents.openDevTools({mode: 'undocked'});
      }
    });
  }

  /* kill */
  killProcess = (pid) => {
    try {
      process.kill(pid);
    } catch (error) {
      console.error(`ProcessManager: killProcess -> ${pid} error: ${error}`);
    }
  }

  /**
    * setIntervalTime [set interval (ms)]
    * @param  {[Number]} time [a positive number to set the refresh interval]
    */
  setIntervalTime(time) {
    time = Number(time);
    if (isNaN(time)) throw new Error('ProcessManager: the time value is invalid!')
    if (time < 100) console.warn(`ProcessManager: the refresh interval is too small!`);

    this.time = time;
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

      const loadingUrl = (env === 'dev') ?
        url.format({
          pathname: '127.0.0.1:3000',
          protocol: 'http:',
          slashes: true,
        }) :
        url.format({
          pathname: path.join(__dirname, '../../lib/ui/index.html'),
          protocol: 'file:',
          slashes: true,
        });
  
      this.processWindow.once('ready-to-show', () => {
        this.processWindow.show();
        this.setTimer(2e3);
        ipcMain.on('process:kill-process', (event, args) => this.killProcess(args))
        ipcMain.on('process:open-devtools', (event, args) => this.openDevTools(args))
      });
      
      this.processWindow.loadURL(loadingUrl);
    });
  }

}

global.processManager = global.processManager || new ProcessManager();

module.exports = global.processManager;