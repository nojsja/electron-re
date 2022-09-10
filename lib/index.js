"use strict";

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain,
    isForkedChild = _require.isForkedChild;

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
  var _require2 = require('electron'),
      app = _require2.app;

  var _require3 = require('./tasks/app.init'),
      registryProtocolForService = _require3.registryProtocolForService,
      polyfillRemote = _require3.polyfillRemote;

  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');
  /* registry protocol */

  registryProtocolForService(app, exports);
  /* polyfill - remote */

  polyfillRemote(app, exports);
}