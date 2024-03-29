const EventEmitter = require('events');

const defaultLifecycle = {
  expect: 600e3, // default timeout 10 minutes
  internal: 30e3 // default loop check interval 30 seconds
};

class ProcessLifeCycle extends EventEmitter {
  constructor(options) {
    super();
    const {
      expect=defaultLifecycle.expect,
      internal=defaultLifecycle.internal
    } = options;
    this.timer = null;
    this.internal = internal;
    this.expect = expect;
    this.params = {
      activities: new Map()
    };
  }

  /* task check loop */
  taskLoop = () => {
    if (this.timer) return console.warn('ProcessLifeCycle: the task loop is already running');

    this.timer = setInterval(() => {
      const sleepTasks = [];
      const date = new Date();
      const { activities } = this.params;
      ([...activities.entries()]).map(([key, value]) => {
        if (date - value > this.expect) {
          sleepTasks.push(key);
        }
      });
      if (sleepTasks.length) {
        // this.unwatch(sleepTasks);
        this.emit('sleep', sleepTasks);
      }
    }, this.internal);
  }

  /* watch processes */
  watch = (ids=[]) => {
    ids.forEach(id => {
      this.params.activities.set(id, new Date());
    });
  }

  /* unwatch processes */
  unwatch = (ids=[]) => {
    ids.forEach(id => {
      this.params.activities.delete(id);
    });
  }

  /* stop task check loop */
  stop = () => {
    clearInterval(this.timer);
    this.timer = null;
  }

  /* start task check loop */
  start = () => {
    this.taskLoop();
  }

  /* refresh tasks */
  refresh = (ids=[]) => {
    ids.forEach(id => {
      if (this.params.activities.has(id)) {
        this.params.activities.set(id, new Date());
      } else {
        console.warn(`The task with id ${id} is not being watched.`);
      }
    });
  }
}

module.exports = Object.assign(ProcessLifeCycle, { defaultLifecycle });