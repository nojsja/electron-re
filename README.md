###  electron-re
---------------
> Test on electron@8.2.0 / 9.3.5

#### I ) What can be used for
-----

1. In Electron Project

Using `electron-re` to generate some service processs and communicate between `main process`,`render process` and `service`. In some `Best Practices` of electron tutorials, it suggests to put your code that occupying cpu into rendering process instead of in main process, exactly you can use it for. Check usage of `Servcie` and `MessageChannel` below.

2. In Nodejs/Electron Project

Besides, If you want to create some sub processes (see nodejs `child_process`) that not depends on `electron runtime`, there is a process-pool written for pure `nodejs runtime` and can be used in electron/nodejs both. Check usage of `ChildProcessPool` and `ProcessHost` below, simple and flexible.

#### II ) Install
-----
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

#### III ) Instruction 1: Service
-----
> working with MessageChannel, remember to check "Instruction 2".

##### 1. The arguments to create a service
The `service` process is a customized render process that works in the background, receiving `path`, `options` as arguments:

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

##### 2. Enable service auto reload after code changed
The `auto-reload` feature is based on nodejs - `fs.watch` api, When webSecurity closed and in `dev` mode, service will reload after the code of service changed.

1.Set dev mode in `new BrowserService()` options  
2.Set webSecurity closed
```js
/* --- main.js --- */
const myService = new BrowserService('app', 'path/to/app.service.js', {
  ...options,
  // set dev mode
  dev: true,
  // with webSecurity closed
  webPreferences: { webSecurity: false }
});

```

##### 3. The methods of a Service instance

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
  /* work with webContents method, also you can use MessageChannel below */
  mhyService.webContents.send('channel1', { value: 'test1' });
});
...
```

```js

/* --- app.service.js --- */
const { ipcRenderer } = require('electron');
/* work with ipc method, also you can use MessageChannel instead */
ipcRenderer.on('channel1', (event, result) => {
  // works
  ...
});
```

#### IV ) Instruction 2: MessageChannel
-----
> working with Service

When sending data from main/other process to a service you need to use `MesssageChannel`, such as: `MessageChannel.send('service-name', 'channel', 'params')`, And also it can be used to replace other build-in `ipc` methods, more flexible.

##### The methods of MessageChannel

1.Public methods，used in Main-process/Renderer-process/Service
```js
/* send data to a service - like the build-in ipcMain.send */
MessageChannel.send('service-name', channel, params);
/* send data to a service and return a Promise - extension method */
MessageChannel.invoke('service-name', channel, params);
/*
  send data to a renderer/servcie which id is same as the given windowId/webContentsId,
  same as ipcRenderer.sendTo,
  recommend to use it when we want to send data from main/service to a renderer window
*/
MessageChannel.sendTo('windowId/webContentsId', channel, params);
/* listen a channel, same as ipcMain.on/ipcRenderer.on */
MessageChannel.on(channel, func);
/* listen a channel once, same as ipcMain.once/ipcRenderer.once */
MessageChannel.once(channel, func);

```

2.Only used in Renderer-process/Service
```js
/* send data to main process - like the build-in ipcRender.send */
MessageChannel.send('main', channel, params);
/* send data to main process and return a Promise - extension method */
MessageChannel.invoke('main', channel, params);

