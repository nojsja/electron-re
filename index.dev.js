const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const url = require('url');

const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService
} = require('./src/index');

const processManager = require('./src/libs/ProcessManager.class');

const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

const isInDev = process.env.NODE_ENV === 'dev';

/* 创建窗口 */
function createWindow() {
  global.mainWindow = new BrowserWindow({
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  processManager.openProcessManager('dev');
  global.mainWindow.loadFile(entryHtml);
}


/* prepare to test */
app.whenReady().then(async() => {
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

    if (isInDev) {
      // global.appService.openDevTools();
      // global.otherService.openDevTools();
    }

    createWindow();
});