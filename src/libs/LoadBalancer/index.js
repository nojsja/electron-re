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
    this.params = { // data for algorithm
      currentIndex: 0, // index
      connectionsMap: {}, // connections of each target
      cpuOccupancyMap: {}, // cpu occupancy of each target
    };
    this.scheduler = new Scheduler(this.algorithm, this.targets);
    this.memoParams = this.memorizedParams();
  }

  /* pick one task from queue */
  pickOne() {
    return this.scheduler.calculate(
      this.targets.map(target => Object.assign(
        target,
        { params: this.getParams(this.algorithm, target.id) })
      )
    );
  }

  /* pick multi task from queue */
  pickMulti(count = 1) {
    const formattedTargets =
      this.targets.map(target => Object.assign(
        target,
        { params: this.getParams(this.algorithm, target.id) })
      );

    return new Array(count).map(() => this.scheduler.calculate(formattedTargets));
  }

  /* clean data of a task or all task */
  clean(id) {
    if (id) {
      delete this.params.connectionsMap[id];
      delete this.params.cpuOccupancyMap[id];
    } else {
      this.params = {
        currentIndex: 0,
        connectionsMap: {},
        cpuOccupancyMap: {},
      };
    }
  }

  /* remote target from queue */
  del(target) {
    this.targets = this.targets.filter(t => t.id !== target.id);
    this.clean(target.id);
  }

  /* wipe queue and data */
  wipe() {
    this.targets = [];
    this.clean();
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

  /* params formatter */
  memorizedParams() {
    return {
      [POLLING]: () => ({ currentIndex: this.currentIndex }),
      [WEIGHTS]: () => ({ }),
      [RANDOM]: () => ({ }),
      [SPECIFY]: () => ({ }),
      [MINIMUM_CONNECTION]: () => ({ count: this.params.connectionsMap[id] || 0 }),
      [WEIGHTS_POLLING]: () => ({ }),
      [WEIGHTS_RANDOM]: () => ({ }),
      [WEIGHTS_MINIMUM_CONNECTION]: ({ count: this.params.connectionsMap[id] || 0 }),
    };
  }

  /* get algorithm params */
  getParams(algorithm, id) {
    return this.memoParams[algorithm](id);
  }

  /* reset targets */
  setTargets(targets) {
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
    this.scheduler.setTasks(targets);
  }

  /* change algorithm strategy */
  setAlgorithm(algorithm) {
    if (algorithm in CONSTS) {
      this.algorithm = algorithm;
    } else {
      throw new Error(`Invalid algorithm: ${algorithm}, pick from ${Object.keys(CONSTS).join('|')}`);
    }
  }
}

module.exports = LoadBalancer;