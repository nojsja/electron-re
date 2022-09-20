"use strict";

var _require = require('worker_threads'),
    parentPort = _require.parentPort,
    workerData = _require.workerData;

var _require2 = require('../consts'),
    CODE = _require2.CODE,
    TASK_TYPE = _require2.TASK_TYPE;

var _require3 = require('./utils'),
    evalModuleCode = _require3.evalModuleCode;

var execPath = workerData.execPath;

var mainRunner = require(execPath);

parentPort.on('message', function (task) {
  var currentRunner;

  if (task.taskType === TASK_TYPE.DYNAMIC) {
    currentRunner = task.execPath ? require(task.execPath) : evalModuleCode('.', task.execString);
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