const {
  parentPort, workerData
} = require('worker_threads');

function evalModuleCode(context, code, filename=__filename) {
  const _module = new NativeModule(filename, context);

  _module.paths = NativeModule._nodeModulePaths(context);
  _module.filename = filename;
  _module.compile(code, filename);

  return _module.exports;
}

const { context, code } = workerData;
const mainRunner = evalModuleCode(Object.assign({}, process.env, context), code);

parentPort.on('message', (info) => {
  Promise.resolve(mainRunner(info))
    .then((data) => {
      parentPort.postMessage({
        code: 0,
        data,
        error: null
      });
    })
    .catch((error) => {
      parentPort.postMessage({ code: 1, data: null, error });
    });
});
