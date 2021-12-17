"use strict";

/* weights random algorithm */
module.exports = function (tasks, weightTotal) {
  var task;
  var weight = Math.ceil(Math.random() * weightTotal);

  for (var i = 0; i < tasks.length; i++) {
    weight -= tasks[i].weight || 0;

    if (weight <= 0) {
      task = tasks[i];
      break;
    }
  }

  return task || null;
};