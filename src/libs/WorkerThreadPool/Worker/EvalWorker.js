const path = require('path');
const { Worker } = require('worker_threads');

const WorkerClass = require('./Worker');

class EvalWorker extends WorkerClass {
  constructor(code, context={}) {
    if (!code) {
      throw new Error('EvalWorker: code is required');
    }
    super();
    this.code = code;
    this.context = context;
    this.runner = null;
    this.threadId = null;
    this.init();
  }

  init() {
    this.runner = new Worker(
      path.join(__dirname, 'eval-worker-runner.js'), {
        workerData: {
          code: this.code,
          context: this.context,
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
}

module.exports = EvalWorker;