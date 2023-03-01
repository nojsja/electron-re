const path = require('path');
const { app, BrowserWindow } = require('electron');
const base = (process.env.NODE_ENV === 'dev') ? 'src' : 'lib'; // base dir
const {
  MessageChannel, /* must required in index.js even if you don't use it */
  BrowserService,
  ChildProcessPool
} = require(`./${base}/index`);

// allow require native modules in renderer process
app.allowRendererProcessReuse = false;

const processManager = require(`./${base}/libs/ProcessManager`);

const entryHtml = path.join(__dirname, 'test/index.html');
const entryService = path.join(__dirname, 'test/services/app.service.js');
const otherService = path.join(__dirname, 'test/services/other.service.js');

/* 创建窗口 */
async function createWindow() {
  global.mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  await processManager.openWindow(process.env.NODE_ENV);
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
    // global.appService.openDevTools();
    // global.otherService.openDevTools();

    global.childProcessPool = new ChildProcessPool({
      path: path.resolve(__dirname, './test/child_process/child1.js'),
      max: 3
    });

    global.childProcessPool.send('test1', { value: 'test1' });
    global.childProcessPool.send('test2', { value: 'test2' });
    global.childProcessPool.send('test2', { value: 'test3' });

    await createWindow();
});