const { parentPort, workerData } = require('worker_threads');

const { execPath } = workerData;
const mainRunner = require(execPath);

parentPort.on('message', (info) => {
  Promise.resolve(mainRunner(info))
    .then((data) => {
      parentPort.postMessage({
        code: 0,
        data,
        error: null,
      });
    })
    .catch((error) => {
      parentPort.postMessage({ code: 1, data: null, error });
    });
});
