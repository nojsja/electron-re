const CONSTS = require("./consts");
const Scheduler = require("./scheduler");
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

class LoadBalancer {
  constructor(options) {
    this.targets = options.targets;
    this.algorithm = options.algorithm || POLLING;
    this.scheduler = new Scheduler(this.algorithm, this.targets);
  }

  pickOne() {

  }

  pickMulti() {

  }

  delOne() {

  }

  delAll() {

  }

  setTargets(targets) {
    this.targets = targets;
    this.scheduler.setTasks(targets);
  }

  setAlgorithm(algorithm) {
    if (algorithm in CONSTS) {
      this.algorithm = algorithm;
    } else {
      throw new Error(`Invalid algorithm: ${algorithm}, pick from ${Object.keys(CONSTS).join('|')}`);
    }
  }
}

module.exports = LoadBalancer;