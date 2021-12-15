const CONSTS = require("./consts");
const Scheduler = require("./scheduler");
const {
  RANDOM,
  POLLING,
  WEIGHTS,
  SPECIFY,
  WEIGHTS_RANDOM,
  WEIGHTS_POLLING,
  MINIMUM_CONNECTION,
  WEIGHTS_MINIMUM_CONNECTION,
} = CONSTS;

class LoadBalancer {
  constructor(options) {
    this.targets = options.targets;
    this.algorithm = options.algorithm || POLLING;
    this.params = { // data for algorithm
      currentIndex: 0, // index
      connectionsMap: {}, // connections of each target
      cpuOccupancyMap: {}, // cpu occupancy of each target
    };
    this.scheduler = new Scheduler(this.algorithm);
    this.memoParams = this.memorizedParams();
  }

  /* params formatter */
  memorizedParams = () => {
    const empty = [];
    return {
      [RANDOM]: () => empty,
      [POLLING]: () => [this.params.currentIndex, this.params],
      [WEIGHTS]: () => empty,
      [SPECIFY]: () => empty,
      [WEIGHTS_RANDOM]: empty,
      [WEIGHTS_POLLING]: empty,
      [MINIMUM_CONNECTION]: () => [this.params.connectionsMap],
      [WEIGHTS_MINIMUM_CONNECTION]: [this.params.connectionsMap],
    };
  }

  /* pick one task from queue */
  pickOne = () => {
    return this.scheduler.calculate(
      this.targets, this.memoParams[this.algorithm]()
    );
  }

  /* pick multi task from queue */
  pickMulti = (count = 1) => {
    return new Array(count).map(
      () => this.pickOne()
    );
  }

  /* clean data of a task or all task */
  clean = (id) => {
    if (id) {
      delete this.params.connectionsMap[id];
      delete this.params.cpuOccupancyMap[id];
      if (this.params.currentIndex === this.targets.length) {
        this.params.currentIndex --;
      }
    } else {
      this.params = {
        currentIndex: 0,
        connectionsMap: {},
        cpuOccupancyMap: {},
      };
    }
  }

  /*  */
  add = (task) => {
    this.targets.push(task);
    if (this.targets.find(target => target.id === task.id)) {
      return console.warn(`Add Operation: the task ${task.id} already exists.`);
    }
    this.targets.push(task);
  }

  /* remove target from queue */
  del = (target) => {
    let found = false;
    for (let i  = 0; i < this.targets.length; i++) {
      if (array[i].id === target.id) {
        this.targets.splice(i, 1);
        this.clean(target.id);
        found = true;
        break;
      }
    }

    if (!found) {
      console.warn(`Del Operation: the task ${target.id} is not found.`);
    }
  }

  /* wipe queue and data */
  wipe = () => {
    this.targets = [];
    this.clean();
  }

  /* update calculate params */
  updateParams = (object) => {
    Object.entries(object).map(([key, value]) => {
      if (key in this.params) {
        this.params[key] = value;
      }
    });
  }

  /* reset targets */
  setTargets = (targets) => {
    const targetsMap = targets.reduce((total, cur) => {
      total[cur.id] = 1;
      return total;
    }, {});
    this.targets.forEach(target => {
      if (!(target.id in targetsMap)) {
        this.clean(target.id);
      }
    });
    this.targets = targets;
  }

  /* change algorithm strategy */
  setAlgorithm = (algorithm) => {
    if (algorithm in CONSTS) {
      this.algorithm = algorithm;
      this.scheduler.setAlgorithm(this.algorithm);
    } else {
      throw new Error(`Invalid algorithm: ${algorithm}, pick from ${Object.keys(CONSTS).join('|')}`);
    }
  }
}

module.exports = LoadBalancer;