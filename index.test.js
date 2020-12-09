const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService
} = require(`./${process.env.TEST ? 'lib' : 'src'}/index`);
const test = require('./test/test.js');
const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

const isInDev = process.env.NODE_ENV === 'dev';

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
  this.timeout(5e3);
  before(async () => {
    await app.whenReady().then(() => ipcMain.on('console', (event, info)  => console.log('console => ', info)));
    global.appService = new BrowserService('app',
        entryService,
        { dev: isInDev, webPreferences: { webSecurity: false } }
      );
    global.otherService = new BrowserService('other',
        otherService,
        { dev: isInDev, webPreferences: { webSecurity: false } }
    );
    await global.appService.connected();
    await global.otherService.connected();

    if (isInDev) global.appService.openDevTools();

    createWindow();
    await new Promise(resolve => {
      global.mainWindow.webContents.on('did-finish-load', () => setTimeout(resolve, 3e3));
    });
  });

  test.run();

});