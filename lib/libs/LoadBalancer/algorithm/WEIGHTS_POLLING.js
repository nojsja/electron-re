"use strict";

/* weights polling */
module.exports = function (tasks, weightIndex, weightTotal, context) {
  if (!tasks.length) return null;
  var weight = 0;
  var task;

  for (var i = 0; i < tasks.length; i++) {
    weight += tasks[i].weight || 0;

    if (weight > weightIndex) {
      task = tasks[i];
      break;
    }
  }

  context.weightIndex += 1;
  context.weightIndex %= weightTotal + 1;
  return task;
};