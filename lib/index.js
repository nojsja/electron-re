'use strict';

var _require = require('./libs/utils'),
    isRenderer = _require.isRenderer;

exports.MessageChannel = require('./libs/MessageChannel.class');
exports.ChildProcessPool = require('./libs/ChildProcessPool.class');

!isRenderer && (exports.BrowserService = require('./libs/BrowserService.class'));