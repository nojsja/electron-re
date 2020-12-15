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
    exports.ProcessManager.listen(pid, 'renderer');
  });
  exports.MessageChannel.event.on('unregistry', ({pid}) => {
    exports.ProcessManager.unlisten(pid)
  });
}
