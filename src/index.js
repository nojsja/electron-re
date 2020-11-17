const { isRenderer } = require('./libs/utils');

exports.MessageChannel = require('./libs/MessageChannel.class');
exports.ChildProcessPool = require('./libs/ChildProcessPool.class');

(!isRenderer) && (exports.BrowserService = require('./libs/BrowserService.class'));