const { fork } = require('child_process');

class ForkedProcess {
  constructor(host, forkedPath, args=[], options={}) {
    this.host = host;
    this.forkedPath = forkedPath;
    this.args = args;
    this.options = options;
    this.sleeping = false;

    this.child = fork(
      this.forkedPath,
      this.args,
      this.options
    );

    this.pid = this.child.pid;
    this.init();
  }

  /* send STOP signal to a child process and let it freeze */
  sleep() {
    if (this.sleeping) return;
    process.kill(this.pid, 'SIGSTOP');
    this.sleeping = true;
  }

  /* send CONT signal to wake up a child process */
  wakeup() {
    if (!this.sleeping) return;
    process.kill(this.pid, 'SIGCONT');
    this.sleeping = false;
  }

  init() {
    this.child.on('message', (data) => {
      const id = data.id;
      delete data.id;
      delete data.action;
      this.host.emit('forked_message', {data, id});
    });
    this.child.on('exit', (code, signal) => {
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
    if (this.sleeping) {
      this.wakeup();
    }
    this.child.send(...params);
  }
}

module.exports = ForkedProcess;