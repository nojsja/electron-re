
  process.on('message', ({ action, params, id }) => {
     
    switch(action) {
      case 'test1':
        process.send({ result: params, id });
        break;
      case 'test2':
        process.send({ result: params, id });
        break;
      case 'test3':
        process.send({ result: params, id });
        break;
      default:
        break;
    }

  });