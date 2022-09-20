const { isRenderer, isMain, isForkedChild } = require('./libs/utils');
const {
  THREAD_TYPE, CODE,
  THREAD_STATUS, TASK_STATUS, TASK_TYPE,
} = require('./libs/WorkerThreadPool/consts');

exports.ChildProcessPool = require('./libs/ChildProcessPool');
exports.LoadBalancer = require('./libs/LoadBalancer');
exports.ProcessHost = require('./libs/ProcessHost.class');
exports.ProcessLifeCycle = require('./libs/ProcessLifeCycle.class');
exports.WorkerThreadPool = require('./libs/WorkerThreadPool');

exports.THREAD_TYPE = THREAD_TYPE;
exports.THREAD_STATUS = THREAD_STATUS;
exports.THREAD_TASK_STATUS = TASK_STATUS;
exports.THREAD_TASK_TYPE = TASK_TYPE,
exports.CODE = CODE;

/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

/* -------------- main process -------------- */

if (isMain && !isForkedChild) {
  const { app } = require('electron');
  const {
    registryProtocolForService,
    polyfillRemote,
  } = require('./tasks/app.init');

  exports.BrowserService = require('./libs/BrowserService.class')
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager');

  /* registry protocol */
  registryProtocolForService(app, exports);

  /* polyfill - remote */
  polyfillRemote(app, exports);
}