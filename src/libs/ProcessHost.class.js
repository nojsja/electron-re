/**
  * ProcessHost [process tasks center]
  * @author nojsja
  */
class ProcessHost {
  constructor() {
    this.tasks = { };

    this.handleEvents();
    process.on('message', this.handleMessage.bind(this));
  }

  /* events listener */
  handleEvents() {
    process.on('disconnect', () => {
      console.log(`ProcessHost: a child process disconnected: ${process.pid} !`);
    });
    process.on('exit', () => {
      console.log(`ProcessHost: a child process exited: ${process.pid} !`);
    });
  }

  /* received message */
  handleMessage({ action, params, id }) {
    if (this.tasks[action]) {
      this.tasks[action](params)
      .then(rsp => {
        process.send({ action, error: null, result: rsp || {}, id });
      })
      .catch(error => {
        process.send({ action, error, result: String(error) || {}, id });
      });
    } else {
      process.send({
        action,
        error: `ProcessHost: processor for action-[${action}] is not found!`,
        result: null,
        id,
      });
    }
  }

  /* registry a task */
  registry(taskName, processor) {
    if (this.tasks[taskName]) console.warn(`ProcesHost: the task-${taskName} is registered!`);
    if (typeof processor !== 'function') throw new Error('ProcessHost: the processor must be a function!');
    this.tasks[taskName] = function(params) {
      return new Promise((resolve, reject) => {
        Promise.resolve(processor(params))
          .then(rsp => {
            resolve(rsp);
          })
          .catch(error => {
            reject(error);
          });
      })
    }

    return this;
  };

  /* unregistry a task */
  unregistry(taskName) {
    if (!this.tasks[taskName]) console.warn(`ProcesHost: the task-${taskName} is not registered!`);
    delete this.tasks[taskName];

    return this;
  };

  /* disconnect */
  disconnect() {
    process.disconnect();
  }

  /* exit */
  exit() {
    process.exit();
  }
}

if (!('electronre:$processHost' in global)) {
  Object.defineProperty(global, "electronre:$processHost", {
    value: new ProcessHost(),
    writable: false,
    configurable: false,
    enumerable: true
  });
}

module.exports = global['electronre:$processHost'];
