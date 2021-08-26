const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const base = (process.env.NODE_ENV === 'dev') ? 'src' : 'lib'; // base dir
const { 
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService,
  ChildProcessPool
} = require(`./${base}/index`);

const processManager = require(`./${base}/libs/ProcessManager.class`);

const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

/* 创建窗口 */
function createWindow() {
  global.mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  });

  processManager.openWindow(process.env.NODE_ENV);
  // processManager.openWindow('prod');
  global.mainWindow.loadFile(entryHtml);
}


/* prepare to test */
app.whenReady().then(async() => {
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

    /* service devtools */
    global.appService.openDevTools();
    global.otherService.openDevTools();

    global.childProcessPool = new ChildProcessPool({
      path: path.resolve(__dirname, './test/child_process/child1.js'),
      max: 3
    });

    global.childProcessPool.send('test1', { value: 'test1' });
    global.childProcessPool.send('test2', { value: 'test2' });
    global.childProcessPool.send('test2', { value: 'test3' });

    createWindow();
});