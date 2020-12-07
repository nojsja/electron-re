const { isRenderer, isMain } = require('./libs/utils');

if (isRenderer) {
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

if (isMain) {
  exports.BrowserService = require('./libs/BrowserService.class')
  exports.MessageChannel = require('./libs/MessageChannel.class');
}

exports.ChildProcessPool = require('./libs/ChildProcessPool.class');

exports.ProcessHost = require('./libs/ProcessHost.class');