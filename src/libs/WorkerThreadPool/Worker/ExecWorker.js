const path = require('path');
const { Worker } = require('worker_threads');

const WorkerClass = require('./Worker');

class ExecWorker extends WorkerClass {
  constructor(execPath) {
    if (!execPath) {
      throw new Error('ExecWorker: execPath is required');
    }
    super();
    this.execPath = execPath;
    this.runner = null;
    this.init();
  }

  init() {
    this.runner = new Worker(path.join(__dirname, 'exec-worker-runner.js'), {
      workerData: {
        execPath: this.execPath,
      },
    });
    this.threadId = this.runner.threadId;
    this.runner.on('message', (info) => {
      this.emit('response', info);
    });
    this.runner.on('error', (err) => {
      this.emit('error', err);
    });
    this.runner.on('exit', (exitCode) => {
      this.emit('exit', exitCode);
    });
  }
}

module.exports = ExecWorker;