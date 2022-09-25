const path = require('path');

const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const {
  StaticThreadPool,
  DynamicThreadPool,
} = require(`../${base}`);

const staticWorkerThreadPool = () => {
  const CONF_MAX_THREADS = 10;
  const CONF_MAX_TASKS = 10;
  const CONF_TASK_RETRY = 0;

  const threadPool = new StaticThreadPool(
    {
      execPath: path.join(__dirname, './worker_threads/worker-static.js'),
      lazyLoad: true,
      maxThreads: CONF_MAX_THREADS,
      maxTasks: CONF_MAX_TASKS,
      taskRetry: CONF_TASK_RETRY,
      taskTime: 1e3,
    }
  );

  describe('▹ Static Worker Thread Pool Test', () => {
    it('run a task with pool and get correct result', (callback) => {
      threadPool.exec(15).then((res) => {
        if ((+(res.data) === 610) && (threadPool.threadLength === 1)) {
          callback();
        } else {
          callback('test1 failed!');
        }
      }).catch((err) => {
        callback(err.toString());
      });
    });

    it('fill pool with idle threads', (callback) => {
      threadPool.fillPoolWithIdleThreads();
      if (threadPool.threadLength === CONF_MAX_THREADS) {
        callback();
      } else {
        callback('test2 failed!');
      }
    });

    it('put tasks into queue when no idle thread', (callback) => {
      Promise
        .all(
          new Array(11).fill(0).map(() => threadPool.exec(15))
        )
        .then((results) => {
          const isAllTaskSuccess = results.every((res) => +(res.data) === 610);
          if (isAllTaskSuccess) {
            callback();
          } else {
            callback('test3 failed!');
          }
        })
        .catch((err) => {
          callback(err.toString());
        });

      if (threadPool.threadLength !== CONF_MAX_THREADS || threadPool.taskLength !== 1) {
        callback('test3 failed!');
      }
    });

    it('fill pool and queue with tasks', (callback) => {
      new Array(CONF_MAX_TASKS + CONF_MAX_THREADS + 10).fill(0).forEach(() => {
        threadPool.exec(15);
      });
      if (threadPool.isFull && threadPool.taskQueue.isFull) {
        callback();
      } else {
        callback('test4 failed!');
      }
    });

    it('invoke setMaxThreads() method and get corrent thread count', (callback) => {
      threadPool.wipeThreadPool();
      threadPool.setMaxThreads(5);
      threadPool.fillPoolWithIdleThreads();
      if (threadPool.threadLength === 5) {
        callback();
      } else {
        callback('test5 failed!');
      }
    });

    it('invoke setMaxTasks() method and get correct task count', (callback) => {
      threadPool.wipeTaskQueue();
      threadPool.setMaxTasks(5);
      new Array(11).fill(0).forEach(() => {
        threadPool.exec(2);
      });
      if (threadPool.taskLength === 5) {
        callback();
      } else {
        callback('test6 failed!');
      }
    });
  });

};

const dynamicWorkerThreadPool = () => {
  const CONF_MAX_THREADS = 10;
  const CONF_MAX_TASKS = 10;
  const CONF_TASK_RETRY = 0;
  const execString = `
    const fibonaccis = (n) => {
      if (n < 2) {
        return n;
      }
      return fibonaccis(n - 1) + fibonaccis(n - 2);
    }

    module.exports = (value) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          return resolve(fibonaccis(value));
        }, .5e3);
      });
    }
  `;

  const threadPool = new DynamicThreadPool(
    {
      lazyLoad: true,
      maxThreads: CONF_MAX_THREADS,
      maxTasks: CONF_MAX_TASKS,
      taskRetry: CONF_TASK_RETRY,
      taskTime: 1e3,
    }
  );

  const executor = threadPool.createExecutor({ execString: `module.exports = (value) => 'excutor:'+value` });

  describe('▹ Dynamic Worker Thread Pool Test', () => {
    it('run a task with pool and get correct result', (callback) => {
      threadPool.exec('test', {
        execString: `module.exports = (value) => {
          return 'dynamic:' + value;
        };`,
      }).then((res) => {
        if ((res.data === 'dynamic:test') && (threadPool.threadLength === 1)) {
          callback();
        } else {
          callback('test1 failed!');
        }
      }).catch((err) => {
        callback(err.toString());
      });
    });

    it('run a task with pool and get correct result', (callback) => {
      threadPool.exec(15, {
        execString,
      }).then((res) => {
        if ((+(res.data) === 610) && (threadPool.threadLength === 2)) {
          callback();
        } else {
          callback('test2 failed!');
        }
      }).catch((err) => {
        callback(err.toString());
      });
    });

    it('run a dynamic task (exec) with pool and get correct result', (callback) => {
      threadPool
        .exec('test', {
          execPath: path.join(__dirname, './worker_threads/worker-dynamic.js')
        })
        .then((value) => {
          if (value.data === 'dynamic:test') {
            callback();
          } else {
            callback('test3 failed!');
          }
        })
        .catch((err) => {
          callback(err.toString());
        });
    });

    it('run a dynamic task (eval) with pool and get correct result', (callback) => {
      threadPool
        .exec('test', {
          execString: "module.exports = (value) => { return `dynamic:${value}`; };"
        })
        .then((value) => {
          if (value.data === 'dynamic:test') {
            callback();
          } else {
            callback('test4 failed!');
          }
        })
        .catch((err) => {
          callback(err.toString());
        });
    });

    it('run a task with DynamicExecutor instance and get correct result', (callback) => {
      executor.exec('test').then((res) => {
        if (res.data === 'excutor:test') {
          callback();
        } else {
          callback('test7 failed!');
        }
      })
      .catch((err) => {
        callback(err.toString());
      });
    });

    it('run a task with DynamicExecutor instance and get correct result', (callback) => {
      executor
        .setExecFunction((value) => {
          return `excutor:${value}`;
        })
        .exec('test2')
        .then((res) => {
          if (res.data === 'excutor:test2') {
            callback();
          } else {
            callback('test8 failed!');
          }
        })
        .catch((err) => {
          callback(err.toString());
        });
    });

    it('run a task with DynamicExecutor instance and get correct result', (callback) => {
      executor
        .setExecPath(path.join(__dirname, './worker_threads/worker-static.js'))
        .exec(15)
        .then((res) => {
          if (+(res.data) === 610) {
            callback();
          } else {
            callback('test8 failed!');
          }
        })
        .catch((err) => {
          callback(err.toString());
        });
    });

    it('run a task with DynamicExecutor instance and execute timeout', (callback) => {
      executor
        .setExecPath(path.join(__dirname, './worker_threads/worker-static.js'))
        .setTaskTimeout(2e3)
        .exec(100)
        .then(() => {
          callback('test9 failed!');
        })
        .catch((err) => {
          callback();
        });
    });

  });
};

module.exports = () => {
  describe('▸ Worker Thread Pool Test', () => {
    staticWorkerThreadPool();
    dynamicWorkerThreadPool();
  });
};