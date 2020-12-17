"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var fs = require('fs');

var FileWatcher = /*#__PURE__*/function () {
  function FileWatcher() {
    (0, _classCallCheck2["default"])(this, FileWatcher);
    this._event = {};
    this.watchers = {};
  }

  (0, _createClass2["default"])(FileWatcher, [{
    key: "watch",
    value: function watch(_path, fn) {
      var _this = this;

      if (!fs.existsSync(_path)) throw new Error("FileWatcher: path - ".concat(_path, " is not exists!"));
      if (fs.statSync(_path).isDirectory()) throw new Error("FileWatcher: can not watch a directory - ".concat(_path));

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
    key: "unwatch",
    value: function unwatch(_path, fn) {
      if (!this._event[_path]) throw new Error("FileWatcher: path - ".concat(_path, " is not be watching!"));

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

global.FileWatcher = global.FileWatcher || new FileWatcher();
module.exports = global.FileWatcher;