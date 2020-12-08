  const ProcessHost = require('../../src/libs/ProcessHost.class');
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