const { protocol } = require('electron');
const path = require('path');

const conf = require('../conf/global.json');
const { compareVersion } = require('../libs/utils');

/* define protocol for service */
exports.registryProtocolForService = (app, ep) => {
  const protocolName = conf.protocolName;
  app.whenReady().then(() => {
    protocol.registerFileProtocol(protocolName, (request, callback) => {
      const url = request.url.substr(protocolName.length + 3);
      callback({ path: path.normalize(decodeURIComponent(url)) })
    });
  });
}

/* polyfill - remote */
exports.polyfillRemote = () => {
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