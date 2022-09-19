const {
  parentPort, workerData
} = require('worker_threads');
const { CODE } = require('../consts');
const { context, code } = workerData;

function evalModuleCode(context, code, filename=__filename) {
  const _module = new NativeModule(filename, context);

  _module.paths = NativeModule._nodeModulePaths(context);
  _module.filename = filename;
  _module.compile(code, filename);

  return _module.exports;
}

const mainRunner = evalModuleCode(Object.assign({}, process.env, context), code);

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
      parentPort.postMessage({ code: CODE.FAILED, data: null, error, taskId: task.taskId });
    });
});
