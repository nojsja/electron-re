"use strict";

/* specify by id algorithm */
module.exports = function (tasks, id) {
  var task;

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      task = tasks[i];
      break;
    }
  }

  return task || null;
};