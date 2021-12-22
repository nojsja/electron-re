const { ipcMain, ipcRenderer } = require('electron');
const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const { MessageChannel, ChildProcessPool, LoadBalancer, ProcessLifeCycle } = require(`../${base}`);
const path = require('path');

/* -------------- main <-> renderer -------------- */
const mainAndRenderer = () => {
  describe('▸ Communication between main and renderer with [MessageChannel]', () => {
    it('main send data to renderer using [sendTo]', (callback) => {
      MessageChannel.sendTo(global.mainWindow.id, 'mainAndRenderer:test1', { value: 'test1' });

      ipcMain.once('mainAndRenderer:test1', (event, result) => {
        if (result && result.value === 'test1') {
          callback();
        } else {
          callback('test1 failed!');
        }
      });

    });

    it('main listens a channel using [on]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test2', { value: 'test2' });
      MessageChannel.on('mainAndRenderer:test2', (event, result) => {
        if (result && result.value === 'test2') {
          callback();
        } else {
          callback('test2 failed!');
        }
      });
    });

    it('main listens a channel using [once]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test3', { value: 'test3' });
      MessageChannel.once('mainAndRenderer:test3', (event, result) => {
        if (result && result.value === 'test3') {
          callback();
        } else {
          callback('test3 failed!');
        }
      });
    });

    it('main handle a channel signal using [handle]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test4', { value: 'test4' });
      MessageChannel.handle('mainAndRenderer:test4', (event, result) => {
        return new Promise(resolve => {
          if (result && result.value === 'test4') {
            callback();
          } else {
            callback('test4 failed!');
          }
          resolve(result);
        })
      });
    });

    it('renderer send data to main using [send]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test5', { value: 'test5' });
      ipcMain.on('mainAndRenderer:test5', (event, result) => {
        if (result && result.value === 'test5') {
          callback();
        } else {
          callback('test5 failed!');
        }
      });
    });

    it('renderer send data to main using [invoke]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test6', { value: 'test6' });
      ipcMain.handle('mainAndRenderer:test6', (event, result) => {
        return new Promise(resolve => {
          if (result && result.value === 'test6') {
            callback();
          } else {
            callback('test6 failed!');
          }
          resolve(result);
        })
      });
    });

    it('renderer listens a channel using [on]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test7', { value: 'test7' });
      ipcMain.once('mainAndRenderer:test7', (event, result) => {
        if (result && result.value === 'test7') {
          callback();
        } else {
          callback('test7 failed!');
        }
      });
    });

    it('renderer listens a channel using [once]', (callback) => {
      global.mainWindow.webContents.send('mainAndRenderer:test8', { value: 'test8' });
      ipcMain.once('mainAndRenderer:test8', (event, result) => {
        if (result && result.value === 'test8') {
          callback();
        } else {
          callback('test8 failed!');
        }
      });
    });

  })
};

/* -------------- main <-> service -------------- */
const mainAndService = () => {
  describe('▸ Communication between main and service with [MessageChannel]', () => {
    it('main send data to service using [send]', (callback) => {
      MessageChannel.send('app', 'mainAndService:test1', { value: 'test1' });
      ipcMain.once('mainAndService:test1', (event, result) => {
        if (result && result.value === 'test1') {
          callback();
        } else {
          callback('test1 failed!');
        }
      });

    });

    it('main listens a channel using [on]', (callback) => {
      global.appService.webContents.send('mainAndService:test2', { value: 'test2' });
      MessageChannel.on('mainAndService:test2', (event, result) => {
        if (result && result.value === 'test2') {
          callback();
        } else {
          callback('test2 failed!');
        }
      });
    });

    it('main listens a channel using [once]', (callback) => {
      global.appService.webContents.send('mainAndService:test3', { value: 'test3' });
      MessageChannel.once('mainAndService:test3', (event, result) => {
        if (result && result.value === 'test3') {
          callback();
        } else {
          callback('test3 failed!');
        }
      });
    });

    it('main handle a channel signal using [handle]', (callback) => {
      global.appService.webContents.send('mainAndService:test4', { value: 'test4' });
      MessageChannel.handle('mainAndService:test4', (event, result) => {
        return new Promise(resolve => {
          if (result && result.value === 'test4') {
            callback();
          } else {
            callback('test4 failed!');
          }
          resolve(result);
        })
      });
    });

    it('service send data to main using [send]', (callback) => {
      global.appService.webContents.send('mainAndService:test5', { value: 'test5' });
      ipcMain.on('mainAndService:test5', (event, result) => {
        if (result && result.value === 'test5') {
          callback();
        } else {
          callback('test5 failed!');
        }
      });
    });

    it('service send data to main using [invoke]', (callback) => {
      global.appService.webContents.send('mainAndService:test6', { value: 'test6' });
      ipcMain.handle('mainAndService:test6', (event, result) => {
        return new Promise(resolve => {
          if (result && result.value === 'test6') {
            callback();
          } else {
            callback('test6 failed!');
          }
          resolve(result);
        })
      });
    });

    it('service listens a channel using [on]', (callback) => {
      global.appService.webContents.send('mainAndService:test7', { value: 'test7' });
      ipcMain.once('mainAndService:test7', (event, result) => {
        if (result && result.value === 'test7') {
          callback();
        } else {
          callback('test7 failed!');
        }
      });
    });

    it('service listens a channel using [once]', (callback) => {
      global.appService.webContents.send('mainAndService:test8', { value: 'test8' });
      ipcMain.once('mainAndService:test8', (event, result) => {
        if (result && result.value === 'test8') {
          callback();
        } else {
          callback('test8 failed!');
        }
      });
    });

    it('service handle a channel signal using [handle]', (callback) => {
      MessageChannel.invoke('app', 'mainAndService:test9', { value: 'test9' }).then(result => {
        if (result && result.value === 'test9') {
          callback();
        } else {
          callback('test9 failed!');
        }
      });
    });

  })
}

