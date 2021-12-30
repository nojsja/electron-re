"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var fs = require('fs');

var path = require('path');

var url = require('url');

var conf = require('../conf/global.json');
/**
  * loadView [生成可以供直接读取显示到BrowserWindow的html content]
  * @author nojsja
  * @param  {[String]} title [标题]
  * @param  {[String]} script [脚本内容]
  * @return {[String]}
  */


exports.loadView = function (_ref) {
  var _path$posix2;

  var webSecurity = _ref.webSecurity,
      src = _ref.src,
      title = _ref.title,
      script = _ref.script,
      _ref$base = _ref.base,
      base = _ref$base === void 0 ? '.' : _ref$base;

  /* webview internal func1 */
  function internalFunc() {
    var baseUrl = document.querySelector('base').getAttribute('href');
    global._depends = [];
    global.$require = require;

    global.require = require = function (require) {
      var _require = require;
      var remote = compareVersion(process.versions.electron, '14') >= 0 ? _require('@electron/remote') : _require('electron').remote;
      return function (_path) {
        var result;

        var path = _require('path');

        if (_path === 'electron') return _objectSpread(_objectSpread({}, remote.require('electron')), {}, {
          remote: remote,
          desktopCapturer: _require('electron').desktopCapturer,
          webFrame: _require('electron').webFrame,
          ipcRenderer: _require('electron').ipcRenderer
        });

        try {
          result = _require(_path);
        } catch (error) {
          var _path$posix;

          result = _require((_path$posix = path.posix).join.apply(_path$posix, [path.sep].concat((0, _toConsumableArray2["default"])(path.dirname(baseUrl.replace('file:///', '')).split(path.sep)), [_path])));
        }

        return result;
      };
    }(require);
  }

  ;
  /* webview internal func2 */

  function internalFunc2() {
    var fs = require('fs');

    var _require2 = require('electron'),
        ipcRenderer = _require2.ipcRenderer;

    ipcRenderer.once('get-watching-files', function (event, _ref2) {
      var pid = _ref2.pid;
      ipcRenderer.send(pid, {
        depends: function (_module) {
          var paths = [];

          var getPaths = function getPaths(modu) {
            fs.exists(modu.filename, function (exists) {
              if (exists && !paths.includes(modu.filename)) {
                paths.push(modu.filename);
              }
            });
            modu.children.forEach(getPaths);
          };

          getPaths(_module);
          return paths;
        }(module)
      });
    });
  }

  ;
  /* script content  */

  var scriptContent = webSecurity ? "<script> ".concat(script, " </script>") : "<script src='".concat(url.format({
    pathname: (_path$posix2 = path.posix).join.apply(_path$posix2, (0, _toConsumableArray2["default"])(src.split(path.sep))),
    protocol: conf.protocolName + ':',
    slashes: true
  }), "'></script>");
  var htmlContent = "\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <title>".concat(title, "</title>\n        <base href=\"").concat(base, "\">\n        <meta charset=\"UTF-8\">\n      </head>\n      <body>\n        <script>").concat(exports.compareVersion.toString(), "</script>\n        <script>\n          (").concat(internalFunc.toString(), ")();\n        </script>\n        ").concat(scriptContent, "\n        <script>\n          (").concat(internalFunc2.toString(), ")();\n        </script>\n      </body>\n    </html>\n  ");
  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};
/* 开发环境 */


exports.isEnvDev = global.nodeEnv === 'development' || global.nodeEnv === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
/* render process check */

exports.isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';
/* render process check */

exports.isMain = typeof process !== 'undefined' && process.type === 'browser';
/* child process check */

exports.isForkedChild = process.env.ELECTRON_RUN_AS_NODE === '1' || process.env.ELECTRON_RUN_AS_NODE === 1;
/**
   * @param  {Function} fn         [回调函数]
   * @param  {[Time]}   delayTime  [延迟时间(ms)]
   * @param  {Boolean}  isImediate [是否需要立即调用]
   * @param  {[type]}   args       [回调函数传入参数]
  */

exports.fnDebounce = function () {
  var fnObject = {};
  var timer;
  return function (fn, delayTime, isImediate, args) {
    var setTimer = function setTimer() {
      timer = setTimeout(function () {
        fn(args);
        clearTimeout(timer);
        delete fnObject[fn];
      }, delayTime);
      fnObject[fn] = {
        delayTime: delayTime,
        timer: timer
      };
    };

    if (!delayTime || isImediate) return fn(args);

    if (fnObject[fn]) {
      clearTimeout(timer);
      setTimer(fn, delayTime, args);
    } else {
      setTimer(fn, delayTime, args);
    }
  };
};
/* random string */


exports.getRandomString = function () {
  return Math.random().toString(36).substr(2);
};
/* getRequiredFilePath */


exports.getRequiredFilePath = function (p) {
  if (fs.statSync(p).isDirectory()) {
    p = "".concat(p, "/index");
  }

  if (fs.existsSync(p)) return p;
  if (fs.existsSync("".concat(p, ".js"))) return "".concat(p, ".js");
  if (fs.existsSync("".concat(p, ".json"))) return "".concat(p, ".json");
  if (fs.existsSync("".concat(p, ".node"))) return "".concat(p, ".node");
};
/* getModuleFilePath */


exports.getModuleFilePath = function (_module) {
  var paths = [];

  var getPaths = function getPaths(modu) {
    if (fs.existsSync(modu.filename)) {
      paths.push(modu.filename);
    }

    modu.children.forEach(getPaths);
  };

  getPaths(_module);
  return paths;
};
/* remove a forked process from pool */


exports.removeForkedFromPool = function (forks, pid, pidMap) {
  for (var i = 0; i < forks.length; i++) {
    if (forks[i].pid === pid) {
      forks.splice(i, 1);
      (0, _toConsumableArray2["default"])(pidMap.entries()).map(function (_ref3) {
        var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
            key = _ref4[0],
            value = _ref4[1];

        if (value === pid) {
          pidMap["delete"](key);
        }
      });
      break;
    }
  }
};
/* convert forked process array to map */


exports.convertForkedToMap = function (arr) {
  return arr.reduce(function (total, cur) {
    total[cur.pid] = cur;
    return total;
  }, {});
};
/* tree value */


exports.isValidValue = function (value) {
  return value !== undefined && value !== null && value !== '';
};
/* compare versions */


exports.compareVersion = function compareVersion(version1, version2) {
  var v1s = String(version1).split('.');
  var v2s = String(version2).split('.');

  while (v1s.length || v2s.length) {
    var tmp1 = +(v1s.shift() || 0);
    var tmp2 = +(v2s.shift() || 0);

    if (tmp1 > tmp2) {
      return 1;
    }

    if (tmp1 < tmp2) {
      return -1;
    }
  }

  return 0;
};