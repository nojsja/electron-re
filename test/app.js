const { ipcRenderer } = require('electron');
const { MessageChannel } = require('../lib');

/* -------------- mainAndRenderer -------------- */

ipcRenderer.once('mainAndRenderer:test1', (event, result) => {
  console.log('rendererAndService:test1');
  try {
    ipcRenderer.send('mainAndRenderer:test1', result);
  } catch (error) {
    console.log(error);
  }
});

ipcRenderer.once('mainAndRenderer:test2', (event, result) => {
  ipcRenderer.send('mainAndRenderer:test2', result);
});

ipcRenderer.once('mainAndRenderer:test3', (event, result) => {
  ipcRenderer.send('mainAndRenderer:test3', result);
});

ipcRenderer.once('mainAndRenderer:test4', (event, result) => {
  ipcRenderer.invoke('mainAndRenderer:test4', result);
});

ipcRenderer.once('mainAndRenderer:test5', (event, result) => {
  MessageChannel.send('main', 'mainAndRenderer:test5', result);
});

ipcRenderer.once('mainAndRenderer:test6', (event, result) => {
  MessageChannel.invoke('main', 'mainAndRenderer:test6', result);
});

MessageChannel.on('mainAndRenderer:test7', (event, rsp) => {
  ipcRenderer.send('mainAndRenderer:test7', rsp);
});

MessageChannel.once('mainAndRenderer:test8', (event, rsp) => {
  ipcRenderer.send('mainAndRenderer:test8', rsp);
});


/* -------------- rendererAndService -------------- */

ipcRenderer.on('rendererAndService:test1', (event, result) => {
  MessageChannel.send('app', 'rendererAndService:test1', result);
});

MessageChannel.on('rendererAndService:test2', (event, result) => {
  MessageChannel.invoke('app', 'rendererAndService:test2', result).then(rsp => {
    ipcRenderer.send('rendererAndService:test2', rsp);
  });
});

ipcRenderer.once('rendererAndService:test3', (event, result) => {
  MessageChannel.send('app', 'rendererAndService:test3', result);
});

ipcRenderer.once('rendererAndService:test4', (event, result) => {
  MessageChannel.send('app', 'rendererAndService:test4', result);
});
