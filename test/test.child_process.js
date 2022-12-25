const path = require('path');

const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const {
  ChildProcessPool,
  LoadBalancer,
  ProcessLifeCycle,
} = require(`../${base}`);

/* -------------- ChildProcessPool -------------- */
const childProcessPool = () => {
  const maxProcessCount = 3;
  const idForTest5 = 'test5id';
  let pids = [];
  const processPool = new ChildProcessPool({
    path: path.join(__dirname, 'child_process/child1.js'),
    max: maxProcessCount,
    strategy: LoadBalancer.ALGORITHM.WEIGHTS_POLLING,
    weights: [1, 2, 3],
    env: {
      cwd: path.basename(path.join(__dirname, 'child_process/child1.js'))
    }
  });
  
  describe('▹ ChildProcessPool/ProcessHost test', () => {
    it('send request to a process in processPool and get response data', (callback) => {
      const results = [];
      for (let i = 0; i < maxProcessCount; i++) {
        processPool.send('test1', { value: "test1" }).then((rsp) => {
          pids.push(rsp.result.id);
          pids = pids.sort((a, b) => a - b);
          results.push(rsp);
          if (rsp.result.value === 'test1') {
            if (
              results.length === maxProcessCount &&
              Array.from(new Set(pids)).length === pids.length
            ) {
              callback();
            }
          } else {
            callback('test1 failed!');
          }
        });
      }
    });

    it('send request to a process in processPool and get response data2', (callback) => {
      processPool.send('test2', { value: "test2" }).then((rsp) => {
        if (rsp.result.value === 'test2') {
          callback();
        } else {
          callback('test2 failed!');
        }
      });
    });

    it(`the count of child processes should be equal to ${maxProcessCount}`, (callback) => {
      processPool.send('test3', { value: "test3" }).then((rsp) => {
        if (
          !rsp.error &&
          rsp.result.value === 'test3' &&
          processPool.forked.length === maxProcessCount
        ) {
          callback();
        } else {
          callback('test3 failed!');
        }
      });
    });

    it('send request to all process in processPool and get all response', (callback) => {
      processPool.sendToAll('test4', { value: "test4" }).then((rsp) => {
        if (
          rsp.length === 3 &&
          processPool.forked.length === 3 &&
          rsp.every(info => (!info.error && info.result.value === "test4"))
        ) {
          callback();
        } else {
          callback('test4 failed!');
        }
      });
    });

    it('kill a process in processPool and get sub processes count', (callback) => {
      processPool.send('test5', { value: "test5" }, idForTest5).then(async (rsp) => {
        if (rsp.result.value === "test5") {
          processPool.kill(idForTest5);
          setTimeout(() => {
            if (processPool.forked.length === (maxProcessCount - 1))
              callback();
            else
              callback("test5 failed!")
          }, 2e3);
        } else {
          callback("test5 failed!");
        }
      });
    });

    it('set max instance count limit of processPool', (callback) => {
      processPool.setMaxInstanceLimit(10);
      if (processPool.maxInstance === 10) {
        callback();
      } else {
        callback('test6 failed!');
      }
    });
  });
}

