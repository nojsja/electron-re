"use strict";

/* weights minimum connections algorithm */
module.exports = function (tasks, weightTotal, connectionsMap, context) {
  if (!tasks.length) return null;
  var max = tasks[0],
      maxIndex = 0,
      sum;
  var connectionsTotal = tasks.reduce((total, function (cur) {
    total += connectionsMap[cur.id] || 0;
    return total;
  }, 0)); // algorithm: (weight + connections'weight) + random factor

  for (var i = 0; i < tasks.length; i++) {
    sum = (tasks[i].weight || 0) + Math.random() * weightTotal + weightTotal * ((connectionsMap[tasks[i].id] || 0) * weightTotal / connectionsTotal);

    if (sum >= max) {
      max = sum;
      maxIndex = i;
    }
  }

  context.weightIndex += 1;
  context.weightIndex %= weightTotal + 1;
  return tasks[maxIndex];
};