/* -------------- renderer <-> service -------------- */
const rendererAndService = () => {
  describe('▸ Communication between renderer and service with [MessageChannel]', () => {
    it('renderer send data to service using [send]', (callback) => {
      global.mainWindow.webContents.send('rendererAndService:test1', { value: 'test1' });

      ipcMain.once('rendererAndService:test1', (event, result) => {
        if (result && result.value === 'test1') {
          callback();
        } else {
          callback('test1 failed!');
        }
      });

    });

    it('renderer send data to service using [invoke]', (callback) => {
      global.mainWindow.webContents.send('rendererAndService:test2', { value: 'test2' });
      
      ipcMain.once('rendererAndService:test2', (event, result) => {
        if (result && result.value === 'test2') {
          callback();
        } else {
          callback('test2 failed!');
        }
      });
    });

    it('service listens a channel using [on]', (callback) => {
      global.mainWindow.webContents.send('rendererAndService:test3', { value: 'test3' });
      ipcMain.once('rendererAndService:test3', (event, result) => {
        if (result && result.value === 'test3') {
          callback();
        } else {
          callback('test3 failed!');
        }
      });
    });

    it('service listens a channel using [once]', (callback) => {
      global.mainWindow.webContents.send('rendererAndService:test4', { value: 'test4' });
      ipcMain.once('rendererAndService:test4', (event, result) => {
        if (result && result.value === 'test4') {
          callback();
        } else {
          callback('test4 failed!');
        }
      });
    });

  })
};

/* -------------- service <-> service -------------- */
const serviceAndService = () => {
  describe('▸ Communication between service and service with [MessageChannel]', () => {
    it('service send data to service using [send]', (callback) => {
      global.appService.webContents.send('serviceAndService:test1', { value: 'test1' });

      ipcMain.once('serviceAndService:test1', (event, result) => {
        if (result && result.value === 'test1') {
          callback();
        } else {
          callback('test1 failed!');
        }
      });

    });

    it('service send data to service using [invoke]', (callback) => {
      global.appService.webContents.send('serviceAndService:test2', { value: 'test2' });
      
      ipcMain.once('serviceAndService:test2', (event, result) => {
        if (result && result.value === 'test2') {
          callback();
        } else {
          callback('test2 failed!');
        }
      });
    });

    it('service listens a channel using [on]', (callback) => {
      global.appService.webContents.send('serviceAndService:test3', { value: 'test3' });
      ipcMain.once('serviceAndService:test3', (event, result) => {
        if (result && result.value === 'test3') {
          callback();
        } else {
          callback('test3 failed!');
        }
      });
    });

    it('service listens a channel using [once]', (callback) => {
      global.appService.webContents.send('serviceAndService:test4', { value: 'test4' });
      ipcMain.once('serviceAndService:test4', (event, result) => {
        if (result && result.value === 'test4') {
          callback();
        } else {
          callback('test4 failed!');
        }
      });
    });

  })
}

/* -------------- ChildProcessPool -------------- */
const childProcessPool = () => {
  const maxProcessCount = 3;
  const idForTest5 = 'test5id';
  const processPool = new ChildProcessPool({
    path: path.join(__dirname, 'child_process/child1.js'),
    max: maxProcessCount,
    strategy: LoadBalancer.ALGORITHM.WEIGHTS,
    weights: [1, 2, 3],
    env: {
      cwd: path.basename(path.join(__dirname, 'child_process/child1.js'))
    }
  });
  
  describe('▸ ChildProcessPool/ProcessHost test', () => {
    it('send request to a process in processPool and get response data', (callback) => {
      processPool.send('test1', { value: "test1" }).then((rsp) => {
        if (rsp.result.value === 'test1') {
          callback();
        } else {
          callback('test1 failed!');
        }
      });
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

    it(`the count of child processes should be equal to ${3}`, (callback) => {
      processPool.send('test3', { value: "test3" }).then((rsp) => {
        if (
          !rsp.error &&
          rsp.result.value === 'test3' &&
          processPool.forked.length === 3
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
          }, 1e3);
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

  describe('▸ LoadBalancer Test', () => {
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
        console.log('      ', target);
        callback();
      } else {
        callback('test2 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS]', (callback) => {
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test3 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [POLLING]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.POLLING);
      const targets = loadBalancer.pickMulti(15);
      if (targets && targets.length === 15) {
        console.log('      ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test4 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [RANDOM]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.RANDOM);
      const targets = loadBalancer.pickMulti(15);
      if (targets && targets.length === 15) {
        console.log('      ', targets.map(target => target.id).join(','));
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
        console.log('      ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test7 failed!');
      }
    });

    it('pick ten from the loadbalancer instance [WEIGHTS_RANDOM]', (callback) => {
      loadBalancer.setAlgorithm(LoadBalancer.ALGORITHM.WEIGHTS_RANDOM);
      const targets = loadBalancer.pickMulti(10);
      if (targets && targets.length === 10) {
        console.log('      ', targets.map(target => target.id).join(','));
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
        console.log('      ', targets.map(target => target.id).join(','));
        callback();
      } else {
        callback('test10 failed!');
      }
    });

  });
};

/* process lifecycle */

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
  
  describe('▸ Process LifeCycle Test', () => {
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

module.exports = {
  run: () => {
    mainAndRenderer();
    mainAndService();
    rendererAndService();
    serviceAndService();
    childProcessPool();
    loadBalancer();
    processLifecycle();
  }
};