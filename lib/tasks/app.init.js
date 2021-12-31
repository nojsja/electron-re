"use strict";

var conf = require('../conf/global.json');

var _require = require('electron'),
    protocol = _require.protocol;

var path = require('path');

var _require2 = require('../libs/utils'),
    compareVersion = _require2.compareVersion;
/* new renderer-window listen */


exports.listenerForNewWindow = function (app, ep) {
  app.on('web-contents-created', function (event, webContents) {
    webContents.once('did-finish-load', function () {
      var pid = webContents.getOSProcessId(); // ignore processManager window

      if (ep.ProcessManager.processWindow && ep.ProcessManager.processWindow.webContents.getOSProcessId() === pid) return;
      ep.ProcessManager.listen(pid, 'renderer', webContents.getURL());
      /* window-console listen */

      webContents.on('console-message', function (e, level, msg, line, sourceid) {
        ep.ProcessManager.stdout(pid, msg);
      });
      webContents.once('closed', function (e) {
        ep.ProcessManager.unlisten(this.pid);
      }.bind({
        pid: pid
      }));
    });
  });
};
/* define protocol for service */


exports.registryProtocolForService = function (app, ep) {
  var protocolName = conf.protocolName;
  app.whenReady().then(function () {
    protocol.registerFileProtocol(protocolName, function (request, callback) {
      var url = request.url.substr(protocolName.length + 3);
      callback({
        path: path.normalize(decodeURIComponent(url))
      });
    });
  });
};
/* polyfill - remote */


exports.polyfillRemote = function () {
  if (compareVersion(process.versions.electron, '14') >= 0) {
    Object.defineProperty(global, "electronre:$remoteMain", {
      value: require('@electron/remote/main'),
      writable: false,
      configurable: false,
      enumerable: true
    });
    global["electronre:$remoteMain"].initialize();
  }
};