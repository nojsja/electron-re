const NativeModule = require('module');

class EvalWorker {
  static evalModuleCode(context, code, filename) {
    const _module = new NativeModule(filename, context);

    _module.paths = NativeModule._nodeModulePaths(context);
    _module.filename = filename;
    _module.compile(code, filename);

    return _module.exports;
  }
}

module.exports = EvalWorker;