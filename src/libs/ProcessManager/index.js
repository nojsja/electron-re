const { BrowserWindow } = require('electron');
const { EventEmitter } = require('stream');
const pidusage = require('pidusage');

const {
  KILL_SIGNAL,
  OPEN_DEVTOOLS_SIGNAL,
  CATCH_SIGNAL,
  LOG_SIGNAL,
  UPDATE_SIGNAL,
  START_TIMER_SIGNAL,
} = require('../consts');
const ProcessManagerUI = require('./ui');

class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.window = new ProcessManagerUI(this);
    this.pidList = [process.pid];
    this.pid = null;
    this.typeMap = {
      [process.pid]: {
        type: 'main',
        url: ''
      },
    };
    this.status = 'pending';
    this.time = 1e3;
    this.callSymbol = false;
    this.logs = [];
    this.pidMap = {};
    this.initTemplate();
  }

  /* -------------- internal -------------- */

  /* template */

  initTemplate = () => {
    this.on(KILL_SIGNAL, (event, ...args) => this.killProcess(...args));
    this.on(OPEN_DEVTOOLS_SIGNAL, (event, ...args) => this.openDevTools(...args));
    this.on(CATCH_SIGNAL, (event, ...args) => this.ipcSignalsRecorder(...args));
    this.on(START_TIMER_SIGNAL, (event, ...args) => this.startTimer(...args));
  }

  /* ipc listener  */
  ipcSignalsRecorder = (params, e) => {
    this.window.sendToWeb(CATCH_SIGNAL, params);
  }

  /* refresh process list */
  refreshProcessList = () => {
    return new Promise((resolve, reject) => {
      if (this.pidList.length) {
        pidusage(this.pidList, (err, records) => {
          if (err) {
            console.log(`ProcessManager: refreshList -> ${err}`);
          } else {
            this.pidMap = Object.assign(this.pidMap, records);
            this.window.sendToWeb(UPDATE_SIGNAL, { records, types: this.typeMap })
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
    if (this.window) {
      if (!this.callSymbol) {
        this.callSymbol = true;
        setTimeout(() => {
          this.window.sendToWeb(LOG_SIGNAL, this.logs)
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
        win.webContents.openDevTools({ mode: 'undocked' });
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
  setIntervalTime = (time) => {
    time = Number(time);
    if (isNaN(time)) throw new Error('ProcessManager: the time value is invalid!')
    if (time < 100) console.warn(`ProcessManager: the refresh interval is too small!`);

    this.time = time;
  }

  /* -------------- ui -------------- */

  /* open a process list window */
  openWindow = (env = 'prod') => {
    this.window.open(env);
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