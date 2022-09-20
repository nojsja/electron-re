const { parentPort, workerData } = require('worker_threads');

const { CODE, TASK_TYPE } = require('../consts');
const { evalModuleCode } = require('./utils');

const { execPath } = workerData;
const mainRunner = require(execPath);

parentPort.on('message', (task) => {
  let currentRunner;

  if (task.taskType === TASK_TYPE.DYNAMIC) {
    currentRunner = task.execPath ? require(task.execPath) : evalModuleCode('.', task.execString);
  } else {
    currentRunner = mainRunner;
  }

  Promise.resolve(currentRunner(task.payload))
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
