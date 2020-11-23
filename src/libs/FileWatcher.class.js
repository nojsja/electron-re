const fs = require('fs');

class FileWatcher {
  constructor() {
    this._event = {};
    this.watchers = {};
  }

  watch(_path, fn) {
    if (!fs.existsSync(_path)) throw new Error(`FileWatcher: path - ${_path} is not exists!`);
    if (fs.statSync(_path).isDirectory()) throw new Error(`FileWatcher: can not watch a directory - ${_path}`);

    if (!this._event[_path]) {
      this._event[_path] = [fn];
      this.watchers[_path] = fs.watch(_path, () => {
        this._event[_path].forEach((fn) => fn());
      });
    } else {
      this._event[_path].push(fn);
    }
  }

  unwatch(_path, fn) {
    if (!this._event[_path]) throw new Error(`FileWatcher: path - ${_path} is not be watching!`);
    if (fn) {
      this._event[_path] = this._event[_path].filter(func => func !== fn);
    } else {
      delete this._event[_path];
      this.watchers[_path].close();
    }
  }
}

global.FileWatcher = global.FileWatcher || new FileWatcher();

module.exports = global.FileWatcher;