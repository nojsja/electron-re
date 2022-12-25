const childProcessTester = require('./test.child_process');
const serviceTester = require('./test.service');
const workerThreadsTester = require('./test.worker_threads');

module.exports = {
  run: (argv) => {
    const isTestAll = !argv.process && !argv.service && !argv.threads;

    if (isTestAll) {
      serviceTester();
      childProcessTester();
      workerThreadsTester();
    } else {
      argv.service && serviceTester();
      argv.process && childProcessTester();
      argv.threads && workerThreadsTester();
    }
  }
};