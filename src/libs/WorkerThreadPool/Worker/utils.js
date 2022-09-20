const NativeModule = require('module');

exports.evalModuleCode = function (context, code, filename='eval') {
  const _module = new NativeModule(filename, context);

  _module.paths = NativeModule._nodeModulePaths(context);
  _module.filename = filename;
  _module._compile(code, filename);

  return _module.exports;
};