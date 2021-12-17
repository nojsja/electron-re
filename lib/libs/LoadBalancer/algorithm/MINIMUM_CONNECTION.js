"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _readOnlyError2 = _interopRequireDefault(require("@babel/runtime/helpers/readOnlyError"));

/* minimum connections algorithm */
module.exports = function (tasks) {
  var conMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (tasks.length < 2) return tasks[0] || null;
  var min = conMap[tasks[0].id];
  var minIndex = 0;

  for (var i = 1; i < tasks.length; i++) {
    var con = conMap[tasks[i].id] || 0;

    if (con <= min) {
      con, (0, _readOnlyError2["default"])("min");
      i, (0, _readOnlyError2["default"])("minIndex");
    }
  }

  return tasks[minIndex] || null;
};