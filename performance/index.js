const path = require('path');

const { StaticThreadPool, DynamicThreadPool } = require('../lib');
const fibonacci = require(path.join(__dirname, './worker-run.js'));

const CONF_MAX_THREADS = 4;
const CONF_MAX_TASKS = 8;
const CONF_TASK_RETRY = 0;

const staticThreadPool = new StaticThreadPool({
  execPath: path.join(__dirname, './worker-run.js'),
  lazyLoad: false,
  maxThreads: CONF_MAX_THREADS,
  maxTasks: CONF_MAX_TASKS,
  taskRetry: CONF_TASK_RETRY,
  taskLoopTime: 1e3,
});

const dynamicThreadPool = new DynamicThreadPool({
  maxThreads: CONF_MAX_THREADS,
  maxTasks: CONF_MAX_TASKS,
  taskRetry: CONF_TASK_RETRY,
  taskLoopTime: 1e3,
});

console.time('TIME: static-pool.exec -> fibonacci(40)')
staticThreadPool.exec(40).then(() => {
  console.timeEnd('TIME: static-pool.exec -> fibonacci(40)');
}).catch((err) => {
  console.log(err);
});

console.time('TIME: dynamic-pool.exec -> fibonacci(40)')
dynamicThreadPool.exec(40, {
  execPath: path.join(__dirname, './worker-run.js'),
}).then(() => {
  console.timeEnd('TIME: dynamic-pool.exec -> fibonacci(40)');
}).catch((err) => {
  console.log(err);
});

console.time('TIME: main.exec -> fibonacci(40)');
fibonacci(40);
console.timeEnd('TIME: main.exec -> fibonacci(40)');