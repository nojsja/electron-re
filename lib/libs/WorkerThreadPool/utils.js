"use strict";

var NativeModule = require('module');

exports.evalModuleCode = function (context, code) {
  var filename = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'eval';

  var _module = new NativeModule(filename, context);

  _module.paths = NativeModule._nodeModulePaths(context);
  _module.filename = filename;

  _module._compile(code, filename);

  return _module.exports;
};

exports.funcStringify = function (func) {
  if (func instanceof Function) {
    return "module.exports = ".concat(Function.prototype.toString.call(execFunction));
  }

  throw new Error('funcStringify: params must be a function');
};