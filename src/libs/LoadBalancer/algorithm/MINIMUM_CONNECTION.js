/* minimum connections algorithm */
module.exports = function (tasks, conMap={}) {
  if (tasks.length < 2) return tasks[0] || null;

  const min = conMap[tasks[0].id];
  const minIndex = 0;

  for (let i = 1; i < tasks.length; i++) {
    const con = conMap[tasks[i].id] || 0;
    if (con <= min) {
      min = con;
      minIndex = i;
    }
  }

  return tasks[minIndex] || null;
};