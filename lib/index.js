"use strict";

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain,
    isForkedChild = _require.isForkedChild;

var _require2 = require('./tasks/app.init'),
    listenerForNewWindow = _require2.listenerForNewWindow,
    registryProtocolForService = _require2.registryProtocolForService,
    polyfillRemote = _require2.polyfillRemote;

exports.ChildProcessPool = require('./libs/ChildProcessPool');
exports.LoadBalancer = require('./libs/LoadBalancer');
exports.ProcessHost = require('./libs/ProcessHost.class');
exports.ProcessLifeCycle = require('./libs/ProcessLifeCycle.class');
/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}
/* -------------- main process -------------- */


if (isMain && !isForkedChild) {
  var _require3 = require('electron'),
      BrowserWindow = _require3.BrowserWindow,
      app = _require3.app;

  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');
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
  /* polyfill - remote */

  polyfillRemote(app, exports);
}