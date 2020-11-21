const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService
} = require('./src/index');
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
app.whenReady().then(async() => {
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

    if (process.env.NODE_ENV === 'dev') {
      global.appService.openDevTools();
      global.otherService.openDevTools();
    }

    createWindow();
});