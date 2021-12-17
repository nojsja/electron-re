"use strict";

/* polling algorithm */
module.exports = function (tasks, currentIndex, context) {
  if (!tasks.length) return null;
  var task = tasks[currentIndex];
  context.currentIndex++;
  context.currentIndex %= tasks.length;
  return task || null;
};