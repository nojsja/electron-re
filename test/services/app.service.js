const { MessageChannel } = require('../../lib');
const { ipcRenderer } = require('electron');

/* -------------- mainAndService -------------- */

ipcRenderer.on('mainAndService:test1', (event, result) => {
  ipcRenderer.send('mainAndService:test1', result);
});

ipcRenderer.on('mainAndService:test2', (event, result) => {
  ipcRenderer.send('mainAndService:test2', result);
});

ipcRenderer.once('mainAndService:test3', (event, result) => {
  ipcRenderer.send('mainAndService:test3', result);
});

ipcRenderer.once('mainAndService:test4', (event, result) => {
  ipcRenderer.invoke('mainAndService:test4', result);
});

ipcRenderer.once('mainAndService:test5', (event, result) => {
  MessageChannel.send('main', 'mainAndService:test5', result);
});

ipcRenderer.once('mainAndService:test6', (event, result) => {
  MessageChannel.invoke('main', 'mainAndService:test6', result);
});

MessageChannel.on('mainAndService:test7', (event, rsp) => {
  ipcRenderer.send('mainAndService:test7', rsp);
});

MessageChannel.once('mainAndService:test8', (event, rsp) => {
  ipcRenderer.send('mainAndService:test8', rsp);
});

MessageChannel.handle('mainAndService:test9', (event, rsp) => {
  return rsp;
});


/* -------------- rendererAndService -------------- */

ipcRenderer.on('rendererAndService:test1', (event, result) => {
  ipcRenderer.send('rendererAndService:test1', result);
});

MessageChannel.handle('rendererAndService:test2', (event, result) => {
  return result;
});

MessageChannel.on('rendererAndService:test3', (event, result) => {
  ipcRenderer.send('rendererAndService:test3', result);
});

ipcRenderer.once('rendererAndService:test4', (event, result) => {
  ipcRenderer.send('rendererAndService:test4', result);
});

/* -------------- serviceAndService -------------- */

ipcRenderer.once('serviceAndService:test1', (event, result) => {
  MessageChannel.send('other', 'serviceAndService:test1', result);
  ipcRenderer.once('serviceAndService:test1-callback', (event, rsp) => {
    ipcRenderer.send('serviceAndService:test1', rsp);
  });
});

ipcRenderer.once('serviceAndService:test2', (event, result) => {
  MessageChannel.invoke('other', 'serviceAndService:test2', result).then(rsp => {
    ipcRenderer.send('serviceAndService:test2', rsp);
  });
});

ipcRenderer.once('serviceAndService:test3', (event, result) => {
  MessageChannel.send('other', 'serviceAndService:test3', result);
  ipcRenderer.once('serviceAndService:test3-callback', (event, rsp) => {
    ipcRenderer.send('serviceAndService:test3', rsp);
  });
});

ipcRenderer.once('serviceAndService:test4', (event, result) => {
  MessageChannel.send('other', 'serviceAndService:test4', result);
  ipcRenderer.once('serviceAndService:test4-callback', (event, rsp) => {
    ipcRenderer.send('serviceAndService:test4', rsp);
  });
});