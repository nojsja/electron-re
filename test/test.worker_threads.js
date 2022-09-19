const path = require('path');

const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const {
  WorkerThreadPool,
  THREAD_TYPE,
} = require(`../${base}`);

const workerThreadPool = () => {
  const threadPool = new WorkerThreadPool(
    path.join(__dirname, './worker_threads/worker1.js'),
    {
      lazyLoad: true,
      maxThreads: 10,
      maxTasks: 10,
      taskRetry: 0,
      taskTime: 1e3,
      type: THREAD_TYPE.EXEC,
    }
  );

  describe('▸ Worker Thread Pool Test', () => {
    it('run a task with pool and get correct result', (callback) => {
      threadPool.send(15).then((res) => {
        if (+(res.data) === 610) {
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
      if (threadPool.threadLength === 10) {
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

      if (threadPool.threadLength !== 10 || threadPool.taskLength !== 1) {
        callback('test3 failed!');
      }
    });
  });

};

module.exports = () => {
  workerThreadPool();
};