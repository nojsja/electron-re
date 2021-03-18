"use strict";

var _require = require('electron'),
    BrowserWindow = _require.BrowserWindow,
    app = _require.app;

var _require2 = require('./libs/utils'),
    isRenderer = _require2.isRenderer,
    isMain = _require2.isMain;

var _require3 = require('./tasks/app.init'),
    listenerForNewWindow = _require3.listenerForNewWindow,
    registryProtocolForService = _require3.registryProtocolForService;

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');
exports.ProcessHost = require('./libs/ProcessHost.class');
/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}
/* -------------- main process -------------- */


if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager.class');
  /* new service listen */

  exports.MessageChannel.event.on('registry', function (_ref) {
    var pid = _ref.pid,
        id = _ref.id;
    var win = BrowserWindow.fromId(id);
    if (win && pid) exports.ProcessManager.listen(pid, 'service', win.webContents.getURL());
  });
  exports.MessageChannel.event.on('unregistry', function (_ref2) {
    var pid = _ref2.pid;
    exports.ProcessManager.unlisten(pid);
  });
  /* new renderer-window listen */

  listenerForNewWindow(app, exports);
  /* registry protocol */

  registryProtocolForService(app, exports);
}