const path = require('path');
const EventEmitter = require('events');
const { Worker } = require('worker_threads');

class WorkerRunner extends EventEmitter {
  constructor(options={}) {
    super();
    this.execString = options.execString;
    this.execPath = options.execPath;
    this.runner = null;
    this.threadId = null;
    if (!this.execString && !this.execPath) {
      throw new Error('WorkerRunner: code or execPath is required.');
    }
    this.init(options);
  }

  init(options) {
    this.runner = new Worker(
      path.join(__dirname, 'worker-runner.js'), {
        ...options,
        workerData: {
          execString: this.execString,
          execPath: this.execPath,
        },
      },
    );
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

  postMessage(...messages) {
    this.runner.postMessage(...messages);
  }

  terminate() {
    return this.runner.terminate();
  }
}

module.exports = WorkerRunner;