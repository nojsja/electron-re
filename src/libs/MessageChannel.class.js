const { ipcRenderer, ipcMain, BrowserWindow } = require('electron');
const EventEmitter = require('events');

const { isRenderer, isMain, getRandomString } = require('./utils');
const EventCenter = require('./EventCenter.class');

/**
  * MessageChannel [消息对象]
  * 封装ipcRender的invoke/send/handle方法，
  * 使render进程和该render进程的host render进程(替代主进程)直接通信
  * @author nojsja
  * @param  {[Object]} ipcRender [渲染进程]
  * @return {[Object]} {invoke, send, handle} [ipcRender functions rewriten with ipcRenderer.sendTo]
  */
 class MessageChannel {
   constructor() {
    this.event = new EventEmitter();
   }
};

/**
  * MessageChannelRender [渲染进程消息对象]
  * @author nojsja
  * @param  {[type]} param [desc]
  * @return {[type]} param [desc]
  */
class MessageChannelRender extends MessageChannel {
  constructor() {
    super();
  }
  
  /**
    * invoke [在渲染进程中(service/window)向另外一个服务进程或主进程(service/main)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */
  invoke (name, channel, args) {
    const pid = getRandomString();
    ipcRenderer.send('process:catch-signal', {
      type: `ipcRenderer.invoke.[${name || '(none)'}].${channel}`,
      origin: 'ipcRenderer',
      method: 'on',
      target: name || '(none)',
      channel,
      data: args
    });

    if (name === 'main') return ipcRenderer.invoke(channel, args);

    return new Promise((resolve, reject) => {
      ipcRenderer.invoke('MessageChannel.getIdFromName', { name }).then(id => {
        if (!id) return reject(new Error(`MessageChannel: can not get the id of the window names ${name}`));
        ipcRenderer.sendTo(id, channel, Object.assign(args, { pid }));
        ipcRenderer.once(pid, function(event, rsp) {
          resolve(rsp);
        });
      });
    });
  }

  /**
    * handle [在渲染进程(service)中监听来自其它进程(main/service/window)的请求，将promiseFunc执行的结果返回]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} promiseFunc [此函数执行的结果会被发送到消息发送者]
    * @return {[Promise]} [回调]
    */
  handle(channel, promiseFunc) {
    if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');

    ipcRenderer.on(channel, (event, params) => {
      const { pid, isFromMain } = params;
      delete params[pid];
      let execResult;
      let data = null;

      try {
        execResult = promiseFunc(event, params);
      } catch (error) {
        console.log(error);
        execResult = error;
      }

      (   execResult instanceof Promise ?
          execResult :
          Promise.resolve(execResult)
      ).then((rsp) => {
        data = rsp;
        if (isFromMain) {
          ipcRenderer.send(pid, rsp);
        } else {
          ipcRenderer.sendTo(event.senderId, pid, rsp);
        }
      })
      .catch((error) => {
        ipcRenderer.sendTo(event.senderId, pid, {
          code: 600,
          error,
        });
      })
      .finally(() => {
        ipcRenderer.send('process:catch-signal', {
          type: `ipcRenderer.handle.${'(none)'}.${channel}`,
          origin: 'ipcRenderer',
          method: 'handle',
          target: '(none)',
          channel,
          data: data
        });
      });

    });
  }

  /**
    * send [在渲染进程中(service/window)向另外一个服务进程或主进程(service/main)发送异步请求，不可立即取得值，请配合on监听信号使用]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    */
  send(name, channel, args) {

    ipcRenderer.send('process:catch-signal', {
      type: `ipcRenderer.send.${name || '(none)'}.${channel}`,
      origin: 'ipcRenderer',
      method: 'send',
      target: name || '(none)',
      channel,
      data: args
    });

    if (name === 'main') return ipcRenderer.send(channel, args);
    ipcRenderer.invoke('MessageChannel.getIdFromName', { name }).then(id => {
      if (!id) return console.error(`MessageChannel: cant find a service named: ${name}!`)
      ipcRenderer.sendTo(id, channel, args);
    });
  }

  /**
    * send [在渲染进程中(service/window)向指定某个id的渲染进程窗口(service/window)发送请求，不可立即取得值，请配合on监听信号使用]
    * @param  {[String]} id [window id]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    */
  sendTo(id, channel, args) {
    ipcRenderer.send('process:catch-signal', {
      type: `ipcRenderer.sendTo.${id || '(none)'}.${channel}`,
      origin: 'ipcRenderer',
      method: 'sendTo',
      target: id || '(none)',
      channel,
      data: args
    });
    ipcRenderer.sendTo(id, channel, args)
  }

