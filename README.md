[![GitHub license](https://img.shields.io/github/license/nojsja/electron-re)](https://github.com/nojsja/electron-re/blob/master/LICENSE.md)
[![GitHub issues](https://img.shields.io/github/issues/nojsja/electron-re)](https://github.com/nojsja/electron-re/issues)
[![GitHub stars](https://img.shields.io/github/stars/nojsja/electron-re)](https://github.com/nojsja/electron-re/stargazers)

[>> 功能介绍和使用说明1(中文)](https://nojsja.gitee.io/blogs/2020/12/08/Electron-Node%E5%A4%9A%E8%BF%9B%E7%A8%8B%E5%B7%A5%E5%85%B7%E5%BC%80%E5%8F%91%E6%97%A5%E8%AE%B0/)  
[>> 功能介绍和使用说明2(中文)](https://nojsja.gitee.io/blogs/2020/12/18/Electron%E5%A4%9A%E8%BF%9B%E7%A8%8B%E5%B7%A5%E5%85%B7%E5%BC%80%E5%8F%91%E6%97%A5%E8%AE%B02%EF%BC%9A%E8%BF%9B%E7%A8%8B%E7%AE%A1%E7%90%86UI/#I-%E5%89%8D%E8%A8%80)

##  electron-re
---------------
> Test on electron@8.2.0 / 9.3.5

### Contents
```sh
├── Contents (you are here!)
│
├── Architecture
│
├── * What can be used for?
│   ├── In Electron Project
│   └── In Nodejs/Electron Project
│
├── * Install
│
├── * Instruction1: ProcessManager
│   ├── Require it in main.js(electron)
│   └── Open process-manager window for your application
│
├── * Instruction2: Service
│   ├── The arguments to create a service
│   ├── Enable service auto reload after code changed
│   └── The methods of a Service instance
│
├── * Instruction3: MessageChannel
│   ├── The methods of MessageChannel
│   └── A full usage
│
├── * Instruction4: ChildProcessPool
│   ├── Create a childprocess pool
│   ├── Send request to a process instance
│   ├── Send request to all process instances
│   ├── Destroy the child processes of the process pool
│   └── Set the max instance limit of pool
│
├── * Instruction5: ProcessHost
│   ├── Require it in a sub process
│   ├── Registry a task with unique name
│   ├── Working with ChildProcessPool
│   └── Unregistry a task with unique name
│
├── Examples
```

### Architecture
-------

![architecture](http://nojsja.gitee.io/static-resources/images/electron-re/electron-re_arch.png)

### I. What can be used for?
-----

- 1）__BrowserServcie / MessageChannel__
  - Using `BrowserServcie` to generate some service processes without UI and put your heavy tasks into them.
  - `MessageChannel` make it be possible to communicate with each other between `main process`,`render process` and `service`.
- 2）__ProcessManager__
  - `ProcessManager` provides a user interface for managing / monitoring processes, includes `BrowserServcie` / `ChildProcess` / `renderer process` / `main process`.
- 3）__ChildProcessPool / ProcessHost__
  - `ChildProcessPool` with load-balance support may helps when you need to create and manage several processes on nodejs runtime of electron.
  - `ProcessHost` let us be focused on the core sub-process logic rather than various async event.

### II. Install
-----
```bash
$: npm install electron-re --save
# or
$: yarn add electron-re --save
```
### III. Instruction 1: ProcessManager
-----------------------
> Used in Electron project, build for ChildProcessPool/BrowserService.

> Compatible with native IpcRenderer/Main.

All functions:

1. Show all alive processes in your Electron application: main process, renderer process, the service process (imported by electron-re), and the child process created by ChildProcessPool (imported by electron-re).

2. The process list displays info: process ID, process type(mark), parent process ID, memory, CPU. All processes type include main (main process), service (service process), renderer (renderer process) , node (child process in process pool). click on table header to sort an item in increasing/decreasing order.

3. You can kill a process, view process console data, check CPU/memory occupancy within 1 min.

4. If a process marked as renderer, pressing the `DevTools` button then the built-in debugging tool will open as an undocked window. Besides the child-processes are created by ChildProcessPool with `--inspect` parameter, DevTools is not supported, just visit `chrome://inspect` in chrome for remote debugging.

5. Try to use `MessageChannel` for sending/receiving ipc messages, there is a ui pannel area that show activities of it (logger).

#### Require it in main.js(electron)

```js
const {
  MessageChannel, // remember to require it in main.js even if you don't use it
  ProcessManager
} = require('electron-re');
```

#### Open process-manager window

```js
ProcessManager.openWindow();
```

1. Main
> The main ui

![main](http://nojsja.gitee.io/static-resources/images/electron-re/process-manager.main.png?v3)

2. Console
> Show console info of all processes

![console](http://nojsja.gitee.io/static-resources/images/electron-re/console.gif?v2)

3. DevTools
> Open devtools for electron renderer window

![devtools](http://nojsja.gitee.io/static-resources/images/electron-re/devtools.gif?v2)


4. Trends
> Show cpu/memory occupancy trends

![trends](http://nojsja.gitee.io/static-resources/images/electron-re/trends.gif?v2)

![trends2](http://nojsja.gitee.io/static-resources/images/electron-re/trends2.gif?v2)

5. Kill
> Kill process from one-click

![kill](http://nojsja.gitee.io/static-resources/images/electron-re/kill.gif?v2)

6. Signals Pannel
> Activities logger for `MessageChannel` tool

![signals](http://nojsja.gitee.io/static-resources/images/electron-re/signals.png)

### IV. Instruction 2: Service

-----
>Used in Electron project, working with MessageChannel, remember to check "Instruction 3".

#### 1. The arguments to create a service

The `service` process is a customized render process that works in the background, receiving `path`, `options` as arguments:

* path [string] * -- The absolute path to a js file
* options [object] -- The same as `new BrowserWindow()` [options](https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions).

```js
/* --- main.js --- */
const { BrowserService } = require('electron-re');
const myService = new BrowserService('app', 'path/to/app.service.js', options);app.service.js'));
```

#### 2. Enable service auto reload after code changed

The `auto-reload` feature is based on nodejs - `fs.watch` api. When webSecurity closed and in `dev` mode, service will reload when service code changed.

1.Set dev mode in `new BrowserService()` options  
2.Get webSecurity closed
```js
/* --- main.js --- */
const myService = new BrowserService('app', 'path/to/app.service.js', {
  ...options,
  // set dev mode with webSecurity closed
  dev: true,
  webPreferences: { webSecurity: false }
});

```

#### 3. The methods of a Service instance

The service instance is a customized `BrowserWindow` instance too, initialized by a file worked with `commonJs` module, so you can use `require('name')` and can't use `import some from 'name'` syntax. It has two extension methods:

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

app.whenReady().then(async() => {
  // after app is ready in main process
  const myService = new BrowserService('app', 'path/to/app.service.js');
  // async
  await myService.connected();
  mhyService.openDevTools();
  /* work with webContents method, also you can use MessageChannel instead */
  mhyService.webContents.send('channel1', { value: 'test1' });
});
...
```

```js

/* --- app.service.js --- */
const { ipcRenderer } = require('electron');
/* working with ipc method, also you can use MessageChannel instead */
ipcRenderer.on('channel1', (event, result) => {
  // works
  ...
});
```

### V. Instruction 3: MessageChannel
-----
>Used in Electron project, working with Service.

When sending data from main/other process to a service you need to use `MesssageChannel`, such as: `MessageChannel.send('service-name', 'channel', 'params')`, And also it can be used to replace other build-in `ipc` methods, more flexible.

#### The methods of MessageChannel

1.Public methods，used in __Main-Pocess__ / __Renderer-Process__ / __Service__
```js
/* send data to a service - like the build-in ipcMain.send */
MessageChannel.send('service-name', channel, params);
/* send data to a service and return a Promise - extension method */
MessageChannel.invoke('service-name', channel, params);
/*
  send data to a renderer/servcie which id is same as the given windowId/webContentsId,
  same as ipcRenderer.sendTo,
  recommend to use it when you want to send data from main/service to a renderer window
*/
MessageChannel.sendTo('windowId/webContentsId', channel, params);
/* listen a channel, same as ipcMain.on/ipcRenderer.on */
MessageChannel.on(channel, func);
/* listen a channel once, same as ipcMain.once/ipcRenderer.once */
MessageChannel.once(channel, func);

```

2.Only used in __Renderer-process__ / __Service__
```js
/* send data to main process - like the build-in ipcRender.send */
MessageChannel.send('main', channel, params);
/* send data to main process and return a Promise - extension method */
MessageChannel.invoke('main', channel, params);

```

3.Only used in __Main-process__ / __Service__
```js
/*
  handle a channel signal, extension method,
  and you can return data directly or return a Promise instance
*/
MessageChannel.handle(channel, processorFunc);
```

#### Full Usage

- 1）In main process
```js
const {
  BrowserService,
  MessageChannel // must required in main.js even if you don't use it
} = require('electron-re');
const isInDev = process.env.NODE_ENV === 'dev';
...

/* use MessageChannel instead of build-in method */
app.whenReady().then(() => {
  const myService = new BrowserService('app', 'path/to/app.service.js');
  myService.connected().then(() => {
    // open devtools in dev mode for debugging
    if (isInDev) myService.openDevTools();
    MessageChannel.send('app', 'channel1', { value: 'test1' });
    MessageChannel.invoke('app', 'channel2', { value: 'test2' }).then((response) => {
      console.log(response);
    });

    MessageChannel.on('channel3', (event, response) => {
      console.log(response);
    });

    MessageChannel.handle('channel4', (event, response) => {
      console.log(response);
      return { res: 'channel4-res' };
    });

  })
});
```

- 2）Send or Receive data in a __service__ named app
```js
const { ipcRenderer } = require('electron');
const { MessageChannel } = require('electron-re');

MessageChannel.on('channel1', (event, result) => {
  console.log(result);
});

MessageChannel.handle('channel2', (event, result) => {
  console.log(result);
  return { response: 'channel2-response' }
});

MessageChannel.invoke('app2', 'channel3', { value: 'channel3' }).then((event, result) => {
  console.log(result);
});

MessageChannel.send('app2', 'channel4', { value: 'channel4' });
```

- 3）Send or receive data in a __service__ named app2
```js
MessageChannel.handle('channel3', (event, result) => {
  console.log(result);
  return { response: 'channel3-response' }
});

MessageChannel.once('channel4', (event, result) => {
  console.log(result);
});

MessageChannel.send('main', 'channel3', { value: 'channel3' });
MessageChannel.send('main', 'channel3', { value: 'channel3' });
MessageChannel.invoke('main', 'channel4', { value: 'channel4' });

```

- 3）Send or receive data in a __renderer__ window

```js
const { ipcRenderer } = require('electron');
const { MessageChannel } = require('electron-re');

MessageChannel.send('app', 'channel1', { value: 'test1'});
MessageChannel.invoke('app2', 'channel3', { value: 'test2' });
MessageChannel.send('main', 'channel3', { value: 'test3' });
MessageChannel.invoke('main', 'channel4', { value: 'test4' });
```

### VI. Instruction 4: ChildProcessPool
-----
>Used in Nodejs/Electron project, working with ProcessHost, remember to check "Instruction 5".

Multi-process helps to make full use of multi-core CPU, let's see some differences between multi-process and multi-thread:

1. It is difficult to share data between different processes, but threads can share memory.
2. Processes consume more computer resources than threads.
3. The processes will not affect each other, a thread hanging up will cause the whole process to hang up.

#### Attention of Electron Bugs !!

**DO NOT USE `require('electron')` in child_process js exec file, this will cause fatal error in the production environment!**

Besides that, In order to use ChildProcessPool, you need to place your child_process exec js file in an external directory such as `~/.config/`. Otherwise, when you packaged your app, Node.js can not find that exec file.

The another way to solve this problem is to set `asar` to false in the electron-builder.json, this is not recommended but works.

```json
{
   ...
   "asar": false,
   ...
}
```


#### 1. Create a childprocess pool

* path [string] __*__ - the absolute path to a js file.
* max [number] __*__ - the max count of instance created by pool.
* env [object] - env variable object.
* strategy [enum] - load balance strategy, default is `POLLING`.
  * __POLLING__: pick process one by one.
  * __WEIGHTS__: pick process by process weight.
  * __RANDOM__: pick by random.
  * __WEIGHTS_POLLING__: pick process one by one, Affected by `WEIGHTS`.
  * __WEIGHTS_RANDOM__: pick process by random, Affected by `WEIGHTS`.
  * __MINIMUM_CONNECTION (not recommend, DO NOT USE)__: pick process by minimum connection count of per process.
  * __WEIGHTS_MINIMUM_CONNECTION (not recommend, DO NOT USE)__: pick process by minimum connection count of per process, Affected by `WEIGHTS`.
* weight [array] - the weight of each process, default is [1...].

```js
const { ChildProcessPool, LoadBalancer } = require('electron-re');

global.ipcUploadProcess = new ChildProcessPool({
  path: path.join(app.getAppPath(), 'app/services/child/upload.js'),
  max: 3,
  env: { lang: global.lang, NODE_ENV: nodeEnv },
  strategy: LoadBalancer.ALGORITHM.WEIGHTS_POLLING, // loadbalance strategy
  weights: [1, 2, 3],
});
```

#### 2. Send request to a process instance

* 1）taskName [string] __*__ - a task registried with `ProcessHost`.
* 2）data [any] __*__ - the data passed to process.
* 3）id [any] - the unique id bound to a process instance.
  * The unique id bound to a process instance(id will be automatically bound after call `send()`). 
  * Sometime you send request to a process with special data, then expect to get callback data from that process. You can provide an unique id in `send` function, each time pool will send a request to the process bound with this id.
  * If you give an empty/undefined/null id, pool will select a process by load-balance strategy.

```js
global.ipcUploadProcess.send(
  'init-works',
  {
    name: 'fileName',
    type: 'fileType',
    size: 'fileSize',
  },
  'id-number' // optional and it's given by you
)
.then((rsp) => {
  console.log(rsp);
});
```

#### 3. Send request to all process instances

All sub processes will receive a request, and you can get a response data array from all sub processes.

* 1）taskName [string] __*__ - a task registried with `ProcessHost`(check usage below).
* 2）data [any] - the data passed to process.

```js
global.ipcUploadProcess.sendToAll(
  'task-get-all',
  { key: 'test' }
)
.then((rsp) => {
  console.log(rsp);
});
```

#### 4. Destroy the child processes of the process pool

- If do not specify `id`, all child processes will be destroyed. Specifying the `id` parameter can separately destroy a child process bound to this `id`.

- After the destruction, using the process pool to send a new request, a new child process will be created automatically.

- It should be noted that the `id` binding operation is automatically performed after the `processPool.send('task-name', params, id)` method is called.

```js
// destroy a process with id value
global.ipcUploadProcess.disconnect(id);
// destroy all processes
global.ipcUploadProcess.disconnect();
```

#### 5. Set the max instance limitation of pool

In addition to using the `max` parameter to specify the maximum number of child process instances created by the process pool, you can also call this method to dynamically set the number of child process instances that need to be created.

```js
global.ipcUploadProcess.setMaxInstanceLimit(number);
```

### VII. Instruction 5: ProcessHost
-----

> Used in Nodejs/Electron project, working with ChildProcessPool.

In `Instruction 4`, We already know how to create a sub-process pool and send request using it. Now let's figure out how to registry a task and handle process messages in a sub process(created by ChildProcessPool constructor with param - `path`).

Using `ProcessHost` we will no longer pay attention to the message sending/receiving between main process and sub processes. Just declaring a task with a unique service-name and put your processing code into a function. And remember that if the code is async, return a Promise instance instead.

#### 1. Require it in a sub process

```js
const { ProcessHost } = require('electron-re');
```
#### 2. Registry a task with unique name
> Support chain call

```js
ProcessHost
  .registry('init-works', (params) => {
    return initWorks(params);
  })
  .registry('async-works', (params) => {
    return asyncWorks(params);
  });

function initWorks(params) {
  console.log(params);
  return params;
}

function asyncWorks(params) {
  console.log(params);
  return fetch(url);
}
```

#### 3. Working with `ChildProcessPool`

```js

/* 1. send a request in main process */
global.ipcUploadProcess.send(
  'init-works',
  {
    name: 'fileName',
    type: 'fileType',
    size: 'fileSize',
  }
);

...

/* 2. handle this request in sub process */
...

```

#### 4. Unregistry a task with unique name(if necessary)
> Support chain call

```js
ProcessHost
  .unregistry('init-works')
  .unregistry('async-works')
  ...
```

### VIII. Examples
-----

1. [electronux](https://github.com/nojsja/electronux) - A project of mine that uses `BroserService` and `MessageChannel` of electron-re.

2. [file-slice-upload](https://github.com/nojsja/javascript-learning/tree/master/file-slice-upload) - A demo about parallel upload of multiple files, it uses `ChildProcessPool` and `ProcessHost` of electron-re, based on Electron@9.3.5.

3. Also you can check the `index.dev.js` and `test` dir in root, there are some cases for a full usage.
