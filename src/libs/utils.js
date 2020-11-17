const fs = require('fs');

/**
  * loadView [生成可以供直接读取显示到BrowserWindow的html content]
  * @author nojsja
  * @param  {[String]} title [标题]
  * @param  {[String]} script [脚本内容]
  * @return {[String]}
  */
 exports.loadView = ({ webSecurity, src, title, script, base = '.' }) => {
  const htmlContent = (`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <base href="${base}"></base>
        <meta charset="UTF-8">
      </head>
      <body>
        <script>
          global.require = require = (function(require) {
            const _require = require;
          
            return function(_path) {
              if (_path === 'electron') return {
                ..._require('electron').remote.require('electron'),
                remote: _require('electron').remote,
                desktopCapturer: _require('electron').desktopCapturer,
                webFrame: _require('electron').webFrame,
                ipcRenderer: _require('electron').ipcRenderer
              };
              try {
                return _require(_path);
              } catch(error) {
                return _require(
                  _require('path').join(
                    document.querySelector('base').href,
                    _path
                  ).replace('file:', '')
                )
              }
            }
          })(require);
        </script>
        ${ webSecurity ? ("<script>" + script + "</script>") : "<script src="+ src + "></script>" }
      </body>
    </html>
  `);
  
  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};

/* 开发环境 */
exports.isEnvDev = (
  global.nodeEnv === 'development' ||
  global.nodeEnv === 'development' ||
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'dev'
);

/* render process check */
exports.isRenderer = (
  typeof process === 'undefined' ||
  !process ||
  process.type === 'renderer'
);

/**
   * @param  {Function} fn         [回调函数]
   * @param  {[Time]}   delayTime  [延迟时间(ms)]
   * @param  {Boolean}  isImediate [是否需要立即调用]
   * @param  {[type]}   args       [回调函数传入参数]
  */
 exports.fnDebounce = function() {
  const fnObject = {};
  let timer;

  return (fn, delayTime, isImediate, args) => {
    const setTimer = () => {
      timer = setTimeout(() => {
        fn(args);
        clearTimeout(timer);
        delete fnObject[fn];
      }, delayTime);

      fnObject[fn] = { delayTime, timer };
    };

    if (!delayTime || isImediate) return fn(args);

    if (fnObject[fn]) {
      clearTimeout(timer);
      setTimer(fn, delayTime, args);
    } else {
      setTimer(fn, delayTime, args);
    }
  };
}

/* random string */
exports.getRandomString = () => Math.random().toString(36).substr(2);