'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');

var FileWatcher = function () {
  function FileWatcher() {
    _classCallCheck(this, FileWatcher);

    this._event = {};
    this.watchers = {};
  }

  _createClass(FileWatcher, [{
    key: 'watch',
    value: function watch(_path, fn) {
      var _this = this;

      if (!fs.existsSync(_path)) throw new Error('FileWatcher: path - ' + _path + ' is not exists!');
      if (fs.statSync(_path).isDirectory()) throw new Error('FileWatcher: can not watch a directory - ' + _path);

      if (!this._event[_path]) {
        this._event[_path] = [fn];
        this.watchers[_path] = fs.watch(_path, function () {
          _this._event[_path].forEach(function (fn) {
            return fn();
          });
        });
      } else {
        this._event[_path].push(fn);
      }
    }
  }, {
    key: 'unwatch',
    value: function unwatch(_path, fn) {
      if (!this._event[_path]) throw new Error('FileWatcher: path - ' + _path + ' is not be watching!');
      if (fn) {
        this._event[_path] = this._event[_path].filter(function (func) {
          return func !== fn;
        });
      } else {
        delete this._event[_path];
        this.watchers[_path].close();
      }
    }
  }]);

  return FileWatcher;
}();

global.FileWatcher = global.FileWatcher ? global.FileWatcher : new FileWatcher();

module.exports = global.FileWatcher;