const { BrowserWindow, app } = require('electron');
const { isRenderer, isMain } = require('./libs/utils');

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');
exports.ProcessHost = require('./libs/ProcessHost.class');

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class')
  exports.MessageChannel = require('./libs/MessageChannel.class');

  exports.ProcessManager = require('./libs/ProcessManager.class');

  exports.MessageChannel.event.on('registry', ({pid}) => {
    exports.ProcessManager.listen(pid, 'service');
  });
  exports.MessageChannel.event.on('unregistry', ({pid}) => {
    exports.ProcessManager.unlisten(pid)
  });

  setInterval(() => console.log(1), 1e3);
  
  exports.ProcessManager.pipe(process);

  app.on('web-contents-created', (event, webContents) => {
    webContents.once('did-finish-load', () => {
      const pid = webContents.getOSProcessId();
      exports.ProcessManager.listen(pid, 'renderer');
      // webContents.on('console-message', (e, level, msg, line, sourceid) => {
      //   exports.ProcessManager.stdout(pid, msg);
      // });
      webContents.once('closed', function(e) {
        exports.ProcessManager.unlisten(this.pid);
      }.bind({ pid }));
    })
  });
}
