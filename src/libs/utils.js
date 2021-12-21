const fs = require('fs');
const path = require('path');
const url = require('url');
const conf = require('../conf/global.json');

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
          const baseUrl = document.querySelector('base').getAttribute('href');
          global._depends = [];
          global.$require = require;
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
                  _require(
                    (path.posix.join(path.sep, ...(path.dirname(baseUrl.replace('file:///', ''))).split(path.sep), _path))
                  );
              }
              return result;
            }
          })(require);
        </script>

        ${ webSecurity ? ("<script>" + script + "</script>") : "<script src='"+ (
          url.format({
            pathname: (path.posix.join(...(src).split(path.sep))),
            protocol: conf.protocolName+':',
            slashes: true
          })
        ) + "'></script>" }

        <script>
          (function() {
            const fs = require('fs');
            const { ipcRenderer }= require('electron');
            ipcRenderer.once('get-watching-files', (event, { pid }) => {
              ipcRenderer.send(pid, {
                depends: (function(_module) {
                  const paths = [];
                  const getPaths = (modu) => {
                    fs.exists(modu.filename, (exists) => {
                      if (exists && !paths.includes(modu.filename)) {
                        paths.push(modu.filename);
                      }
                    });
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

/* child process check */
exports.isForkedChild = (
  process.env.ELECTRON_RUN_AS_NODE === '1' ||
  process.env.ELECTRON_RUN_AS_NODE === 1
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
  for (let i = 0; i < forks.length; i++) {
    if (forks[i].pid === pid) {
      forks.splice(i, 1);
      ([...pidMap.entries()]).map(([key, value]) => {
        if (value === pid) {
          pidMap.delete(key);
        }
      });
      break;
    }
  }
}

/* convert forked process array to map */
exports.convertForkedToMap = function(arr) {
  return arr.reduce((total, cur) => {
    total[cur.pid] = cur;
    return total;
  }, {});
}

/* tree value */
exports.isValidValue = function(value) {
  return (
    value !== undefined &&
    value !== null &&
    value !== ''
  );
};