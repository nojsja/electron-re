'use strict';

var fs = require('fs');

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
      base = _ref$base === undefined ? '.' : _ref$base;

  var htmlContent = '\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <title>' + title + '</title>\n        <base href="' + base + '"></base>\n        <meta charset="UTF-8">\n      </head>\n      <body>\n        <script>\n          global.require = require = (function(require) {\n            const _require = require;\n          \n            return function(_path) {\n              if (_path === \'electron\') return {\n                ..._require(\'electron\').remote.require(\'electron\'),\n                remote: _require(\'electron\').remote,\n                desktopCapturer: _require(\'electron\').desktopCapturer,\n                webFrame: _require(\'electron\').webFrame,\n                ipcRenderer: _require(\'electron\').ipcRenderer\n              };\n              try {\n                return _require(_path);\n              } catch(error) {\n                return _require(\n                  _require(\'path\').join(\n                    document.querySelector(\'base\').href,\n                    _path\n                  ).replace(\'file:\', \'\')\n                )\n              }\n            }\n          })(require);\n        </script>\n        ' + (webSecurity ? "<script>" + script + "</script>" : "<script src=" + src + "></script>") + '\n      </body>\n    </html>\n  ';

  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};

/* 开发环境 */
exports.isEnvDev = global.nodeEnv === 'development' || global.nodeEnv === 'development' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

/* render process check */
exports.isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';

/**
   * @param  {Function} fn         [回调函数]
   * @param  {[Time]}   delayTime  [延迟时间(ms)]
   * @param  {Boolean}  isImediate [是否需要立即调用]
   * @param  {[type]}   args       [回调函数传入参数]
  */
exports.fnDebounce = function () {
  var fnObject = {};
  var timer = void 0;

  return function (fn, delayTime, isImediate, args) {
    var setTimer = function setTimer() {
      timer = setTimeout(function () {
        fn(args);
        clearTimeout(timer);
        delete fnObject[fn];
      }, delayTime);

      fnObject[fn] = { delayTime: delayTime, timer: timer };
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