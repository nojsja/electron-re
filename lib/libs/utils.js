"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var fs = require('fs');

var path = require('path');
/**
  * loadView [生成可以供直接读取显示到BrowserWindow的html content]
  * @author nojsja
  * @param  {[String]} title [标题]
  * @param  {[String]} script [脚本内容]
  * @return {[String]}
  */


exports.loadView = function (_ref) {
  var webSecurity = _ref.webSecurity,
      src = _ref.src,
      title = _ref.title,
      script = _ref.script,
      _ref$base = _ref.base,
      base = _ref$base === void 0 ? '.' : _ref$base;
  var htmlContent = "\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <title>".concat(title, "</title>\n        <base href=\"").concat(base, "\">\n        <meta charset=\"UTF-8\">\n      </head>\n      <body>\n        <script>\n          global._depends = [];\n          global.require = require = (function(require) {\n            const _require = require;\n          \n            return function(_path) {\n              let result;\n              const path = _require('path');\n              if (_path === 'electron') return {\n                ..._require('electron').remote.require('electron'),\n                remote: _require('electron').remote,\n                desktopCapturer: _require('electron').desktopCapturer,\n                webFrame: _require('electron').webFrame,\n                ipcRenderer: _require('electron').ipcRenderer\n              };\n              try {\n                result = _require(_path);\n              } catch(error) {\n                result =\n                  _require(path.join(\n                    path.dirname(document.querySelector('base').href),\n                    _path).replace('file:', ''));\n              }\n              return result;\n            }\n          })(require);\n        </script>\n\n        ").concat(webSecurity ? "<script>" + script + "</script>" : "<script src=" + src + "></script>", "\n\n        <script>\n          (function() {\n            const fs = require('fs');\n            const { ipcRenderer }= require('electron');\n            ipcRenderer.once('get-watching-files', (event, { pid }) => {\n              ipcRenderer.send(pid, {\n                depends: (function(_module) {\n                  const paths = [];\n                  const getPaths = (modu) => {\n                    if (fs.existsSync(modu.filename) && !paths.includes(modu.filename)) paths.push(modu.filename);\n                    modu.children.forEach(getPaths);\n                  };\n                  getPaths(_module);\n                  return paths;\n                })(module) });\n            });\n          })();\n        </script>\n      </body>\n    </html>\n  ");
  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};
/* 开发环境 */


exports.isEnvDev = global.nodeEnv === 'development' || global.nodeEnv === 'dev' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
/* render process check */

exports.isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';
/* render process check */

exports.isMain = typeof process !== 'undefined' && process.type === 'browser';
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
  var index;
  var forked = forks.find(function (f, i) {
    index = i;
    return f.pid === pid;
  });

  if (forked) {
    forks.splice(index, 1);
    pidMap.entries(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          key = _ref3[0],
          value = _ref3[1];

      if (value === pid) {
        pidMap["delete"](key);
      }
    });
  }
};