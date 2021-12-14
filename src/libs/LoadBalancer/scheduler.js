const {
  POLLING,
  WEIGHTS,
  RANDOM,
  SPECIFY,
  MINIMUM_CONNECTION,
  WEIGHTS_POLLING,
  WEIGHTS_RANDOM,
  WEIGHTS_MINIMUM_CONNECTION,
} = CONSTS;
const algorithm = require('./algorithm');

/* Scheduler for LoadBalancer  */
class Scheduler {
  constructor(algorithm, tasks = []) {
    this.algorithm = algorithm;
    this.tasks = tasks;
  }

  /* pick one task from task list based on algorithm and params */
  calculate(tasks) {
    const results = algorithm[this.algorithm](tasks);
    this.currentIndex++;
    this.currentIndex %= this.tasks.length;
    return results;
  }
}

module.exports = Scheduler;