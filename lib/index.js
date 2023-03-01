"use strict";

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain,
    isForkedChild = _require.isForkedChild;

var _require2 = require('./libs/WorkerThreadPool'),
    THREAD_TYPE = _require2.THREAD_TYPE,
    StaticThreadPool = _require2.StaticThreadPool,
    DynamicThreadPool = _require2.DynamicThreadPool;

exports.ChildProcessPool = require('./libs/ChildProcessPool');
exports.LoadBalancer = require('./libs/LoadBalancer');
exports.ProcessHost = require('./libs/ProcessHost.class');
exports.ProcessLifeCycle = require('./libs/ProcessLifeCycle.class');
exports.StaticThreadPool = StaticThreadPool;
exports.DynamicThreadPool = DynamicThreadPool;
exports.THREAD_TYPE = THREAD_TYPE;
/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}
/* -------------- main process -------------- */


if (isMain && !isForkedChild) {
  var _require3 = require('electron'),
      app = _require3.app;

  var _require4 = require('./tasks/app.init'),
      registryProtocolForService = _require4.registryProtocolForService;

  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');
  /* registry protocol */

  registryProtocolForService(app, exports);
}