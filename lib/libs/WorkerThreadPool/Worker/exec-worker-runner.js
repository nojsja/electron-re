"use strict";

var _require = require('worker_threads'),
    parentPort = _require.parentPort,
    workerData = _require.workerData;

var _require2 = require('../consts'),
    CODE = _require2.CODE;

var execPath = workerData.execPath;

var mainRunner = require(execPath);

parentPort.on('message', function (task) {
  Promise.resolve(mainRunner(task.payload)).then(function (data) {
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