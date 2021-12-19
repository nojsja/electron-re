const { fork } = require('child_process');

class ForkedProcess {
  constructor(host, forkedPath, args=[], options={}) {
    this.host = host;
    this.forkedPath = forkedPath;
    this.args = args;
    this.options = options;

    this.child = fork(
      this.forkedPath,
      this.args,
      this.options
    );

    this.pid = this.child.pid;
    this.init();
  }

  init() {
    this.child.on('message', (data) => {
      const id = data.id;
      delete data.id;
      delete data.action;
      this.host.emit('forked_message', {data, id});
    });
    this.child.on('exit', (code, signal) => {
      console.log('forked process exited with: ', code, signal);
      if (code !== 0 && code !== null) {
        this.host.emit('forked_error', this.pid);
      } else {
        this.host.emit('forked_exit', this.pid);
      }
    });
    this.child.on('error', (err) => {
      console.log('forked error: ', err);
      this.host.emit('forked_error', err, this.pid);
    });
  }

  send = (...params) => {
    this.child.send(...params);
  }
}

module.exports = ForkedProcess;