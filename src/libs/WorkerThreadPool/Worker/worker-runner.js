const {
  parentPort, workerData
} = require('worker_threads');
const { CODE, TASK_TYPE } = require('../consts');
const { evalModuleCode } = require('../utils');

const { code, execPath } = workerData;
let mainRunner;

function errorRunner(err) {
  throw new Error(`EvalWorkerError: ${err}`);
}

try {
  if (code) {
    mainRunner = evalModuleCode('.', code);
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

  if (task.taskType === TASK_TYPE.DYNAMIC) {
    try {
      currentRunner = task.execPath ? require(task.execPath) : evalModuleCode('.', task.execString);
    } catch (error) {
      currentRunner = () => errorRunner(error);
    }
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
      parentPort.postMessage({ code: CODE.FAILED, data: null, error, taskId: task.taskId });
    });
});
