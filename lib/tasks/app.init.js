"use strict";

var _require = require('electron'),
    protocol = _require.protocol;

var path = require('path');

var conf = require('../conf/global.json');

var _require2 = require('../libs/utils'),
    compareVersion = _require2.compareVersion;
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
  if (global["electronre:$remoteMain"]) return;

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