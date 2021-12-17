"use strict";

/* random algorithm */
module.exports = function (tasks) {
  var length = tasks.length;
  var target = tasks[Math.floor(Math.random() * length)];
  return target || null;
};