const { isRenderer, isMain, isForkedChild } = require('./libs/utils');

const { THREAD_TYPE, StaticThreadPool, DynamicThreadPool } = require('./libs/WorkerThreadPool');

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
  const { app } = require('electron');
  const { registryProtocolForService } = require('./tasks/app.init');

  exports.BrowserService = require('./libs/BrowserService.class')
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');

  /* registry protocol */
  registryProtocolForService(app, exports);
}