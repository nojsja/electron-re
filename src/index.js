const { isRenderer, isMain, isForkedChild } = require('./libs/utils');
const {
  listenerForNewWindow,
  registryProtocolForService
} = require('./tasks/app.init');

exports.ChildProcessPool = require('./libs/ChildProcessPool');
exports.ProcessHost = require('./libs/ProcessHost.class');

/* -------------- renderer process -------------- */

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

/* -------------- main process -------------- */

if (isMain && !isForkedChild) {
  const { BrowserWindow, app } = require('electron');

  exports.BrowserService = require('./libs/BrowserService.class')
  exports.MessageChannel = require('./libs/MessageChannel.class');

  exports.ProcessManager = require('./libs/ProcessManager');

  /* new service listen */
  exports.MessageChannel.event.on('registry', ({ pid, id }) => {
    const win = BrowserWindow.fromId(id);
    if (win && pid)
      exports.ProcessManager.listen(pid, 'service', win.webContents.getURL());
  });
  exports.MessageChannel.event.on('unregistry', ({ pid }) => {
    exports.ProcessManager.unlisten(pid)
  });

  /* new renderer-window listen */
  listenerForNewWindow(app, exports);
  /* registry protocol */
  registryProtocolForService(app, exports);
}