/* -------------- LoadBalancer -------------- */
const loadBalancer = () => {
  const targets = [
    {id: 1, weight: 3},
    {id: 2, weight: 1},
    {id: 3, weight: 1},
    {id: 4, weight: 1},
    {id: 5, weight: 1},
    {id: 6, weight: 5},
    {id: 7, weight: 1},
    {id: 8, weight: 1},
    {id: 9, weight: 1},
    {id: 10, weight: 2},
  ];
  const loadBalancer = new LoadBalancer({
    targets,
    algorithm: LoadBalancer.ALGORITHM.WEIGHTS,
  });

  describe('▹ LoadBalancer Test', () => {
    it('create a loadbalancer instance which has 10 targets', (callback) => {
      if (loadBalancer.targets.length === 10) {
        callback();
      } else {
        callback('test1 failed!');
      }
    });

    it('pick one from the loadbalancer instance [WEIGHTS]', (callback) => {
      const target = loadBalancer.pickOne();
      if (target) {
        console.log('      WEIGHTS:', target);
        callback();
      } else {
        callback('test2 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS]', (callback) => {
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      WEIGHTS: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test3 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [POLLING]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.POLLING);
      const targets = loadBalancer.pickMulti(15);
      if (targets && targets.length === 15) {
        console.log('      POLLING: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test4 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [RANDOM]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.RANDOM);
      const targets = loadBalancer.pickMulti(15);
      if (targets && targets.length === 15) {
        console.log('      RANDOM: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test5 failed!');
      }
    });

    it('pick one from the loadbalancer instance [SPECIFY]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.SPECIFY);
      const target = loadBalancer.pickOne(5);
      if (target && target.id === 5) {
        callback();
      } else {
        callback('test6 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS_POLLING]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.WEIGHTS_POLLING);
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      WEIGHTS_POLLING: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test7 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS_RANDOM]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.WEIGHTS_RANDOM);
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      WEIGHTS_RANDOM: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test8 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [MINIMUM_CONNECTION]', (callback) => {
      const connectionsMap = {
        1: 1,
        2: 2,
        3: 5,
        4: 2,
        5: 1,
        6: 1,
        7: 0,
        8: 1,
        9: 1,
        10: 1
      };
      loadBalancer.updateParams({
        connectionsMap,
      });
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.MINIMUM_CONNECTION);
      const target = loadBalancer.pickOne();
      if (target && target.id === 7 &&  connectionsMap[target.id] === 0) {
        callback();
      } else {
        callback('test9 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS_MINIMUM_CONNECTION]', (callback) => {
      const connectionsMap = {
        1: 1,
        2: 2,
        3: 5,
        4: 2,
        5: 1,
        6: 1,
        7: 0,
        8: 1,
        9: 1,
        10: 1
      };
      loadBalancer.updateParams({
        connectionsMap,
      });
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.WEIGHTS_MINIMUM_CONNECTION);
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      WEIGHTS_MINIMUM_CONNECTION: ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test10 failed!');
      }
    });

  });
};

/* -------------- process lifecycle -------------- */

const processLifecycle = () => {
  const lifecycle = new ProcessLifeCycle({
    expect: 2e3,
    internal: 1e3
  });
  let sleeping = [];
  const processes = [1, 2, 3, 4, 5];

  lifecycle.on('sleep', pids => {
    sleeping = pids;
  });

  lifecycle.watch(processes);
  
  describe('▹ Process LifeCycle Test', () => {
    it('create a lifecycle instance which has 5 targets', (callback) => {
      if (lifecycle.params.activities.size === 5) {
        callback();
      } else {
        callback('test1 failed!');
      }
    });

    it('sleep test: wait for 4 seconds and all processes are sleeping', (callback) => {
      lifecycle.refresh(processes);
      lifecycle.start();
      setTimeout(() => {
        if (sleeping.length === 5) {
          callback();
        } else {
          callback('test2 failed');
        }
        lifecycle.stop();
      }, 4e3);
    });

    it('sleep test: wake up 1 process', (callback) => {
      lifecycle.refresh([1]);
      lifecycle.start();
      setTimeout(() => {
        if (sleeping.length === 4 && !sleeping.includes(1)) {
          callback();
        } else {
          callback('test3 failed');
        }
        lifecycle.stop();
      }, 1.8e3);
    });

    it('sleep test: wake up all processes', (callback) => {
      sleeping = [];
      lifecycle.refresh(processes);
      lifecycle.start();
      setTimeout(() => {
        if (sleeping.length === 0) {
          callback();
        } else {
          callback('test4 failed');
        }
        lifecycle.stop();
      }, 1.5e3);
    });
  });
};

module.exports = () => {
  describe('▸ ChildProcessPool Test', () => {
    childProcessPool();
    loadBalancer();
    processLifecycle();
  });
};