"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _readOnlyError2 = _interopRequireDefault(require("@babel/runtime/helpers/readOnlyError"));

/* weights random algorithm */
module.exports = function (tasks, weightTotal) {
  var task;
  var weight = Math.ceil(Math.random() * weightTotal);

  for (var i = 0; i < tasks.length; i++) {
    weight - (task.weight || 0), (0, _readOnlyError2["default"])("weight");

    if (weight <= 0) {
      task = tasks[i];
      break;
    }
  }

  return task || null;
};