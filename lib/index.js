"use strict";

var _require = require('electron'),
    BrowserWindow = _require.BrowserWindow,
    app = _require.app;

var _require2 = require('./libs/utils'),
    isRenderer = _require2.isRenderer,
    isMain = _require2.isMain;

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');
exports.ProcessHost = require('./libs/ProcessHost.class');

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
  exports.ProcessManager = require('./libs/ProcessManager.class');
  exports.MessageChannel.event.on('registry', function (_ref) {
    var pid = _ref.pid;
    exports.ProcessManager.listen(pid, 'service');
  });
  exports.MessageChannel.event.on('unregistry', function (_ref2) {
    var pid = _ref2.pid;
    exports.ProcessManager.unlisten(pid);
  });
  app.on('web-contents-created', function (event, webContents) {
    webContents.once('did-finish-load', function () {
      var pid = webContents.getOSProcessId();
      if (exports.ProcessManager.processWindow && exports.ProcessManager.processWindow.webContents.getOSProcessId() === pid) return;
      exports.ProcessManager.listen(pid, 'renderer');
      webContents.on('console-message', function (e, level, msg, line, sourceid) {
        exports.ProcessManager.stdout(pid, msg);
      });
      webContents.once('closed', function (e) {
        exports.ProcessManager.unlisten(this.pid);
      }.bind({
        pid: pid
      }));
    });
  });
}