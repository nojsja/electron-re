const {
  parentPort, workerData
} = require('worker_threads');
const { CODE, TASK_TYPE } = require('../consts');
const { evalModuleCode } = require('../utils');

const { execString, execPath } = workerData;
let mainRunner;

function errorRunner(err) {
  if (err instanceof Error) {
    return Promise.reject(err);
  } else {
    return Promise.reject(new Error(`WorkerError: ${err}`));
  }
}

try {
  if (execString) {
    mainRunner = evalModuleCode('.', execString);
  }
  if (execPath) {
    mainRunner = require(execPath);
  }
  if (!mainRunner) {
    mainRunner = () => errorRunner(new Error('Worker: No execString or execPath provided'));
  }
} catch (error) {
  mainRunner = () => errorRunner(error);
}

parentPort.on('message', (task) => {
  let currentRunner;
  let currentValue;

  if (task.taskType === TASK_TYPE.DYNAMIC) {
    try {
      currentRunner = task.execPath ? require(task.execPath) : evalModuleCode('.', task.execString);
    } catch (error) {
      currentRunner = () => errorRunner(error);
    }
  } else {
    currentRunner = mainRunner;
  }

  try {
    currentValue = currentRunner(task.payload);
  } catch (error) {
    currentValue = Promise.reject(error);
  }

  Promise.resolve(currentValue)
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
