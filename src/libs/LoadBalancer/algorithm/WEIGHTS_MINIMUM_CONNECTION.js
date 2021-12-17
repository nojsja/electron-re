/* weights minimum connections algorithm */
module.exports = function (tasks, weightTotal, connectionsMap, context) {

  if (!tasks.length) return null;

  let max = tasks[0].weight, maxIndex = 0, sum;

  const connectionsTotal = tasks.reduce((total, cur => {
    total += (connectionsMap[cur.id] || 0);
    return total;
  }, 0));

  // algorithm: (weight + connections'weight) + random factor
  for (let i = 0; i < tasks.length; i++) {
    sum =
      (tasks[i].weight || 0) + (Math.random() * weightTotal) +
      weightTotal * (( (connectionsMap[tasks[i].id] || 0) * weightTotal ) / connectionsTotal);
    if (sum >= max) {
      max = sum;
      maxIndex = i;
    }
  }

  context.weightIndex += 1;
  context.weightIndex %= (weightTotal + 1);

  return tasks[maxIndex];
};