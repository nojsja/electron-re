  const ProcessHost = require('../../src/libs/ProcessHost.class');

  let count = 0;
  const timer = setInterval(() => {
    console.log('test data for child process console');
    if (count++ > 100) clearInterval(timer);
  }, 1e3);

  ProcessHost
    .registry('test1', (params) => {
      return params;
    })
    .registry('test2', (params) => {
      return params;
    })
    .registry('test3', (params) => {
      return params;
    })
    .registry('test4', (params) => {
      return params;
    })
    .registry('test5', (params) => {
      return params;
    })
    .registry('test6', (params) => {
      return params;
    });