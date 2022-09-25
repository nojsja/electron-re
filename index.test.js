const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService,
} = require(`./${base}/index`);

const test = require('./test/');
const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

// allow require native modules in renderer process
app.allowRendererProcessReuse = false;

/* 创建窗口 */
async function createWindow() {
  global.mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  global.mainWindow.loadFile(entryHtml);
  global.mainWindow.openDevTools();
}

/* prepare to test */
describe('app ready => ', function() {
  this.timeout(60e3);
  before(async () => {
    await app.whenReady().then(() => {
      ipcMain.on('console', (event, info)  => console.log('console => ', info));
    });
    global.appService = new BrowserService('app',
        entryService,
        { dev: true, webPreferences: { webSecurity: false } }
      );
    global.otherService = new BrowserService('other',
        otherService,
        { dev: true, webPreferences: { webSecurity: false } }
    );
    await global.appService.connected();
    await global.otherService.connected();

    global.appService.openDevTools();
    global.otherService.openDevTools();
    await createWindow();
    await new Promise(resolve => {
      global.mainWindow.webContents.on('did-finish-load', () => {
        setTimeout(resolve, 3e3);
      });
    });
  });

  test.run();

});