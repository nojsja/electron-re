const { EventEmitter } = require('events');

class EventCenter extends EventEmitter {
  constructor() {
    super();
  }
}


if (!('electronre:$globalEvent' in global)) {
  Object.defineProperty(
    global,
    "electronre:$globalEvent", {
      value: new EventCenter(),
      writable: false,
      configurable: false,
      enumerable: true
  });
}

module.exports = global['electronre:$globalEvent'];