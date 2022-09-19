const childProcessTester = require('./test.child_process');
const serviceTester = require('./test.service');
const workerThreadsTester = require('./test.worker_threads');

module.exports = {
  run: () => {
    serviceTester();
    childProcessTester();
    workerThreadsTester();
  }
};