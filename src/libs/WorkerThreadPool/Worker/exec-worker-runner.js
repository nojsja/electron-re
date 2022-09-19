const { parentPort, workerData } = require('worker_threads');

const { CODE } = require('../consts');

const { execPath } = workerData;
const mainRunner = require(execPath);

parentPort.on('message', (task) => {
  Promise.resolve(mainRunner(task.payload))
    .then((data) => {
      parentPort.postMessage({
        code: CODE.SUCCESS,
        data,
        error: null,
        taskId: task.taskId,
      });
    })
    .catch((error) => {
      parentPort.postMessage({
        code: CODE.FAILED,
        data: null,
        error,
        taskId: task.taskId,
      });
    });
});
