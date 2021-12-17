const CONSTS = require("./consts");
const algorithm = require('./algorithm');
const {
  POLLING,
} = CONSTS;

/* Scheduler for LoadBalancer  */
class Scheduler {
  constructor(algorithm) {
    this.algorithm = algorithm || POLLING;
  }

  /* pick one task from task list based on algorithm and params */
  calculate(tasks, params) {
    const results = algorithm[this.algorithm](tasks, ...params);
    console.log(results, 1);
    return results;
  }

  /* change algorithm strategy */
  setAlgorithm = (algorithm) => {
    if (algorithm in CONSTS) {
      this.algorithm = algorithm;
    } else {
      throw new Error(`Invalid algorithm: ${algorithm}, pick from ${Object.keys(CONSTS).join('|')}`);
    }
  }
}

module.exports = Scheduler;