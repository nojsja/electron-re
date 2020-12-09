'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* depends */
var _require = require('electron'),
    ipcRenderer = _require.ipcRenderer,
    remote = _require.remote,
    ipcMain = _require.ipcMain,
    BrowserWindow = _require.BrowserWindow;

var _require2 = require('./utils'),
    isRenderer = _require2.isRenderer,
    isMain = _require2.isMain,
    getRandomString = _require2.getRandomString;

/**
  * MessageChannel [消息对象]
  * 封装ipcRender的invoke/send/handle方法，
  * 使render进程和该render进程的host render进程(替代主进程)直接通信
  * @author nojsja
  * @param  {[Object]} ipcRender [渲染进程]
  * @return {[Object]} {invoke, send, handle} [ipcRender functions rewriten with ipcRenderer.sendTo]
  */


var MessageChannel = function MessageChannel() {
  _classCallCheck(this, MessageChannel);
};

;

/**
  * MessageChannelRender [渲染进程消息对象]
  * @author nojsja
  * @param  {[type]} param [desc]
  * @return {[type]} param [desc]
  */

var MessageChannelRender = function (_MessageChannel) {
  _inherits(MessageChannelRender, _MessageChannel);

  function MessageChannelRender() {
    _classCallCheck(this, MessageChannelRender);

    return _possibleConstructorReturn(this, (MessageChannelRender.__proto__ || Object.getPrototypeOf(MessageChannelRender)).call(this));
  }

  /**
    * invoke [在渲染进程中(service/window)向另外一个服务进程或主进程(service/main)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */


  _createClass(MessageChannelRender, [{
    key: 'invoke',
    value: function invoke(name, channel, args) {
      var pid = getRandomString();

      if (name === 'main') return ipcRenderer.invoke(channel, args);

      return new Promise(function (resolve, reject) {
        ipcRenderer.invoke('MessageChannel.getIdFromName', { name: name }).then(function (id) {
          if (!id) return reject(new Error('MessageChannel: can not get the id of the window names ' + name));
          ipcRenderer.sendTo(id, channel, Object.assign(args, { pid: pid }));
          ipcRenderer.once(pid, function (event, rsp) {
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

  }, {
    key: 'handle',
    value: function handle(channel, promiseFunc) {
      if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');

      ipcRenderer.on(channel, function (event, params) {
        var pid = params.pid,
            isFromMain = params.isFromMain;

        delete params[pid];
        var execResult = void 0;

        try {
          execResult = promiseFunc(event, params);
        } catch (error) {
          console.log(error);
          execResult = error;
        }

        (execResult instanceof Promise ? execResult : Promise.resolve(execResult)).then(function (rsp) {
          if (isFromMain) {
            ipcRenderer.send(pid, rsp);
          } else {
            ipcRenderer.sendTo(event.senderId, pid, rsp);
          }
        }).catch(function (error) {
          ipcRenderer.sendTo(event.senderId, pid, {
            code: 600,
            error: error
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

  }, {
    key: 'send',
    value: function send(name, channel, args) {
      if (name === 'main') return ipcRenderer.send(channel, args);
      ipcRenderer.invoke('MessageChannel.getIdFromName', { name: name }).then(function (id) {
        if (!id) return console.error('MessageChannel: cant find a service named: ' + name + '!');
        ipcRenderer.sendTo(id, channel, args);
      });
    }

    /**
      * send [在渲染进程中(service/window)向指定某个id的渲染进程窗口(service/window)发送请求，不可立即取得值，请配合on监听信号使用]
      * @param  {[String]} id [window id]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
      */

  }, {
    key: 'sendTo',
    value: function sendTo(id, channel, args) {
      ipcRenderer.sendTo(id, channel, args);
    }

    /**
      * on [在渲染进程中(service/window)监听来自其它进程(service/window/main)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: 'on',
    value: function on(channel, func) {
      ipcRenderer.on(channel, func);
    }

    /**
      * on [在渲染进程中(service/window)监听一次来自其它进程(service/window/main)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: 'once',
    value: function once(channel, func) {
      ipcRenderer.once(channel, func);
    }

    /**
       * registry [注册BrowserWindow和BrowserService]
       * @param  {[String]} name [唯一的名字]
       * @param  {[String]} type [类型window/service]
       * @param  {[String]} id [window id]
       */

  }, {
    key: 'registry',
    value: function registry(name, id, windowElem) {
      if (name === 'main') throw new Error('MessageChannel: you can not registry a service named:' + name + ', it\'s reserved for the main process!');
      return ipcRenderer.invoke('MessageChannel.registryService', { name: name, id: id, win: windowElem });
    }
  }]);

  return MessageChannelRender;
}(MessageChannel);

/**
  * MessageChannelMain [主进程消息对象]
  * @author nojsja
  * @param  {[type]} param [desc]
  * @return {[type]} param [desc]
  */


var MessageChannelMain = function (_MessageChannel2) {
  _inherits(MessageChannelMain, _MessageChannel2);

  function MessageChannelMain() {
    _classCallCheck(this, MessageChannelMain);

    var _this2 = _possibleConstructorReturn(this, (MessageChannelMain.__proto__ || Object.getPrototypeOf(MessageChannelMain)).call(this));

    _this2.services = {};
    /* 根据name获取window id */
    ipcMain.handle('MessageChannel.getIdFromName', function (e, args) {
      return _this2.services[args.name];
    });
    /* 使用name和window id注册一个服务 */
    ipcMain.handle('MessageChannel.registryService', function (e, args) {
      var name = args.name,
          id = args.id;

      _this2.registry(name, id);
      return _this2.services[name];
    });
    return _this2;
  }

  /**
    * invoke [在主进程(main)中向另外一个服务进程(service)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */


  _createClass(MessageChannelMain, [{
    key: 'invoke',
    value: function invoke(name, channel) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var pid = getRandomString();
      var id = this.services[name];

      return new Promise(function (resolve, reject) {
        if (name === 'main') reject(new Error('MessageChannel: the main process can not send a message to itself!'));
        if (!id) reject(new Error('MessageChannel: can not get the id of the window names ' + name));
        var win = BrowserWindow.fromId(id);
        if (!win) reject(new Error('MessageChannel: can not find a window with id: ' + id));
        win.webContents.send(channel, Object.assign(args, { pid: pid, isFromMain: true }));
        ipcMain.once(pid, function (event, rsp) {
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

  }, {
    key: 'handle',
    value: function handle(channel, promiseFunc) {
      if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');
      ipcMain.handle(channel, promiseFunc);
    }

    /**
      * handle [在主进程中(main)监听一次来自其它渲染进程(service/window)的请求，将promiseFunc执行的结果返回]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} promiseFunc [此函数执行的结果会被发送到消息发送者]
      * @return {[Promise]} [回调]
      */

  }, {
    key: 'handleOnce',
    value: function handleOnce(channel, promiseFunc) {
      if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');
      ipcMain.handleOnce(channel, promiseFunc);
    }

    /**
      * send [在主进程(main)向另外一个服务进程(service)发送异步请求，不可立即取得值，请配合on监听信号使用]
      * @param  {[String]} name [服务名]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
      */

  }, {
    key: 'send',
    value: function send(name, channel) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var id = this.services[name];

      if (!id) throw new Error('MessageChannel: can not get the id of the window names ' + name);
      var win = BrowserWindow.fromId(id);
      if (!win) throw new Error('MessageChannel: can not find a window with id: ' + id);

      win.webContents.send(channel, args);
    }

    /**
      * send [在主进程中(main)向指定某个id的渲染进程窗口(service/window)发送请求，不可立即取得值，请配合on监听信号使用]
      * @param  {[String]} id [window id]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
      */

  }, {
    key: 'sendTo',
    value: function sendTo(id, channel, args) {
      if (!BrowserWindow.fromId(id)) throw new Error('MessageChannel: can not find a window with id:' + id + '!');
      BrowserWindow.fromId(id).webContents.send(channel, args);
    }

    /**
      * on [在主进程中(main)监听来自其它渲染进程(service/window)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: 'on',
    value: function on(channel, func) {
      if (!func instanceof Function) throw new Error('MessageChannel: func must be a function!');
      ipcMain.on(channel, func);
    }

    /**
      * once [在主进程中(main)监听一次来自其它渲染进程(service/window)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: 'once',
    value: function once(channel, func) {
      if (!func instanceof Function) throw new Error('MessageChannel: func must be a function!');
      ipcMain.once(channel, func);
    }

    /**
       * registry [注册BrowserWindow和BrowserService]
       * @param  {[String]} name [唯一的名字]
       * @param  {[String]} id [window id]
       * @param  {[BrowserWIndow]} win [window实例]
       */

  }, {
    key: 'registry',
    value: function registry(name, id, win) {
      if (name === 'main') throw new Error('MessageChannel: you can not registry a service named:' + name + ', it\'s reserved for the main process!');
      if (this.services[name]) console.warn('MessageChannel: the service - ' + name + ' has been registeried!');
      // if (!BrowserWindow.fromId(id)) throw new Error(`MessageChannelMain: can not find a window with id: ${id}`);
      this.services[name] = id;
    }
  }]);

  return MessageChannelMain;
}(MessageChannel);

if (isMain) {
  global['globalMessage'] = global['globalMessage'] || new MessageChannelMain();
}

if (isRenderer) {
  global['globalMessage'] = global['globalMessage'] || new MessageChannelRender();
}

module.exports = global['globalMessage'];