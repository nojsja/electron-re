const { ipcMain } = require('electron');

const base = (process.env.NODE_ENV === 'test:src') ? 'src' : 'lib';
const {
  MessageChannel,
} = require(`../${base}`);

/* -------------- main <-> renderer -------------- */
const mainAndRenderer = () => {
  describe('▹ Communication between main and renderer with [MessageChannel]', () => {
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
  describe('▹ Communication between main and service with [MessageChannel]', () => {
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
  describe('▹ Communication between renderer and service with [MessageChannel]', () => {
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
  describe('▹ Communication between service and service with [MessageChannel]', () => {
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

module.exports = () => {
  describe('▸ BrowserService Test', () => {
    mainAndRenderer();
    mainAndService();
    rendererAndService();
    serviceAndService();
  });
};