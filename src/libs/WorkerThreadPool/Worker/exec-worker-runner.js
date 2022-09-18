const { parentPort, workerData } = require('worker_threads');

const { execPath } = workerData;
const mainRunner = require(execPath);

parentPort.on('message', (task) => {
  Promise.resolve(mainRunner(task.payload))
    .then((data) => {
      parentPort.postMessage({
        code: 0,
        data,
        error: null,
        taskId: task.taskId,
      });
    })
    .catch((error) => {
      parentPort.postMessage({ code: 1, data: null, error, taskId: task.taskId });
    });
});
