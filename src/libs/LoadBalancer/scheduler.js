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
    this.params = {
      currentIndex: 0,
      connectionsMap: {}
    };
  }

  /* get algorithm params */
  getParams(algorithm) {
    return {
      [POLLING]: [this.currentIndex],
      [WEIGHTS]: [],
      [RANDOM]: [],
      [SPECIFY]: [],
      [MINIMUM_CONNECTION]: [],
      [WEIGHTS_POLLING]: [],
      [WEIGHTS_RANDOM]: [],
      [WEIGHTS_MINIMUM_CONNECTION]: [],
    }[algorithm] || [];
  }

  /* pick one task from task list based on algorithm and params */
  calculate() {
    const results = algorithm[this.algorithm](this.tasks, this.getParams(this.algorithm));
    this.currentIndex++;
    this.currentIndex %= this.tasks.length;
    return results;
  }

  /* set tasks */
  setTasks(tasks) {
    this.tasks = tasks;
  }

  /* update calculate params */
  updateParams(object) {
    Object.entries(object).map(([key, value]) => {
      if (key in this.params) {
        this.params[key] = value;
      }
    });
  }
}

module.exports = Scheduler;