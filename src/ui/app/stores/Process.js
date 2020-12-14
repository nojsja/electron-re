import { observable } from 'mobx';
const { ipcRenderer } = require('electron');

class Process {
  constructor() {
    ipcRenderer.on('process:update-list', (event, args) => {
      console.log(args);
    });
  }

  @observable instances = [
    {
      name: 'a',
      cpu: '',
      memory: '',
      io: ''
    },
    {
      name: 'b',
      cpu: '',
      memory: '',
      io: ''
    }
  ]

  updateList(records) {
    console.log(records);
  }
}

export default Process;