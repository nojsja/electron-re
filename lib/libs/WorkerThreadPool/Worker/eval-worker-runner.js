"use strict";

var _require = require('worker_threads'),
    parentPort = _require.parentPort,
    workerData = _require.workerData;

var _require2 = require('../consts'),
    CODE = _require2.CODE;

var _require3 = require('../utils'),
    evalModuleCode = _require3.evalModuleCode;

var code = workerData.code;
var mainRunner;

function errorRunner(err) {
  throw new Error("EvalWorkerError: ".concat(err));
}

try {
  mainRunner = evalModuleCode('.', code);
} catch (error) {
  mainRunner = function mainRunner() {
    return errorRunner(error);
  };
}

parentPort.on('message', function (task) {
  var currentRunner;

  if (task.taskType === TASK_TYPE.DYNAMIC) {
    try {
      currentRunner = task.execPath ? require(task.execPath) : evalModuleCode('.', task.execString);
    } catch (error) {
      currentRunner = function currentRunner() {
        return errorRunner(error);
      };
    }
  } else {
    currentRunner = mainRunner;
  }

  Promise.resolve(currentRunner(task.payload)).then(function (data) {
    parentPort.postMessage({
      code: CODE.SUCCESS,
      data: data,
      error: null,
      taskId: task.taskId
    });
  })["catch"](function (error) {
    parentPort.postMessage({
      code: CODE.FAILED,
      data: null,
      error: error,
      taskId: task.taskId
    });
  });
});