```

3.Only used in Main-process/Service
```js
/*
  handle a channel signal, extension method,
  and you can return data directly or return a Promise instance
*/
MessageChannel.handle(channel, processorFunc);
```

##### A full usage

- 1）In main process
```js
const {
  BrowserService,
  // must required in main.js even if you don't use it
  MessageChannel 
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
    MessageChannel.invoke('app', 'channel2', { value: 'test1' }).then((response) => {
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

- 2）Send or receive data in a service named app
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

MessageChannel.send('app', 'channel4', { value: 'channel4' });


```
- 3）Send or receive data in a service named app2
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

- 3）Send or receive data in a renderer window

```js
const { ipcRenderer } = require('electron');
const { MessageChannel } = require('electron-re');

MessageChannel.send('app', 'channel1', { value: 'test1'});
MessageChannel.invoke('app2', 'channel3', { value: 'test2' });
MessageChannel.send('main', 'channel3', { value: 'test3' });
MessageChannel.invoke('main', 'channel4', { value: 'test4' });
```

#### V ) Instruction 3: ChildProcessPool
-----
> working with ProcessHost, remember to check "Instruction 4".

Multi-process helps to make full use of multi-core CPU, let's see some differences between multi-process and multi-thread:

1. It is difficult to share data between different processes, but threads can share memory.
2. Processes consume more computer resources than threads.
3. The processes will not affect each other, a thread hanging up will cause the whole process to hang up.

The `ChildProcessPool` is degisned for those nodejs applications with multi-process architecture. E.g. in the demo [file-slice-upload](https://github.com/nojsja/javascript-learning/tree/master/file-slice-upload), I use `ChildProcessPool` to manage thousands of uploading tasks and handle file reading and writing.

##### 1. Create a childprocess pool
* path - the absolute path to a js file
* max - the max count of instance created by pool
* env - env variable

```js
const { ChildProcessPool } = require('electron-re');

global.ipcUploadProcess = new ChildProcessPool({
  path: path.join(app.getAppPath(), 'app/services/child/upload.js'),
  max: 6,
  env: { lang: global.lang, NODE_ENV: nodeEnv }
});
```

##### 2. Send request to a process instance

* 1）params - `taskName`  
  A task registried with `ProcessHost`, it's neccessary.
* 2）params - `data`  
  The data passed to process, it's neccessary.
* 3）params - `id`  
  The unique id bound to a process instance(id will be automatically bound after call `send()`). Sometime you send request to a process with special data, then expect to get callback data from that, you can give a unique id in `send` function, each time pool will send a request to the process bound with this id. If you give an empty/undefined/null id, pool will select a process random.

```js
global.ipcUploadProcess.send(
  'init-works',
  {
    name: 'fileName',
    type: 'fileType',
    size: 'fileSize',
  },
  uploadId
)
.then((rsp) => {
  console.log(rsp);
});
```

##### 3. Send request to all process instances

* 1）params - `taskName`  
  A task registried with `ProcessHost`(check usage below), it's neccessary.
* 2）params - `data`  
  The data passed to process, it's neccessary.

```js
global.ipcUploadProcess.sendToAll(
  'record-get-all',
  { data: 'test' }
)
.then((rsp) => {
  console.log(rsp);
});
```

##### 4. Destroy the child processes of the process pool

- If you do not specify `id`, all child processes will be destroyed. Specifying the `id` parameter can separately destroy a child process bound to this `id` value.

- After the destruction, using the process pool to send a new request, a new child process will be created automatically.

- It should be noted that the `id` binding operation is automatically performed after the `processPool.send('task-name', params, id)` method is called.

```js
global.ipcUploadProcess.disconnect(id);
```
##### 5. processPool.setMaxInstanceLimit(number)

In addition to using the `max` parameter to specify the maximum number of child process instances created by the process pool, you can also call this method to dynamically set the number of child process instances that need to be created.

```js
global.ipcUploadProcess.setMaxInstanceLimit(number);
```

#### VI ) Instruction 4: ProcessHost
-----
> working with ChildProcessPool

In `Instruction 3`, We already know how to create a sub-process pool and send request using it. Now let's figure out how to registry a task and handle process messages in a sub process(created by ChildProcessPool constructor with param - `path`).

Using `ProcessHost` we will no longer pay attention to the message sending/receiving between main process and sub processes. Just declaring a task with a unique service-name and put your processing code into a function. And remember that if the code is async, return a Promise instance instead.

##### 1. Require it in a sub process
```js
const { ProcessHost } = require('electron-re');
```
##### 2. Registry a task with unique name
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

function AsyncWorks(params) {
  console.log(params);
  return fetch(url);
}
```

##### 3. Working with `ChildProcessPool`
```js

/* 1. send a request in main process */
global.ipcUploadProcess.send(
  'init-works',
  {
    name: 'fileName',
    type: 'fileType',
    size: 'fileSize',
  },
  uploadId
);

...

/* 2. handle this request in sub process */
...

```

##### 4. Unregistry a task with unique name(if necessary)
> Support chain call

```js
ProcessHost
  .unregistry('init-works')
  .unregistry('async-works')
  ...
```

#### VII ) Examples
-----

1. [electronux](https://github.com/nojsja/electronux) - A project of mine that uses `BroserService` and `MessageChannel` of electron-re.

3. [file-slice-upload](https://github.com/nojsja/javascript-learning/tree/master/file-slice-upload) - A demo about parallel upload of multiple files, it uses `ChildProcessPool` and `ProcessHost` of electron-re, based on Electron@9.3.5.

3. Also you can check the `index.dev.js` and `test` dir in root, there are some cases for a full usage.