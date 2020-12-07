/**
  * ProcessHost [process tasks-management center]
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
        process.send({ action, error, result: error || {}, id });
      });
    } else {
      process.send({
        action,
        error: new Error(`ProcessHost: processor for action-[${action}] is not found!`),
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


global.processHost = global.processHost || new ProcessHost()

module.exports = global.processHost;