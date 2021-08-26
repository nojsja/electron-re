const conf = require('../conf/global.json');
const { protocol } = require('electron');
const path = require('path');

/* new renderer-window listen */
exports.listenerForNewWindow = (app, ep) => {
  app.on('web-contents-created', (event, webContents) => {
    webContents.once('did-finish-load', () => {
      const pid = webContents.getOSProcessId();
      // ignore processManager window
      if (ep.ProcessManager.processWindow &&
        ep.ProcessManager.processWindow.webContents.getOSProcessId() === pid) return;

        ep.ProcessManager.listen(pid, 'renderer', webContents.getURL());

      /* window-console listen */
      webContents.on('console-message', (e, level, msg, line, sourceid) => {
        ep.ProcessManager.stdout(pid, msg);
      });
      webContents.once('closed', function(e) {
        ep.ProcessManager.unlisten(this.pid);
      }.bind({ pid }));
    })
  });
}

/* define protocol for service */
exports.registryProtocolForService = (app, ep) => {
  const protocolName = conf.protocolName;
  app.whenReady().then(() => {
    protocol.registerFileProtocol(protocolName, (request, callback) => {
      const url = request.url.substr(protocolName.length + 4);
      callback({ path: path.normalize(decodeURIComponent(url)) })
    });
  });
}