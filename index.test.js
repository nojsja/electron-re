const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService
} = require('./lib/index');
const test = require('./test/test.js');
const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

/* 创建窗口 */
function createWindow() {
  global.mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  global.mainWindow.loadFile(entryHtml);
}


/* prepare to test */
describe('app ready => ', function() {
  this.timeout(2e3);
  before(async () => {
    await app.whenReady().then(() => ipcMain.on('console', (event, info)  => console.log('console => ', info)));
    global.appService = new BrowserService('app',
        entryService,
        { webPreferences: { webSecurity: false } }
      );
    global.otherService = new BrowserService('other',
        otherService,
        { webPreferences: { webSecurity: false } }
    );
    await global.appService.connected();
    await global.otherService.connected();

    createWindow();
    await new Promise(resolve => {
      global.mainWindow.webContents.on('did-finish-load', resolve);
    });
  });

  test.run();

});