  /**
    * on [在渲染进程中(service/window)监听来自其它进程(service/window/main)的请求]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
    * @return {[Function]} [返回一个函数，调用此函数可以取消监听]
    */
  on(channel, func) {
    const listener = (event, ...args) => {
      ipcRenderer.send('process:catch-signal', {
        type: `ipcRenderer.on.${'(none)'}.${channel}`,
        origin: 'ipcRenderer',
        method: 'on',
        target: '(none)',
        channel,
        data: args
      });
      func(event, ...args);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.off(channel, listener);
    };
  }

  /**
    * on [在渲染进程中(service/window)监听一次来自其它进程(service/window/main)的请求]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.once]
    * @return {[Function]} [返回一个函数，调用此函数可以取消监听]
    */
  once(channel, func) {
    const listener = (event, ...args) => {
      ipcRenderer.send('process:catch-signal', {
        type: `ipcRenderer.once.${'(none)'}.${channel}`,
        origin: 'ipcRenderer',
        method: 'once',
        target: '(none)',
        channel,
        data: args
      });
      func(event, ...args);
    };

    ipcRenderer.once(channel, listener);

    return () => {
      ipcRenderer.off(channel, listener);
    };
  }

  /**
     * registry [注册BrowserWindow和BrowserService]
     * @param  {[String]} name [唯一的名字]
     * @param  {[String]} id [window id]
     * @param  {[String]} pid [process id]
     */
  registry(name, id, pid) {
    if (name === 'main')
      throw new Error(`MessageChannel: you can not registry a service named:${name}, it's reserved for the main process!`);
    return ipcRenderer.invoke('MessageChannel.registryService', { name, id, pid });
  }

}

/**
  * MessageChannelMain [主进程消息对象]
  * @author nojsja
  * @param  {[type]} param [desc]
  * @return {[type]} param [desc]
  */
class MessageChannelMain extends MessageChannel {
  constructor() {
    super();
    this.services = {};
    /* 根据name获取window id */
    ipcMain.handle('MessageChannel.getIdFromName', (e, args) => {
      return (this.services[args.name] || {}).id;
    });
    /* 使用name和window id注册一个服务 */
    ipcMain.handle('MessageChannel.registryService', (e, args) => {
      const { name, id } = args;
      this.registry(name, id);
      return this.services[name];
    });
    /* new service listen */
    this.event.on('registry', ({ pid, id }) => {
      const win = BrowserWindow.fromId(id);
      if (win && pid) {
        EventCenter.emit('process-manager:listen', pid, 'service', win.webContents.getURL());
      }
    });
    this.event.on('unregistry', ({ pid }) => {
      EventCenter.emit('process-manager:unlisten', pid);
    });
  }

  /**
    * invoke [在主进程(main)中向另外一个服务进程(service)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */
  invoke (name, channel, args={}) {
    const pid = getRandomString();
    const { id } = this.services[name];

    ipcMain.emit('process:catch-signal', {
      type: `ipcMain.invoke.${name}.${channel}`,
      origin: 'ipcMain',
      method: 'invoke',
      target: name,
      channel,
      data: args
    });

    return new Promise((resolve, reject) => {
      if (name === 'main') reject(new Error(`MessageChannel: the main process can not send a message to itself!`))
      if (!id) reject(new Error(`MessageChannel: can not get the id of the window names ${name}`));
      const win = BrowserWindow.fromId(id);
      if (!win) reject(new Error(`MessageChannel: can not find a window with id: ${id}`));
      win.webContents.send(channel, Object.assign(args, { pid, isFromMain: true }));
      ipcMain.once(pid, function(event, rsp) {
        resolve(rsp);
      });

    });
  }

  /**
    * handle [在主进程中(main)监听来自其它渲染进程(service/window)的请求，将promiseFunc执行的结果返回]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} promiseFunc [此函数执行的结果会被发送到消息发送者]
    * @return {[Promise]} [回调]
    */
  handle(channel, promiseFunc) {
    if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');
    ipcMain.handle(channel, (event, ...args) => {
      return promiseFunc(event, ...args).then((result) => {
        ipcMain.emit('process:catch-signal', {
          type: `ipcMain.handle.${'(none)'}.${channel}`,
          origin: 'ipcMain',
          method: 'handle',
          target: '(none)',
          channel,
          data: result
        });
        return result;
      });
    });
  }

  /**
    * handle [在主进程中(main)监听一次来自其它渲染进程(service/window)的请求，将promiseFunc执行的结果返回]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} promiseFunc [此函数执行的结果会被发送到消息发送者]
    * @return {[Promise]} [回调]
    */
  handleOnce(channel, promiseFunc) {
    if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');
    ipcMain.handleOnce(channel, (event, ...args) => {
      return promiseFunc(event, ...args).then(result => {
        ipcMain.emit('process:catch-signal', {
          type: `ipcMain.handleOnce.${'(none)'}.${channel}`,
          origin: 'ipcMain',
          method: 'handleOnce',
          target: '(none)',
          channel,
          data: result
        });
        return result;
      });
    });
  }

