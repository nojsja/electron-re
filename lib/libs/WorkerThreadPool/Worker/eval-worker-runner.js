"use strict";

var _require = require('worker_threads'),
    parentPort = _require.parentPort,
    workerData = _require.workerData;

var _require2 = require('../consts'),
    CODE = _require2.CODE;

var context = workerData.context,
    code = workerData.code;

function evalModuleCode(context, code) {
  var filename = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : __filename;

  var _module = new NativeModule(filename, context);

  _module.paths = NativeModule._nodeModulePaths(context);
  _module.filename = filename;

  _module.compile(code, filename);

  return _module.exports;
}

var mainRunner = evalModuleCode(Object.assign({}, process.env, context), code);
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