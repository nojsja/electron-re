"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

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

var EventEmitter = require('events');
/**
  * MessageChannel [消息对象]
  * 封装ipcRender的invoke/send/handle方法，
  * 使render进程和该render进程的host render进程(替代主进程)直接通信
  * @author nojsja
  * @param  {[Object]} ipcRender [渲染进程]
  * @return {[Object]} {invoke, send, handle} [ipcRender functions rewriten with ipcRenderer.sendTo]
  */


var MessageChannel = function MessageChannel() {
  (0, _classCallCheck2["default"])(this, MessageChannel);
  this.event = new EventEmitter();
};

;
/**
  * MessageChannelRender [渲染进程消息对象]
  * @author nojsja
  * @param  {[type]} param [desc]
  * @return {[type]} param [desc]
  */

var MessageChannelRender = /*#__PURE__*/function (_MessageChannel) {
  (0, _inherits2["default"])(MessageChannelRender, _MessageChannel);

  var _super = _createSuper(MessageChannelRender);

  function MessageChannelRender() {
    (0, _classCallCheck2["default"])(this, MessageChannelRender);
    return _super.call(this);
  }
  /**
    * invoke [在渲染进程中(service/window)向另外一个服务进程或主进程(service/main)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */


  (0, _createClass2["default"])(MessageChannelRender, [{
    key: "invoke",
    value: function invoke(name, channel, args) {
      var pid = getRandomString();
      if (name === 'main') return ipcRenderer.invoke(channel, args);
      return new Promise(function (resolve, reject) {
        ipcRenderer.invoke('MessageChannel.getIdFromName', {
          name: name
        }).then(function (id) {
          if (!id) return reject(new Error("MessageChannel: can not get the id of the window names ".concat(name)));
          ipcRenderer.sendTo(id, channel, Object.assign(args, {
            pid: pid
          }));
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
    key: "handle",
    value: function handle(channel, promiseFunc) {
      if (!promiseFunc instanceof Function) throw new Error('MessageChannel: promiseFunc must be a function!');
      ipcRenderer.on(channel, function (event, params) {
        var pid = params.pid,
            isFromMain = params.isFromMain;
        delete params[pid];
        var execResult;

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
        })["catch"](function (error) {
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
    key: "send",
    value: function send(name, channel, args) {
      if (name === 'main') return ipcRenderer.send(channel, args);
      ipcRenderer.invoke('MessageChannel.getIdFromName', {
        name: name
      }).then(function (id) {
        if (!id) return console.error("MessageChannel: cant find a service named: ".concat(name, "!"));
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
    key: "sendTo",
    value: function sendTo(id, channel, args) {
      ipcRenderer.sendTo(id, channel, args);
    }
    /**
      * on [在渲染进程中(service/window)监听来自其它进程(service/window/main)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: "on",
    value: function on(channel, func) {
      ipcRenderer.on(channel, func);
    }
    /**
      * on [在渲染进程中(service/window)监听一次来自其它进程(service/window/main)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: "once",
    value: function once(channel, func) {
      ipcRenderer.once(channel, func);
    }
    /**
       * registry [注册BrowserWindow和BrowserService]
       * @param  {[String]} name [唯一的名字]
       * @param  {[String]} id [window id]
       * @param  {[String]} pid [process id]
       */

  }, {
    key: "registry",
    value: function registry(name, id, pid) {
      if (name === 'main') throw new Error("MessageChannel: you can not registry a service named:".concat(name, ", it's reserved for the main process!"));
      return ipcRenderer.invoke('MessageChannel.registryService', {
        name: name,
        id: id,
        pid: pid
      });
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


var MessageChannelMain = /*#__PURE__*/function (_MessageChannel2) {
  (0, _inherits2["default"])(MessageChannelMain, _MessageChannel2);

  var _super2 = _createSuper(MessageChannelMain);

  function MessageChannelMain() {
    var _this;

    (0, _classCallCheck2["default"])(this, MessageChannelMain);
    _this = _super2.call(this);
    _this.services = {};
    /* 根据name获取window id */

    ipcMain.handle('MessageChannel.getIdFromName', function (e, args) {
      return (_this.services[args.name] || {}).id;
    });
    /* 使用name和window id注册一个服务 */

    ipcMain.handle('MessageChannel.registryService', function (e, args) {
      var name = args.name,
          id = args.id;

      _this.registry(name, id);

      return _this.services[name];
    });
    return _this;
  }
  /**
    * invoke [在主进程(main)中向另外一个服务进程(service)发送异步请求，并取得回调Promise]
    * @param  {[String]} name [服务名]
    * @param  {[String]} channel [服务监听的信号名]
    * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
    * @return {[Promise]} [回调]
    */


  (0, _createClass2["default"])(MessageChannelMain, [{
    key: "invoke",
    value: function invoke(name, channel) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var pid = getRandomString();
      var id = this.services[name].id;
      return new Promise(function (resolve, reject) {
        if (name === 'main') reject(new Error("MessageChannel: the main process can not send a message to itself!"));
        if (!id) reject(new Error("MessageChannel: can not get the id of the window names ".concat(name)));
        var win = BrowserWindow.fromId(id);
        if (!win) reject(new Error("MessageChannel: can not find a window with id: ".concat(id)));
        win.webContents.send(channel, Object.assign(args, {
          pid: pid,
          isFromMain: true
        }));
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
    key: "handle",
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
    key: "handleOnce",
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
    key: "send",
    value: function send(name, channel) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var id = (this.services[name] || {}).id;
      if (!id) throw new Error("MessageChannel: can not get the id of the window names ".concat(name));
      var win = BrowserWindow.fromId(id);
      if (!win) throw new Error("MessageChannel: can not find a window with id: ".concat(id));
      win.webContents.send(channel, args);
    }
    /**
      * send [在主进程中(main)向指定某个id的渲染进程窗口(service/window)发送请求，不可立即取得值，请配合on监听信号使用]
      * @param  {[String]} id [window id]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Any]} args [携带参数(会被序列化，不会传递对象Proptype信息)]
      */

  }, {
    key: "sendTo",
    value: function sendTo(id, channel, args) {
      if (!BrowserWindow.fromId(id)) throw new Error("MessageChannel: can not find a window with id:".concat(id, "!"));
      BrowserWindow.fromId(id).webContents.send(channel, args);
    }
    /**
      * on [在主进程中(main)监听来自其它渲染进程(service/window)的请求]
      * @param  {[String]} channel [服务监听的信号名]
      * @param  {[Function]} func [消息到达后，此函数会被触发，同于原生ipcRenderer.on]
      */

  }, {
    key: "on",
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
    key: "once",
    value: function once(channel, func) {
      if (!func instanceof Function) throw new Error('MessageChannel: func must be a function!');
      ipcMain.once(channel, func);
    }
    /**
       * registry [注册BrowserWindow和BrowserService]
       * @param  {[String]} name [唯一的名字]
       * @param  {[String]} id [window id]
       * @param  {[String]} pid [process id]
       */

  }, {
    key: "registry",
    value: function registry(name, id, pid) {
      if (name === 'main') throw new Error("MessageChannel: you can not registry a service named:".concat(name, ", it's reserved for the main process!"));
      if (this.services[name]) console.warn("MessageChannel: the service - ".concat(name, " has been registeried!"));
      this.services[name] = {
        name: name,
        id: id,
        pid: pid
      };
      this.event.emit('registry', this.services[name]);
    }
    /**
       * unregistry [注册BrowserWindow和BrowserService]
       * @param  {[String]} name [唯一的名字]
       * @param  {[String]} id [window id]
       * @param  {[String]} pid [process id]
       */

  }, {
    key: "unregistry",
    value: function unregistry(name) {
      if (name === 'main') throw new Error("MessageChannel: you can not unregistry a service named:".concat(name, ", it's reserved for the main process!"));
      if (this.services[name]) console.warn("MessageChannel: the service - ".concat(name, " will be unregisteried!"));

      if (this.services[name]) {
        this.event.emit('unregistry', this.services[name]);
        delete this.services[name];
      } else {
        console.warn("MessageChannel: unregistry -> the service - ".concat(name, " is not found!"));
      }
    }
  }]);
  return MessageChannelMain;
}(MessageChannel);

if (!('electronre:$globalMessage' in global)) {
  Object.defineProperty(global, "electronre:$globalMessage", {
    value: isMain ? new MessageChannelMain() : isRenderer ? new MessageChannelRender() : null,
    writable: false,
    configurable: false,
    enumerable: true
  });
}

module.exports = global['electronre:$globalMessage'];