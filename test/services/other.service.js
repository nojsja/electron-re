const { MessageChannel } = require('../../lib');
const { ipcRenderer } = require('electron');

let count = 0;
const timer = setInterval(() => {
  console.log('test data for service[other] console');
  if (count++ > 100) clearInterval(timer);
}, 1e3);


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
