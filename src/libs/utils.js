const fs = require('fs');
const path = require('path');

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
        <base href="${base}">
        <meta charset="UTF-8">
      </head>
      <body>
        <script>
          global._depends = [];
          global.require = require = (function(require) {
            const _require = require;
          
            return function(_path) {
              let result;
              const path = _require('path');
              if (_path === 'electron') return {
                ..._require('electron').remote.require('electron'),
                remote: _require('electron').remote,
                desktopCapturer: _require('electron').desktopCapturer,
                webFrame: _require('electron').webFrame,
                ipcRenderer: _require('electron').ipcRenderer
              };
              try {
                result = _require(_path);
              } catch(error) {
                result =
                  _require(path.join(
                    path.dirname(document.querySelector('base').href),
                    _path).replace('file:', ''));
              }
              return result;
            }
          })(require);
        </script>

        ${ webSecurity ? ("<script>" + script + "</script>") : "<script src="+ src + "></script>" }

        <script>
          (function() {
            const fs = require('fs');
            const { ipcRenderer }= require('electron');
            ipcRenderer.once('get-watching-files', (event, { pid }) => {
              ipcRenderer.send(pid, {
                depends: (function(_module) {
                  const paths = [];
                  const getPaths = (modu) => {
                    if (fs.existsSync(modu.filename) && !paths.includes(modu.filename)) paths.push(modu.filename);
                    modu.children.forEach(getPaths);
                  };
                  getPaths(_module);
                  return paths;
                })(module) });
            });
          })();
        </script>
      </body>
    </html>
  `);
  
  return 'data:text/html;charset=UTF-8,' + encodeURIComponent(htmlContent);
};

/* 开发环境 */
exports.isEnvDev = (
  global.nodeEnv === 'development' ||
  global.nodeEnv === 'dev' ||
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'dev'
);

/* render process check */
exports.isRenderer = (
  typeof process === 'undefined' ||
  !process ||
  process.type === 'renderer'
);

/* render process check */
exports.isMain = (
  typeof process !== 'undefined' &&
  process.type === 'browser'
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

/* getRequiredFilePath */
exports.getRequiredFilePath = (p) => {
  if (fs.statSync(p).isDirectory()) {
    p = `${p}/index`;
  }
  if (fs.existsSync(p)) return p;
  if (fs.existsSync(`${p}.js`)) return `${p}.js`;
  if (fs.existsSync(`${p}.json`)) return `${p}.json`;
  if (fs.existsSync(`${p}.node`)) return `${p}.node`;
}


/* getModuleFilePath */
exports.getModuleFilePath = function (_module) {
  const paths = [];

  const getPaths = (modu) => {
    if (fs.existsSync(modu.filename)) {
      paths.push(modu.filename);
    }
    modu.children.forEach(getPaths);
  };

  getPaths(_module);

  return paths;
};

/* remove a forked process from pool */
exports.removeForkedFromPool = function(forks, pid, pidMap) {
  let index;
  const forked = forks.find((f, i) => { index = i; return f.pid === pid; });
  if (forked) {
    forks.splice(index, 1);
    pidMap.entries(([key, value]) => {
      if (value === pid) {
        pidMap.delete(key);
      }
    });
  }
}