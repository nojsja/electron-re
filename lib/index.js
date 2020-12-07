'use strict';

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer,
    isMain = _require.isMain;

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class');
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');

exports.ProcessHost = require('./libs/ProcessHost.class');