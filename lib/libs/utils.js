"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

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
  var _path$posix;

  var webSecurity = _ref.webSecurity,
      src = _ref.src,
      title = _ref.title,
      script = _ref.script,
      _ref$base = _ref.base,
      base = _ref$base === void 0 ? '.' : _ref$base;

  /* webview internal func1 */
  var compareVersion = "function compareVersion(version1, version2) {\n    const v1s = String(version1).split('.');\n    const v2s = String(version2).split('.');\n  \n    while (v1s.length || v2s.length) {\n      let tmp1 = +(v1s.shift() || 0);\n      let tmp2 = +(v2s.shift() || 0);\n      if (tmp1 > tmp2) {\n        return 1;\n      }\n      if (tmp1 < tmp2) {\n        return -1;\n      }\n    }\n  \n    return 0;\n  }";
  var internalFunc = "function() {\n    const baseUrl = document.querySelector('base').getAttribute('href');\n    const needPolyfill = compareVersion(process.versions.electron, '14') >= 0;\n    global._depends = [];\n    global.$require = require;\n\n    global.require = require = (function(require) {\n      const _require = require;\n\n      return function(_path) {\n        let result;\n        const path = _require('path');\n\n        try {\n          result = _require(_path);\n        } catch(error) {\n          const dir = path.dirname(baseUrl.replace('file:///', ''));\n          const isWin = dir[0] !== '/';\n          const pathStrs = [path.sep, ...dir.split(path.sep), _path];\n          if (isWin) {\n            pathStrs.shift();\n          }\n          result =\n            _require((path.posix.join(...pathStrs)));\n        }\n        return result;\n      }\n    })(require);\n   }";
  /* webview internal func2 */

  var internalFunc2 = "function() {\n     const fs = require('fs');\n     const { ipcRenderer }= require('electron');\n     ipcRenderer.once('get-watching-files', (event, { pid }) => {\n       ipcRenderer.send(pid, {\n         depends: (function(_module) {\n           const paths = [];\n           const getPaths = (modu) => {\n             fs.exists(modu.filename, (exists) => {\n               if (exists && !paths.includes(modu.filename)) {\n                 paths.push(modu.filename);\n               }\n             });\n             modu.children.forEach(getPaths);\n           };\n           getPaths(_module);\n           return paths;\n         })(module) });\n     });\n   }";
  /* script content  */

  var scriptContent = webSecurity ? "<script> ".concat(script, " </script>") : "<script src='".concat(url.format({
    pathname: (_path$posix = path.posix).join.apply(_path$posix, (0, _toConsumableArray2["default"])(src.split(path.sep))),
    protocol: conf.protocolName + ':',
    slashes: true
  }), "'></script>");
  var htmlContent = "\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <title>".concat(title, "</title>\n        <base href=\"").concat(base, "\">\n        <meta charset=\"UTF-8\">\n      </head>\n      <body>\n        <script>\n          ").concat(compareVersion, "\n        </script>\n        <script>\n          (").concat(internalFunc, ")();\n        </script>\n        ").concat(scriptContent, "\n        <script>\n          (").concat(internalFunc2, ")();\n        </script>\n      </body>\n    </html>\n  ");
  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};
/* 开发环境 */


exports.isEnvDev = global.nodeEnv === 'development' || global.nodeEnv === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
/* render process check */

exports.isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';
/* render process check */

exports.isMain = typeof process !== 'undefined' && process.type === 'browser';
/* child process check */

exports.isForkedChild = Number(process.env.ELECTRON_RUN_AS_NODE) === 1;
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
      (0, _toConsumableArray2["default"])(pidMap.entries()).map(function (_ref2) {
        var _ref3 = (0, _slicedToArray2["default"])(_ref2, 2),
            key = _ref3[0],
            value = _ref3[1];

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