  /**
    * send [在主进程(main)向另外一个服务进程(service)发送异步请求，不可立即取得值，请配合on监听信号使用]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    */
  send(name, channel, args={}) {
    const id = (this.services[name] || {}).id;
    
    ipcMain.emit('process:catch-signal', {
      type: `ipcMain.send.${name}.${channel}`,
      origin: 'ipcMain',
      method: 'send',
      target: name,
      channel,
      data: args
    });

    if (!id) throw new Error(`MessageChannel: can not get the id of the window names ${name}`);
    const win = BrowserWindow.fromId(id);
    if (!win) throw new Error(`MessageChannel: can not find a window with id: ${id}`);

    win.webContents.send(channel, args);
  }

  /**
    * send [在主进程中(main)向指定某个id的渲染进程窗口(service/window)发送请求，不可立即取得值，请配合on监听信号使用]
    * @param  {[String]} id [window id]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    */
  sendTo(id, channel, args) {
    ipcMain.emit('process:catch-signal', {
      type: `ipcMain.sendTo.${id}.${channel}`,
      origin: 'ipcMain',
      method: 'sendTo',
      target: id,
      channel,
      data: args
    });
    if (!BrowserWindow.fromId(id)) throw new Error(`MessageChannel: can not find a window with id:${id}!`);
    BrowserWindow.fromId(id).webContents.send(channel, args);
  }

  /**
    * on [在主进程中(main)监听来自其它渲染进程(service/window)的请求]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
    * @return {[Function]} [返回一个函数，调用此函数可以取消监听]
    */
  on(channel, func) {
    if (!func instanceof Function) throw new Error('MessageChannel: func must be a function!');
    const listener = (event, ...args) => {
      ipcMain.emit('process:catch-signal', {
        type: `ipcMain.on.${'(none)'}.${channel}`,
        origin: 'ipcMain',
        method: 'on',
        target: '(none)',
        channel,
        data: args
      });
      func(event, ...args);
    };
    ipcMain.on(channel, listener);

    return () => {
      ipcMain.off(channel, listener);
    };
  }

  /**
    * once [在主进程中(main)监听一次来自其它渲染进程(service/window)的请求]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
    * @return {[Function]} [返回一个函数，调用此函数可以取消监听]
    */
  once(channel, func) {
    if (!func instanceof Function) throw new Error('MessageChannel: func must be a function!');
    const listener = (event, ...args) => {
      ipcMain.emit('process:catch-signal', {
        type: `ipcMain.once.${'(none)'}.${channel}`,
        origin: 'ipcMain',
        method: 'once',
        target: '(none)',
        channel,
        data: args
      });
      func(event, ...args);
    };
    ipcMain.once(channel, listener);

    return () => {
      ipcMain.off(channel, listener);
    };
  }

  /**
     * registry [注册BrowserWindow和BrowserService]
     * @param  {[String]} name [唯一的名字]
     * @param  {[String]} id [window id]
     * @param  {[String]} pid [process id]
     */
  registry(name, id, pid) {
    if (name === 'main') throw new Error(`MessageChannel: you can not registry a service named:${name}, it's reserved for the main process!`)
    if (this.services[name]) console.warn(`MessageChannel: the service - ${name} has been registeried!`)
    this.services[name] = { name, id, pid };
    this.event.emit('registry', this.services[name]);
  }

  /**
     * unregistry [注册BrowserWindow和BrowserService]
     * @param  {[String]} name [唯一的名字]
     * @param  {[String]} id [window id]
     * @param  {[String]} pid [process id]
     */
    unregistry(name) {
      if (name === 'main') throw new Error(`MessageChannel: you can not unregistry a service named:${name}, it's reserved for the main process!`);
      if (this.services[name]) console.warn(`MessageChannel: the service - ${name} will be unregisteried!`);
      if (this.services[name]) {
        this.event.emit('unregistry', this.services[name]);
        delete this.services[name];
      } else {
        console.warn(`MessageChannel: unregistry -> the service - ${name} is not found!`);
      }
    }
}


if (!('electronre:$globalMessage' in global)) {
  Object.defineProperty(
    global,
    "electronre:$globalMessage", {
      value: isMain ?
        new MessageChannelMain() :
        (isRenderer ? new MessageChannelRender() : null),
      writable: false,
      configurable: false,
      enumerable: true
  });
}

module.exports = global['electronre:$globalMessage'];