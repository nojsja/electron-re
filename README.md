###  electron-re
---------------

> can only be used in electron project and test on electron@8.2.0

Using `electron-re` to generate some service processs and communicate between `main process`,`render process` and `service`. In some `Best Practices` of electron tutorials, it suggests to put your code that occupy the CPU into rendering process instead of in main process, exactly `electron-re` means to do.

#### I ) Install
```bash
# 01 - for github-package depository user
$: npm install @nojsja/electron-re --save
# or
$: yarn add @nojsja/electron-re

# 02 - for npm-package depository user
$: npm install electron-re --save
# or
$: yarn add electron-re
```
#### II ) Instruction

The `service` process is a customized render process that works in the background, receiving `path`, `options` as arguments:

##### 1. arguments to create a service

* path -- the absolute path to a js file
```js
const { BrowserService } = require('electron');
const myServcie = new BrowserService('app', path.join(__dirname, 'path/to/app.service.js'));
```

* options -- the same as `new BrowserWindow()` [options](https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions)
```js
/* --- main.js --- */
const myService = new BrowserService('app', 'path/to/app.service.js', options);
```

##### 2. enable service auto reload after code changed
The `auto-reload` feature is based on nodejs - `fs.watch` api, When webSecurity closed and in `dev` mode, service will reload after the code of `required dependencies and service itself` changed.
```js

/* --- package.json --- */
{
  ...
  scripts: {
    // method1: declare dev env
    start: 'cross-env NODE_ENV=dev electron index.js',
    // method2: declare development env
    start: 'cross-env NODE_ENV=development electron index.js',
  }
  ...
}

/* --- main.js --- */

// method3: set nodeEnv directly instead of declaring it in package.json
global.nodeEnv = 'dev';
const myService = new BrowserService('app', 'path/to/app.service.js', {
  ...options,
  // with webSecurity closed
  webPreferences: { webSecurity: false }
});
```

In order to send data from main/other process to a service you need to use `MesssageChannel`, such as: `MessageChannel.send('service-name', 'channel', 'params')`

#### III ) Usage

##### 1. Service

The service is a customized `BrowserWindow` instance, initialized by a file worked with `commonJs` module, so you can use `require('name')` and can't use `import some from 'name'` syntax. It has two extension methods:

* `connected()` - return a resolved `Promise` when service is ready.

* `openDevTools` - open an undocked window for debugging.

suggest to put some business-related code into a service.

```js
/* --- main.js --- */
  
const { 
  BrowserService,
  MessageChannel // must required in main.js even if you don't use it
} = require('electron-re');
...

app.whenReady().then(() => {
// after app is ready in main process
  const myService = new BrowserService('app', 'path/to/app.service.js');
  myService.connected()
    .then(() => {
      // use the electron build-in method to send data
      mhyService.webContents.send('channel1', { value: 'test1' });
      ...
    })
    .catch((err) => console.log(`Error in service-app : ${err}`));
});
```

```js
/* --- app.service.js --- */

const { ipcRenderer } = require('electron');

ipcRenderer.on('channel1', (event, result) => {
  // works
  ...
});
```

##### 2. MessageChannel
> confirm to require it in main.js(main process entry) first

This is a messaging tool expanding some methods from electron build-in ipc:

* in main process

```js
/* --- main --- */

const {
  BrowserService,
  MessageChannel // must required in main.js even if you don't use it
} = require('electron-re');
const isInDev = process.env.NODE_ENV === 'dev';
...

// after app is ready in main process
app.whenReady().then(() => {
  const myService = new BrowserService('app', 'path/to/app.service.js');
  myService.connected().then(() => {
    // open devtools in dev mode for debugging
    if (isInDev) myService.openDevTools();
    // send data to a service - like the build-in ipcMain.send
    MessageChannel.send('app', 'channel1', { value: 'test1' });
    // send data to a service and return a Promise - extension method
    MessageChannel.invoke('app', 'channel2', { value: 'test1' }).then((response) => {
      console.log(response);
    });
    // listen a channel, same as ipcMain.on
    MessageChannel.on('channel3', (event, response) => {
      console.log(response);
    });

    // handle a channel signal, same as ipcMain.handle
    // you can return data directly or return a Promise instance
    MessageChannel.handle('channel4', (event, response) => {
      console.log(response);
      return { res: 'channel4-res' };
    });

  })
});
```

* in a service process named app

```js
/* --- service-app --- */
const { ipcRenderer } = require('electron');
const { MessageChannel } = require('electron-re');

// listen a channel, same as ipcRenderer.on
MessageChannel.on('channel1', (event, result) => {
  console.log(result);
});

// handle a channel signal, just like ipcMain.handle
MessageChannel.handle('channel2', (event, result) => {
  console.log(result);
  return { response: 'channel2-response' }
});

// send data to another service and return a promise , just like ipcRenderer.invoke
MessageChannel.invoke('app2', 'channel3', { value: 'channel3' }).then((event, result) => {
  console.log(result);
});

// send data to a service - like the build-in ipcRenderer.send
MessageChannel.send('app', 'channel4', { value: 'channel4' });


```

* in an another service process named app2

```js

/* --- service-app2 --- */

// handle a channel signal, just like ipcMain.handle
MessageChannel.handle('channel3', (event, result) => {
  console.log(result);
  return { response: 'channel3-response' }
});

// listen a channel, same as ipcRenderer.once
MessageChannel.once('channel4', (event, result) => {
  console.log(result);
});

// send data to main process, just like ipcRenderer.send
MessageChannel.send('main', 'channel3', { value: 'channel3' });
// send data to main process and return a Promise, just like ipcRenderer.invoke
MessageChannel.invoke('main', 'channel4', { value: 'channel4' });

```

* in a render process window

```js
/* --- render process --- */
const { ipcRenderer } = require('electron');
const { MessageChannel } = require('electron-re');

// send data to a service
MessageChannel.send('app', ....);
MessageChannel.invoke('app', ....);

// send data to main process
MessageChannel.send('main', ....);
MessageChannel.invoke('main', ....);
```

#### IV ) Example

[electronux](https://github.com/nojsja/electronux) - A project of mine that uses `electron-re`, also you can check the `index.dev.js` and `test` dir in root, there are some cases.