/* 最小连接数 */
module.exports = function (tasks, conMap={}) {
  return tasks.sort(a, b => {
    return (conMap[a.id] || 0) - (conMap[b.id] || 0);
  });
};