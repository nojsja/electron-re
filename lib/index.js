"use strict";

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain;

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');
exports.ProcessHost = require('./libs/ProcessHost.class');

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager.class');
  exports.MessageChannel.event.on('registry', function (_ref) {
    var pid = _ref.pid;
    exports.ProcessManager.listen(pid, 'renderer');
  });
  exports.MessageChannel.event.on('unregistry', function (_ref2) {
    var pid = _ref2.pid;
    exports.ProcessManager.unlisten(pid);
  });
}