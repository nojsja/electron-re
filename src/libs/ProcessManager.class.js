const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const pidusage = require('pidusage');

const conf = require('../conf/global.json');

class ProcessManager {
  constructor() {
    this.pidList = [process.pid];
    this.pid = null;
    this.typeMap = {
      [process.pid]: {
        type: 'main',
        url: ''
      },
    };
    this.status = 'pending';
    this.processWindow = null;
    this.time = 1e3;
    this.callSymbol = false;
    this.logs = []
  }

  /* -------------- internal -------------- */

  /* ipc listener  */
  ipcSignalsRecorder = (params, e) => {
    this.processWindow.sendToWeb('process:catch-signal', params);
  }

  /* refresh process list */
  refreshProcessList = () => {
    return new Promise((resolve, reject) => {
      if (this.pidList.length) {
        pidusage(this.pidList, (err, records) => {
          if (err) {
            console.log(`ProcessManager: refreshList -> ${err}`);
          } else {
            this.processWindow.sendToWeb('process:update-list', { records, types: this.typeMap })
          }
          resolve();
        });
      } else {
        resolve([]);
      }
    });
  }
  
  /* set timer to refresh */
  startTimer() {
    if (this.status === 'started') return console.warn('ProcessManager: the timer is already started!');

    const interval = async () => {
      setTimeout(async () => {
        await this.refreshProcessList()
        interval(this.time)
      }, this.time)
    }

    this.status = 'started';
    interval()
  }

  /* -------------- function -------------- */

  /* send stdout to ui-processor */
  stdout(pid, data) {
    if (this.processWindow) {
      if (!this.callSymbol) {
        this.callSymbol = true;
        setTimeout(() => {
          this.processWindow.sendToWeb('process:stdout', this.logs)

          this.logs = [];
          this.callSymbol = false;
        }, this.time);
      } else {
        this.logs.push({ pid: pid, data: String.prototype.trim.call(data) });
      }
    }
  }

  /* pipe to process.stdout */
  pipe(pinstance) {
    if (pinstance.stdout) {
      pinstance.stdout.on(
        'data',
        (trunk) => {
          this.stdout(pinstance.pid, trunk);
        }
      );
    }
  }

  /* listen processes with pids */
  listen(pids, mark="renderer", url="") {
    pids = (pids instanceof Array) ? pids : [pids];
    pids.forEach((pid) => {
      if (!this.pidList.includes(pid)) {
        this.pidList.push(pid);
      }
      this.typeMap[pid] = this.typeMap[pid] || {};
      this.typeMap[pid].type = mark;
      this.typeMap[pid].url = url;
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

  /* -------------- ui -------------- */

  /* open a process list window */
  openWindow(env = 'prod') {
    app.whenReady().then(() => {

      this.processWindow = Object.assign(
        new BrowserWindow({
          show: false,
          width: 600,
          height: 400,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
          },
        }),
        {
          sendToWeb: (action, data) => {
            if (!this.processWindow.isDestroyed())
              this.processWindow.webContents.send(action, data);
        }
      });

      const loadingUrl = (env === 'dev') ?
        url.format({
          pathname: conf.uiDevServer,
          protocol: 'http:',
          slashes: true,
        }) :
        url.format({
          pathname: path.join(__dirname, '../ui/index.html'),
          protocol: 'file:',
          slashes: true,
        });
  
      this.processWindow.once('ready-to-show', () => {
        this.processWindow.show();
        this.pid = this.processWindow.webContents.getOSProcessId();
        this.startTimer(conf.uiRefreshInterval);
        ipcMain.on('process:kill-process', (event, args) => this.killProcess(args))
        ipcMain.on('process:open-devtools', (event, args) => this.openDevTools(args))
        ipcMain.on('process:catch-signal', (event, args) => this.ipcSignalsRecorder(args || event))
      });
      
      this.processWindow.loadURL(loadingUrl);
    });
  }

}

if (!('electronre:$processManager' in global)) {
  Object.defineProperty(global, "electronre:$processManager", {
    value: new ProcessManager(),
    writable: false,
    configurable: false,
    enumerable: true
  });
}

module.exports = global['electronre:$processManager'];