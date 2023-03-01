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