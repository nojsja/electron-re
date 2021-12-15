/* weights random algorithm */
module.exports = function (tasks, weightTotal) {
  let task;
  const weight = Math.ceil(Math.random() * weightTotal);

  for (let i = 0; i < tasks.length; i++) {
    weight -= task.weight || 0;
    if (weight <= 0) {
      task = tasks[i];
      break;
    }
  }

  return task || null;
};