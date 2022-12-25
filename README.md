[![GitHub license](https://img.shields.io/github/license/nojsja/electron-re)](https://github.com/nojsja/electron-re/blob/master/LICENSE.md)
[![GitHub issues](https://img.shields.io/github/issues/nojsja/electron-re)](https://github.com/nojsja/electron-re/issues)
[![GitHub stars](https://img.shields.io/github/stars/nojsja/electron-re)](https://github.com/nojsja/electron-re/stargazers)

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
├── * Instruction6: WorkerThreadPool
│   ├── Create a static WorkerThreadPool pool
│   ├── Create a static WorkerThreadPool excutor
│   ├── Create a dynamic WorkerThreadPool pool
│   └── Create a dynamic WorkerThreadPool excutor
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

### VIII. WorkerThreadPool
-----

Multi Processes help to make full use of cpu, Multi Threads improve task parallelism ability of Node.js.

In Node.js, there is only one main process which has single main thread, the main thread run event loops and executes macro/micro tasks. In theory, macro/micro task should be short and quick, if we use main thread for some cpu-sensitive heavy tasks, this will block event loop on main thread.

So, try to put your heavy tasks into worker threads will be better in Node.js. The worker thread pool is effective for creating and managing threads, besides, it provides a task queue. When pool has no idle thread, more coming tasks are placed in queue and be taken out from queue after while to be excuted by new idle thread.

#### Create a static WorkerThreadPool pool

1. Options of StaticThreadPool:

- `constructor(options, threadOptions)`
- @param {_Object_} `opitons`: the options to create a static thread pool:
  - One of follow params is required and unique:
    - `execPath` {_String_}: path to an executable commonjs module file.
    - `execString` {_String_}: executable code string.
    - `execFunction` {_Function_}: js function.
  - `lazyLoad` {_Boolean_}: if diabled, all threads will be created when init pool.
  - `maxThreads` {_Number_}: max thread count of pool.
  - `maxTasks` {_Number_}: max task count of pool.
  - `taskRetry` {_Number_}: number of task retries.
  - `taskLoopTime` {_Number_}: time of task loop.
  - `taskTimeout` {_Number_}: timeout time.
- @param {_Object_} `threadOpitions`: Some origin options for node.js worker_threads.
  - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.

```js
const uint8Array = new Uint8Array([ 1, 2, 3, 4 ]);
const staticPool = new StaticThreadPool(
  {
    // execPath: 'path/to/executable.js',
    execString: 'module.exports = (payload) => `res:${payload}`',
    // execFunction: (payload) => payload,
    lazyLoad: true,
    maxThreads: 24,
    maxTasks: 48,
    taskRetry: 1,
    taskLoopTime: 1e3,
    taskTimeout: 5e3,
  },
  {
    transferList: [uint8Array.buffer]
  }
);
```

2. Attributes of a StaticThreadPool instance

- `isFull` {_Boolean_}: whether the pool is full of threads, related to this param - maxThreads.
- `threadLength` {_Number_}: current thread count of pool.
- `taskLength` {_Number_}: current task count of pool.

3. Methods of a StaticThreadPool instance

- `fillPoolWithIdleThreads()`: fill pool with idle threads, this is effective when pool is not full.
- `queue(payload, options)`: Save a task request to task queue, will throw an error when the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
  - @param {_Object_} `options`: Options to create a task:
    - @param {_Number_} `taskTimeout`：The task timeout in milliseconds
    - @param {_Number_} `taskRetry`：Number of task retries.
    - @param {_Array_} `transferList`: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `exec(payload, options)`: Send a task request to pool, will throw an error when there is no idle thread and the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
  - @param {_Object_} `options`: Options to create a task:
    - @param {_Number_} `taskTimeout`：The task timeout in milliseconds
    - @param {_Number_} `taskRetry`：Number of task retries.
    - @param {_Array_} `transferList`: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `createExecutor(options={})`: Create an static executor to execute tasks.
  - @param {_Object_} `options`: Options to create a executor:
    - @param {_Number_} `taskTimeout`：The task timeout in milliseconds
    - @param {_Number_} `taskRetry`：Number of task retries.
    - @param {_Array_} `transferList`: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `wipeTaskQueue()`: Wipe all tasks in queue.
- `wipeThreadPool()`: Wipe all threads in pool.
- `setMaxThreads(maxThreads)`: Set max thread count of pool.
  - @param {_Number_} `maxThreads`：max thread count.
- `setMaxTasks(maxTasks)`: Set max task count of pool.
  - @param {_Number_} `maxTasks`：max task count.
- `setTaskLoopTime(taskLoopTime)`: Set time of task loop.
  - @param {_Number_} `taskLoopTime`：task loop time.
- `setTaskRetry(taskRetry)`: Set count of task retries.
  - @param {_Number_} `taskRetry`：Number of task retries.
- `setTransferList(transferList)`: Set transfer-list data of task.
  - @param {_Array_} `transferList`：transfer-list data.

```js
staticPool
  .setTaskRetry(1)
  .exec('payload-data', {
    taskTimeout: 5e3,
    taskRetry: 1,
  })
  .then((rsp) => {
    console.log(rsp);
  });
```

#### Create a static WorkerThreadPool excutor

1. Options of StaticThreadPool Executor

- @params {_Object_} options
  - `taskRetry` {_Number_}: number of task retries.
  - `taskTimeout` {_Number_}: timeout time.
  - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.

```js
const uint8Array = new Uint8Array([ 1, 2, 3, 4 ]);
const staticExecutor = staticPool.createExecutor({
  taskRetry: 2,
  taskTimeout: 2e3,
  transferList: [unit8Array.buffer]
});
```

2. Methods of a StaticThreadPool Executor

- `queue(payload, options)`: Save a task request to task queue, will throw an error when the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
- `exec(payload)`: Send a task request to pool from excutor.
  - @param {_Any_} `payload` __*__: The request payload data.
- `setTaskRetry(taskRetry)`: Set count of task retries.
  - @param {_Number_} `taskRetry`：Number of task retries.
- `setTransferList(transferList)`: Set transfer-list data of task.
  - @param {_Array_} `transferList`：transfer-list data.
- `setTaskTimeout(taskTimeout)`: Set timeout time of task.
  - @param {_Number_} `taskTimeout`：timeout time.

```js
staticExecutor
  .setTaskRetry(2)
  .exec('test')
  .then((rsp) => {
    console.log(rsp);
  });
```

#### Create a dynamic WorkerThreadPool pool

1. Options of DynamicThreadPool:

- `constructor(options, threadOptions)`
- @param {_Object_} `opitions`: the options to create a static thread pool:
  - `maxThreads` {_Number_}: max thread count of pool.
  - `maxTasks` {_Number_}: max task count of pool.
  - `taskRetry` {_Number_}: number of task retries.
  - `taskLoopTime` {_Number_}: time of task loop.
  - `taskTimeout` {_Number_}: timeout time.
- @param {_Object_} `threadOptions`: Some origin options for node.js worker_threads.
  - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.

```js
const dynamicPool = new DynamicThreadPool({
  maxThreads: 24,
  maxTasks: 48,
  taskRetry: 1,
  taskLoopTime: 1e3,
  taskTimeout: 5e3,
});
```

2. Attributes of a DynamicThreadPool instance

- `isFull` {_Boolean_}: whether the pool is full of threads, related to this param - maxThreads.
- `threadLength` {_Number_}: current thread count of pool.
- `taskLength` {_Number_}: current task count of pool.

3. Methods of a DynamicThreadPool instance

- `queue(payload, options)`: Save a task request to task queue, will throw an error when the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
  - @param {_Object_} `options`: Options to create a task:
    - One of follow params is optional and unique:
      - `execPath` {_String_}: path to an executable commonjs module file.
      - `execString` {_String_}: executable code string.
      - `execFunction` {_Function_}: js function.
    - @param {_Number_} `taskTimeout`：The task timeout in milliseconds
    - @param {_Number_} `taskRetry`：Number of task retries.
    - @param {_Array_} `transferList`: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `exec(payload, options)`: Send a task request to pool, will throw an error when there is no idle thread and the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
  - @param {_Object_} `options`: Options to create a task:
    - One of follow params is optional and unique:
      - `execPath` {_String_}: path to an executable commonjs module file.
      - `execString` {_String_}: executable code string.
      - `execFunction` {_Function_}: js function.
    - `taskTimeout` {_Number_}：The task timeout in milliseconds
    - `taskRetry` {_Number_}：Number of task retries.
    - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `createExecutor(options={})`: Create a dynamic executor to execute tasks.
  - @param {_Object_} `options`: Options to create a executor:
    - One of follow params is optional and unique:
      - `execPath` {_String_}: path to an executable commonjs module file.
      - `execString` {_String_}: executable code string.
      - `execFunction` {_Function_}: js function.
    - `taskTimeout` {_Number_}：The task timeout in milliseconds
    - `taskRetry` {_Number_}：Number of task retries.
    - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.
- `wipeTaskQueue()`: Wipe all tasks in queue.
- `wipeThreadPool()`: Wipe all threads in pool.
- `setMaxThreads(maxThreads)`: Set max thread count of pool.
  - @param {_Number_} `maxThreads`：max thread count.
- `setMaxTasks(maxTasks)`: Set max task count of pool.
  - @param {_Number_} `maxTasks`：max task count.
- `setTaskLoopTime(taskLoopTime)`: Set time of task loop.
  - @param {_Number_} `taskLoopTime`：task loop time.
- `setTaskRetry(taskRetry)`: Set count of task retries.
  - @param {_Number_} `taskRetry`：Number of task retries.
- `setTransferList(transferList)`: Set transfer-list data of task.
  - @param {_Array_} `transferList`：transfer-list data.
- `setExecPath(execPath)`: Set path of an executable commonjs module file.
  - @param {_String_} `execPath`：path to an executable commonjs module file.
- `setExecString(execString)`: Set executable code string.
  - @param {_String_} `execString`：executable code string.
- `setExecFunction(execFunction)`: Set js function.
  - @param {_Function_} `execFunction`：js function.

```js
dynamicPool
  .setExecString(`module.exports = (payload) => console.log(payload);`)
  .setTaskRetry(1)
  .exec('payload-data', {
    taskTimeout: 5e3,
    taskRetry: 1,
  })
  .then((rsp) => {
    console.log(rsp);
  });
```

#### Create a dynamic WorkerThreadPool excutor

1. Options of DynamicThreadPool Executor

- @params {_Object_} options
  - One of follow params is optional and unique:
    - `execPath` {_String_}: path to an executable commonjs module file.
    - `execString` {_String_}: executable code string.
    - `execFunction` {_Function_}: js function.
  - `taskRetry` {_Number_}: number of task retries.
  - `taskTimeout` {_Number_}: timeout time.
  - `transferList` {_Array_}: A list of ArrayBuffer, MessagePort and FileHandle objects. After transferring, they will not be usable on the sending side.

```js
const uint8Array = new Uint8Array([ 1, 2, 3, 4 ]);
const dynamicExecutor = dynamicPool.createExecutor({
  execString: `module.exports = (payload) => payload`,
  // execFunction: (payload) => payload,
  // execPath: 'path/to/executable.js',
  taskRetry: 2,
  taskTimeout: 2e3,
  transferList: [unit8Array.buffer]
});
```

2. Methods of a DynamicThreadPool Executor

- `setExecPath(execPath)`: Set path of an executable commonjs module file.
    - @param {_String_} `execPath`：path to an executable commonjs module file.
- `setExecString(execString)`: Set executable code string.
    - @param {_String_} `execString`：executable code string.
- `setExecFunction(execFunction)`: Set js function.
    - @param {_Function_} `execFunction`：js function.
- `queue(payload)`: Save a task request to task queue, will throw an error when the task queue is full.
  - @param {_Any_} `payload` __*__: The request payload data.
- `exec(payload)`: Send a task request to pool from excutor.
  - @param {_Any_} `payload` __*__: The request payload data.
- `setTaskRetry(taskRetry)`: Set count of task retries.
    - @param {_Number_} `taskRetry`：Number of task retries.
- `setTransferList(transferList)`: Set transfer-list data of task.
    - @param {_Array_} `transferList`：transfer-list data.
- `setExecPath(execPath)`: Set path of an executable commonjs module file.

### IX. Examples
-----

1. [electronux](https://github.com/nojsja/electronux) - A project of mine that uses `BroserService` and `MessageChannel` of electron-re.

2. [file-slice-upload](https://github.com/nojsja/javascript-learning/tree/master/file-slice-upload) - A demo about parallel upload of multiple files, it uses `ChildProcessPool` and `ProcessHost` of electron-re, based on Electron@9.3.5.

3. Also you can check the `index.dev.js` and `test` dir in root, there are some useful cases.

### X. Test Coverage

```bash
------------------------------------|---------|----------|---------|---------|---------------------------------------------------------------------------------------------
File                                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                           
------------------------------------|---------|----------|---------|---------|---------------------------------------------------------------------------------------------
All files                           |   75.27 |    55.73 |   68.15 |   79.29 |                                                                                             
 lib                                |   96.42 |    66.66 |     100 |   96.42 |                                                                                             
  index.js                          |   96.42 |    66.66 |     100 |   96.42 | 23                                                                                          
 lib/libs                           |   66.83 |    44.61 |   59.12 |   72.59 |                                                                                             
  BrowserService.class.js           |   76.99 |    55.26 |   55.17 |   77.22 | 61-64,69-92,106-108,172,184-185,191,209-210,231,235                                         
  EventCenter.class.js              |      80 |    58.33 |   83.33 |     100 | 15-35                                                                                       
  FileWatcher.class.js              |      60 |    41.66 |   42.85 |   66.66 | 29-49                                                                                       
  MessageChannel.class.js           |   52.11 |    32.35 |    46.8 |   58.49 | 60-61,75-256,292-297,312-313,394-409,540-547                                                
  ProcessHost.class.js              |   70.73 |    35.71 |    62.5 |   76.31 | 27,51-59,80,92-108                                                                          
  ProcessLifeCycle.class.js         |   88.46 |    67.64 |   94.11 |   98.36 | 95                                                                                          
  consts.js                         |     100 |      100 |     100 |     100 |                                                                                             
  utils.js                          |   65.16 |    45.83 |      60 |   68.67 | 75-93,107-114,120-131,180,188                                                               
 lib/libs/ChildProcessPool          |   84.84 |       62 |      80 |   89.91 |                                                                                             
  ForkedProcess.js                  |   78.33 |       50 |   72.72 |   82.45 | 22,64-75,97,103-105                                                                         
  index.js                          |   86.76 |    65.78 |   82.35 |   92.39 | 119,141,219-223,231-233,287,306-315                                                         
 lib/libs/LoadBalancer              |   80.29 |       50 |   84.37 |   80.91 |                                                                                             
  consts.js                         |     100 |      100 |     100 |     100 |                                                                                             
  index.js                          |   77.58 |       50 |   82.14 |   78.18 | 63-69,83,97,103,113,126,153,158-162,178-193,203                                             
  scheduler.js                      |      95 |       50 |     100 |      95 | 28                                                                                          
 lib/libs/LoadBalancer/algorithm    |   94.79 |     67.3 |     100 |     100 |                                                                                             
  MINIMUM_CONNECTION.js             |    92.3 |    64.28 |     100 |     100 | 5-6,19                                                                                      
  POLLING.js                        |   85.71 |       50 |     100 |     100 | 5-9                                                                                         
  RANDOM.js                         |     100 |       50 |     100 |     100 | 7                                                                                           
  SPECIFY.js                        |     100 |       75 |     100 |     100 | 14                                                                                          
  WEIGHTS.js                        |   92.85 |    66.66 |     100 |     100 | 5-11                                                                                        
  WEIGHTS_MINIMUM_CONNECTION.js     |   94.11 |       80 |     100 |     100 | 5,15                                                                                        
  WEIGHTS_POLLING.js                |    92.3 |    66.66 |     100 |     100 | 5-10                                                                                        
  WEIGHTS_RANDOM.js                 |     100 |    66.66 |     100 |     100 | 9,17                                                                                        
  index.js                          |     100 |      100 |     100 |     100 |                                                                                             
 lib/libs/ProcessManager            |   51.08 |       25 |   38.46 |   51.77 |                                                                                             
  index.js                          |   57.21 |    31.39 |      48 |    58.6 | 66,71,76,81,110,123,132,143,150-169,175-224,228-230,236-245,285-287,295-298,303-306,311-336 
  ui.js                             |   32.35 |        0 |    6.66 |   32.83 | 34-122,130-137                                                                              
 lib/libs/WorkerThreadPool          |   81.52 |     57.5 |      78 |   84.72 |                                                                                             
  Task.js                           |   85.36 |    83.33 |   61.53 |   85.36 | 44-45,77-92                                                                                 
  TaskQueue.js                      |   66.19 |    39.28 |   86.66 |   69.23 | 78-79,98-139                                                                                
  Thread.js                         |      85 |     64.7 |      80 |   91.78 | 61-63,150-156,165                                                                           
  consts.js                         |     100 |      100 |     100 |     100 |                                                                                             
  index.js                          |     100 |      100 |     100 |     100 |                                                                                             
  utils.js                          |   91.66 |       50 |     100 |   91.66 | 23                                                                                          
 lib/libs/WorkerThreadPool/Executor |   81.53 |     67.5 |   80.76 |   89.79 |                                                                                             
  DynamicExecutor.js                |   76.66 |    71.42 |      75 |   84.09 | 50-53,66-67,97                                                                              
  Executor.js                       |   93.75 |    66.66 |     100 |   93.75 | 70,74                                                                                       
  StaticExecutor.js                 |   78.94 |       60 |      75 |   95.45 | 39                                                                                          
 lib/libs/WorkerThreadPool/Pool     |   83.37 |    72.41 |   81.01 |   87.95 |                                                                                             
  DynamicThreadPool.js              |    82.5 |    66.12 |   76.47 |   90.56 | 87-89,129,141                                                                               
  StaticThreadPool.js               |   87.69 |    70.83 |   92.85 |   97.95 | 144                                                                                         
  ThreadPool.js                     |   82.57 |    75.49 |   79.16 |   85.21 | 116-118,144-145,165,213-214,224,256-258,356,494-533,564,568,572,576,587                     
 lib/libs/WorkerThreadPool/Worker   |   77.35 |       60 |    62.5 |   81.01 |                                                                                             
  index.js                          |   84.28 |    67.85 |   76.47 |   95.34 | 49,73                                                                                       
  worker-runner.js                  |   63.88 |    41.66 |   28.57 |   63.88 | 19-22,32,36-42,54-59,65,76                                                                  
 lib/tasks                          |   83.33 |       50 |     100 |   88.23 |                                                                                             
  app.init.js                       |   83.33 |       50 |     100 |   88.23 | 33-39                                                                                       
------------------------------------|---------|----------|---------|---------|---------------------------------------------------------------------------------------------
```