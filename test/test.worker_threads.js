const path = require('path');

const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const {
  WorkerThreadPool,
  THREAD_TYPE,
} = require(`../${base}`);

const workerThreadPool = () => {
  const CONF_MAX_THREADS = 10;
  const CONF_MAX_TASKS = 10;
  const CONF_TASK_RETRY = 0;
  const CONF_THREAD_TYPE = THREAD_TYPE.EXEC;

  const threadPool = new WorkerThreadPool(
    path.join(__dirname, './worker_threads/worker-static.js'),
    {
      lazyLoad: true,
      maxThreads: CONF_MAX_THREADS,
      maxTasks: CONF_MAX_TASKS,
      taskRetry: CONF_TASK_RETRY,
      taskTime: 1e3,
      type: CONF_THREAD_TYPE,
    }
  );

  describe('▸ Worker Thread Pool Test', () => {
    it('run a task with pool and get correct result', (callback) => {
      threadPool.send(15).then((res) => {
        if ((+(res.data) === 610) && (threadPool.threadLength === 1)) {
          callback();
        } else {
          callback('test1 failed!');
        }
      }).catch(() => {
        callback('test1 failed!');
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
          new Array(11).fill(0).map(() => threadPool.send(15))
        )
        .then((results) => {
          const isAllTaskSuccess = results.every((res) => +(res.data) === 610);
          if (isAllTaskSuccess) {
            callback();
          } else {
            callback('test3 failed!');
          }
        })
        .catch(() => {
          callback('test3 failed!');
        });

      if (threadPool.threadLength !== CONF_MAX_THREADS || threadPool.taskLength !== 1) {
        callback('test3 failed!');
      }
    });

    it('run a dynamic task (exec) with pool and get correct result', (callback) => {
      threadPool
        .send('test', {
          execPath: path.join(__dirname, './worker_threads/worker-dynamic.js')
        })
        .then((value) => {
          if (value.data === 'dynamic:test') {
            callback();
          } else {
            callback('test4 failed!');
          }
        })
        .catch(() => {
          callback('test4 failed!');
        });
    });

    it('run a dynamic task (eval) with pool and get correct result', (callback) => {
      threadPool
        .send('test', {
          execString: "module.exports = (value) => { return `dynamic:${value}`; };"
        })
        .then((value) => {
          if (value.data === 'dynamic:test') {
            callback();
          } else {
            callback('test4 failed!');
          }
        })
        .catch(() => {
          callback('test4 failed!');
        });
    });

    it('fill pool and queue with tasks', (callback) => {
      new Array(CONF_MAX_TASKS + CONF_MAX_THREADS + 10).fill(0).forEach(() => {
        threadPool.send(15);
      });
      if (threadPool.isFull && threadPool.taskQueue.isFull) {
        callback();
      } else {
        callback('test5 failed!');
      }
    });

    it('invoke setMaxThreads() method and get corrent thread count', (callback) => {
      threadPool.wipeThreadPool();
      threadPool.setMaxThreads(5);
      threadPool.fillPoolWithIdleThreads();
      if (threadPool.threadLength === 5) {
        callback();
      } else {
        callback('test6 failed!');
      }
    });

    it('invoke setMaxTasks() method and get correct task count', (callback) => {
      threadPool.wipeTaskQueue();
      threadPool.setMaxTasks(5);
      new Array(11).fill(0).forEach(() => {
        threadPool.send(2);
      });
      if (threadPool.taskLength === 5) {
        callback();
      } else {
        callback('test7 failed!');
      }
    });
  });

};

module.exports = () => {
  workerThreadPool();
};