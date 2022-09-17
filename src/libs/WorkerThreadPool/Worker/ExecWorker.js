const path = require('path');
const { Worker } = require('worker_threads');

class ExecWorker {
  constructor(execPath, context={}) {
    if (!execPath) {
      throw new Error('ExecWorker: execPath is required');
    }
    this.execPath = execPath;
    this.run(execPath);
  }

  run() {
    this.worker = new Worker(path.join(__dirname, 'exec-worker-runner.js'), {
      workerData: {
        execPath: this.execPath,
      },
    });
    this.worker.on('message', (...args) => {
      this.emit('response', ...args);
    });
    this.worker.on('error', (err) => {
      this.emit('error', err);
    });
    this.worker.on('exit', (exitCode) => {
      this.emit('exit', exitCode);
    });
  }
}

module.exports = ExecWorker;