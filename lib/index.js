"use strict";

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain,
    isForkedChild = _require.isForkedChild;

var _require2 = require('./libs/WorkerThreadPool/consts'),
    THREAD_TYPE = _require2.THREAD_TYPE,
    CODE = _require2.CODE,
    THREAD_STATUS = _require2.THREAD_STATUS,
    TASK_STATUS = _require2.TASK_STATUS;

exports.ChildProcessPool = require('./libs/ChildProcessPool');
exports.LoadBalancer = require('./libs/LoadBalancer');
exports.ProcessHost = require('./libs/ProcessHost.class');
exports.ProcessLifeCycle = require('./libs/ProcessLifeCycle.class');
exports.WorkerThreadPool = require('./libs/WorkerThreadPool');
exports.THREAD_TYPE = THREAD_TYPE;
exports.THREAD_STATUS = THREAD_STATUS;
exports.THREAD_TASK_STATUS = TASK_STATUS;
exports.CODE = CODE;
/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}
/* -------------- main process -------------- */


if (isMain && !isForkedChild) {
  var _require3 = require('electron'),
      app = _require3.app;

  var _require4 = require('./tasks/app.init'),
      registryProtocolForService = _require4.registryProtocolForService,
      polyfillRemote = _require4.polyfillRemote;

  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');
  /* registry protocol */

  registryProtocolForService(app, exports);
  /* polyfill - remote */

  polyfillRemote(app, exports);
}