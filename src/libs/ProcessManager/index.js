const { BrowserWindow, app } = require('electron');
const { EventEmitter } = require('stream');
const pidusage = require('pidusage');

const {
  KILL_SIGNAL,
  OPEN_DEVTOOLS_SIGNAL,
  CATCH_SIGNAL,
  LOG_SIGNAL,
  UPDATE_SIGNAL,
  START_TIMER_SIGNAL,
  UPDATE_CONNECTIONS_SIGNAL
} = require('../consts');
const ProcessManagerUI = require('./ui');
const EventCenter = require('../EventCenter.class');

class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.ui = null;
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
    this.initAppListeners();
  }

  /* -------------- internal -------------- */

  initTemplate = () => {
    EventCenter.on(`process-manager:${START_TIMER_SIGNAL}`, (...args) => this.startTimer(...args));
    EventCenter.on(`process-manager:${CATCH_SIGNAL}`, (...args) => this.ipcSignalsRecorder(...args));
    EventCenter.on(`process-manager:${OPEN_DEVTOOLS_SIGNAL}`, (...args) => this.openDevTools(...args));
    EventCenter.on(`process-manager:${KILL_SIGNAL}`, (...args) => this.killProcess(...args));
    EventCenter.on('process-manager:pipe', (child) => {
      this.pipe(child);
    });
    EventCenter.on('process-manager:listen', (...args) => {
      this.listen(...args);
    });
    EventCenter.on('process-manager:unlisten', (...args) => {
      this.unlisten(...args);
    });
    EventCenter.on(`process-manager:${UPDATE_CONNECTIONS_SIGNAL}`, (...args) => this.updateConnections(...args));
  }

  initAppListeners = () => {
    /* new renderer-window listen */
    app.on('web-contents-created', (event, webContents) => {
      webContents.once('did-finish-load', () => {
        const pid = webContents.getOSProcessId();

        if (!Number.isInteger(pid)) {
          return console.warn(`ProcessManager: ${pid} is not a valid pid numbere`);
        }
        // ignore processManager window
        if (this.ui && this.ui.webContents && this.ui.webContents.getOSProcessId() === pid) return;
        this.listen(pid, 'renderer', webContents.getURL());
        // window-console listen
        webContents.on('console-message', (e, level, msg, line, sourceid) => {
          this.stdout(pid, msg);
        });
        webContents.once('closed', function(e) {
          this.unlisten(this.pid);
        }.bind({ pid }));
      });
    });
  }

  /* ipc listener  */
  ipcSignalsRecorder = (params, e) => {
    this.ui && this.ui.sendToWeb(CATCH_SIGNAL, params);
  }

  /* updata connections */
  updateConnections = (connectionsMap) => {
    if (connectionsMap){
      Object.entries(connectionsMap).forEach(([pid, count]) => {
        if (pid in this.pidMap) {
          this.pidMap[pid].connections = count;
        }
      });
    }
  }

  /* refresh process list */
  refreshProcessList = () => {
    return new Promise((resolve, reject) => {
      if (this.pidList.length) {
        pidusage(this.pidList, (err, records) => {
          if (err) {
            console.log(`ProcessManager: refreshList errored -> ${err}`);
          } else {
            Object.keys(records).forEach((pid) => {
              this.pidMap[pid] =  Object.assign(this.pidMap[pid] || {}, records[pid]);
            });
            EventCenter.emit('process-manager:refresh', this.pidMap);
            this.ui && this.ui.sendToWeb(UPDATE_SIGNAL, { records, types: this.typeMap })
          }
          resolve();
        });
      } else {
        resolve([]);
      }
    });
  }

  /* set timer to refresh */
  startTimer = () => {
    if (this.status === 'started')
      return console.warn('ProcessManager: the timer is already started!');

    const interval = async () => {
      setTimeout(async () => {
        await this.refreshProcessList()
        if (this.status === 'stoped') return;
        interval(this.time)
      }, this.time)
    }

    this.status = 'started';
    interval()
  }

  /* stop timer */
  stopTimer = () => {
    if (this.status === 'stoped')
      return console.warn('ProcessManager: the timer is already stoped!');

    console.warn('ProcessManager: the pidusage worker is stopping, ChildProcessPool load-balance may be affected!');
    this.status = 'stoped';
  }

  /* -------------- function -------------- */

  /* send stdout to ui-processor */
  stdout = (pid, data) => {
    if (!this.ui) return;
    if (!this.callSymbol) {
      this.callSymbol = true;
      setTimeout(() => {
        this.ui && this.ui.sendToWeb(LOG_SIGNAL, this.logs)
        this.logs = [];
        this.callSymbol = false;
      }, this.time);
    } else {
      this.logs.push({ pid: pid, data: String.prototype.trim.call(data) });
    }
  }

  /* pipe to process.stdout */
  pipe = (pinstance) => {
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
  listen = (pids, mark="renderer", url="") => {
    pids = (pids instanceof Array) ? pids : [pids];
    pids
      .filter((pid) => Number.isInteger(pid))
      .forEach((pid) => {
        if (!this.pidList.includes(pid)) {
          this.pidList.push(pid);
        }
        this.typeMap[pid] = this.typeMap[pid] || {};
        this.typeMap[pid].type = mark;
        this.typeMap[pid].url = url;
      });
  }

  /* unlisten processes with pids */
  unlisten = (pids) => {
    pids = (pids instanceof Array) ? pids : [pids];
    this.pidList = this.pidList.filter(pid => !pids.includes(pid));
  }

  /* openDevTools */
  openDevTools = (pid) => {
    const win = (BrowserWindow.getAllWindows() || []).find((win) => {
      return win.webContents.getOSProcessId() === Number(pid);
    });
    win && win.webContents.openDevTools({ mode: 'undocked' });
  }

  /* kill */
  killProcess = (pid) => {
    try {
      process.kill(pid);
    } catch (error) {
      console.error(`ProcessManager: killProcess -> ${pid} errored: ${error}`);
    }
  }

  /**
    * setIntervalTime [set interval (ms)]
    * @param  {[Number]} time [a positive number to set the refresh interval]
    */
  setIntervalTime = (time) => {
    time = Number(time);
    if (isNaN(time))
      throw new Error('ProcessManager: the time value is invalid!')
    if (time < 100)
      console.warn(`ProcessManager: the refresh interval is too small!`);

    this.time = time;
  }

  /* -------------- ui -------------- */

  /* open a process list window */
  openWindow = async (env = 'prod') => {
    if (!this.ui) {
      this.ui = new ProcessManagerUI(this);
      await this.ui.open(env);
    } else {
      this.ui.show();
    }
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