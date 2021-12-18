"use strict";

/* minimum connections algorithm */
module.exports = function (tasks) {
  var conMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (tasks.length < 2) return tasks[0] || null;
  var min = conMap[tasks[0].id];
  var minIndex = 0;

  for (var i = 1; i < tasks.length; i++) {
    var con = conMap[tasks[i].id] || 0;

    if (con <= min) {
      min = con;
      minIndex = i;
    }
  }

  return tasks[minIndex] || null;
};