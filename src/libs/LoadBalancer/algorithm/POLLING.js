/* 轮询 */
module.exports = function (tasks, currentIndex, context) {
  const task = tasks[currentIndex];
  context.currentIndex ++;
  context.currentIndex %= tasks.length;
  
  return task;
};