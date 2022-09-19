const EventEmitter = require('events');

class Worker extends EventEmitter {
  constructor() {
    super();
    this.runner = null;
  }

  postMessage(...messages) {
    this.runner.postMessage(...messages);
  }
}

module.exports = Worker;