const path = require('path');
const { Worker } = require('worker_threads');
const EventEmitter = require('events');

class EvalWorker extends EventEmitter {
  constructor(code, context={}) {
    if (!code) {
      throw new Error('EvalWorker: code is required');
    }
    this.code = code;
    this.context = context;
    this.worker = null;
    this.run();
  }

  run() {
    this.worker = new Worker(
      path.join(__dirname, 'eval-worker-runner.js'), {
        workerData: {
          code: this.code,
          context: this.context,
        },
      },
    );
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

module.exports = EvalWorker;