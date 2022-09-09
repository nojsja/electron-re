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
const ProcessManager = require('../ProcessManager');

/* Load Balance Instance */
class LoadBalancer {
  /**
    * @param  {Object} options [ options object ]
    * @param  {Array } options.targets [ targets for load balancing calculation: [{id: 1, weight: 1}, {id: 2, weight: 2}] ]
    * @param  {String} options.algorithm [ strategies for load balancing calculation : RANDOM | POLLING | WEIGHTS | SPECIFY | WEIGHTS_RANDOM | WEIGHTS_POLLING | MINIMUM_CONNECTION | WEIGHTS_MINIMUM_CONNECTION]
    */
  constructor(options) {
    this.targets = options.targets;
    this.algorithm = options.algorithm || POLLING;
    this.params = { // data for algorithm
      currentIndex: 0, // index
      weightIndex: 0, // index for weight alogrithm
      weightTotal: 0, // total weight
      connectionsMap: {}, // connections of each target
      cpuOccupancyMap: {}, // cpu occupancy of each target
      memoryOccupancyMap: {}, // cpu occupancy of each target
    };
    this.scheduler = new Scheduler(this.algorithm);
    this.memoParams = this.memorizedParams();
    this.calculateWeightIndex();
    ProcessManager.on('refresh', this.refreshParams);
  }

  /* params formatter */
  memorizedParams = () => {
    return {
      [RANDOM]: () => [],
      [POLLING]: () => [this.params.currentIndex, this.params],
      [WEIGHTS]: () => [this.params.weightTotal, this.params],
      [SPECIFY]: (id) => [id],
      [WEIGHTS_RANDOM]: () => [this.params.weightTotal],
      [WEIGHTS_POLLING]: () => [this.params.weightIndex, this.params.weightTotal, this.params],
      [MINIMUM_CONNECTION]: () => [this.params.connectionsMap],
      [WEIGHTS_MINIMUM_CONNECTION]: () => [this.params.weightTotal, this.params.connectionsMap, this.params],
    };
  }

  /* refresh params data */
  refreshParams = (pidMap) => {
    const infos = Object.values(pidMap);
    for (let info of infos) {
      // this.params.connectionsMap[id] = connections;
      this.params.cpuOccupancyMap[info.pid] = info.cpu;
      this.params.memoryOccupancyMap[info.pid] = info.memory;
    }
  }

  /* pick one task from queue */
  pickOne = (...params) => {
    return this.scheduler.calculate(
      this.targets, this.memoParams[this.algorithm](...params)
    );
  }

  /* pick multi task from queue */
  pickMulti = (count = 1, ...params) => {
    return new Array(count).fill().map(
      () => this.pickOne(...params)
    );
  }

  /* calculate weight */
  calculateWeightIndex = () => {
    this.params.weightTotal = this.targets.reduce((total, cur) => total + (cur.weight || 0), 0);
    if (this.params.weightIndex > this.params.weightTotal) {
      this.params.weightIndex = this.params.weightTotal;
    }
  }

  /* calculate index */
  calculateIndex = () => {
    if (this.params.currentIndex >= this.targets.length) {
      this.params.currentIndex = (this.params.currentIndex - 1 >= 0) ? (this.params.currentIndex - 1) : 0;
    }
  }

  /* clean data of a task or all task */
  clean = (id) => {
    if (id) {
      delete this.params.connectionsMap[id];
      delete this.params.cpuOccupancyMap[id];
      delete this.params.memoryOccupancyMap[id];
    } else {
      this.params = {
        currentIndex: 0,
        connectionsMap: {},
        cpuOccupancyMap: {},
        memoryOccupancyMap: {},
      };
    }
  }

  /* add a task */
  add = (task) => {
    if (this.targets.find(target => target.id === task.id)) {
      return console.warn(`Add Operation: the task ${task.id} already exists.`);
    }
    this.targets.push(task);
    this.calculateWeightIndex();
  }

  /* remove target from queue */
  del = (target) => {
    let found = false;
    for (let i  = 0; i < this.targets.length; i++) {
      if (this.targets[i].id === target.id) {
        this.targets.splice(i, 1);
        this.clean(target.id);
        this.calculateIndex();
        found = true;
        break;
      }
    }

    if (found) {
      this.calculateWeightIndex();
    } else {
      console.warn(`Del Operation: the task ${target.id} is not found.`, this.targets);
    }
  }

  /* wipe queue and data */
  wipe = () => {
    this.targets = [];
    this.calculateWeightIndex();
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
        this.calculateIndex();
      }
    });
    this.targets = targets;
    this.calculateWeightIndex();
  }

  /* change algorithm strategy */
  setAlgorithm = (algorithm) => {
    if (algorithm in CONSTS) {
      this.algorithm = algorithm;
      this.params.weightIndex = 0;
      this.scheduler.setAlgorithm(this.algorithm);
    } else {
      throw new Error(`Invalid algorithm: ${algorithm}, pick from ${Object.keys(CONSTS).join('|')}`);
    }
  }
}

module.exports = Object.assign(LoadBalancer, { ALGORITHM: CONSTS });