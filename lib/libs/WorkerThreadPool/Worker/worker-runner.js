"use strict";

var _require = require('worker_threads'),
    parentPort = _require.parentPort,
    workerData = _require.workerData;

var _require2 = require('../consts'),
    CODE = _require2.CODE,
    TASK_TYPE = _require2.TASK_TYPE;

var _require3 = require('../utils'),
    evalModuleCode = _require3.evalModuleCode;

var execString = workerData.execString,
    execPath = workerData.execPath;
var mainRunner;

function errorRunner(err) {
  if (err instanceof Error) {
    return Promise.reject(err);
  } else {
    return Promise.reject(new Error("WorkerError: ".concat(err)));
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
    mainRunner = function mainRunner() {
      return errorRunner(new Error('Worker: No execString or execPath provided'));
    };
  }
} catch (error) {
  mainRunner = function mainRunner() {
    return errorRunner(error);
  };
}

parentPort.on('message', function (task) {
  var currentRunner;
  var currentValue;

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

  try {
    currentValue = currentRunner(task.payload);
  } catch (error) {
    currentValue = Promise.reject(error);
  }

  Promise.resolve(currentValue).then(function (data) {
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