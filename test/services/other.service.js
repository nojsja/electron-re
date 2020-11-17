const { MessageChannel } = require('../../lib');
const { ipcRenderer } = require('electron');

/* -------------- serviceAndService -------------- */

ipcRenderer.on('serviceAndService:test1', (event, result) => {
  ipcRenderer.sendTo(event.senderId, 'serviceAndService:test1-callback', result);
});

MessageChannel.handle('serviceAndService:test2', (event, result) => {
  return result;
});

MessageChannel.on('serviceAndService:test3', (event, result) => {
  MessageChannel.send('app', 'serviceAndService:test3-callback', result);
});

MessageChannel.once('serviceAndService:test4', (event, result) => {
  MessageChannel.send('app', 'serviceAndService:test4-callback', result);
});
