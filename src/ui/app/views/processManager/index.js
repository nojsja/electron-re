import React from 'react';
import { ipcRenderer, remote } from 'electron';

import ProcessTable from './ProcessTable';
import ToolBar from './ToolBar';
import ProcessConsole from './ProcessConsole'
import ProcessTrends from './ProcessTrends';

export default class ProcessManager extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      processData: null,
      selectedPid: null,
      processes: [],
      logs: { /* [pid]: [] */ },
      history:{
        /* [pid]: { memory: [], cpu: [] } */
      },
      types: {},
      sorting: {
        path: null,
        how: 'ascend'
      },
      logVisible: false,
      trendsVisible: false,
    }
  }


  componentDidMount() {
    ipcRenderer.on('process:update-list', (event, { records, types }) => {
      console.log('update:list');
      const { history } = this.state;
      for (let pid in records) {
        if (Object.hasOwnProperty.call(records, pid)) {
          history[pid] = history[pid] || { memory: [], cpu: [] };
          if (!records[pid]) continue;
          history[pid].memory.push(records[pid].memory);
          history[pid].cpu.push(records[pid].cpu);
          history[pid].memory = history[pid].memory.slice(-60);
          history[pid].cpu = history[pid].cpu.slice(-60);
        }
      }
      this.setState({
        processes: records,
        history,
        types
      });
    });

    ipcRenderer.on('process:stdout', (event, { pid, data }) => {
      console.log('process:stdout');
      const { logs } = this.state;
      logs[pid] = logs[pid] || [];
      logs[pid].unshift(`[${new Date().toLocaleTimeString()}]: ${data}`);
      logs[pid].slice(0, 1000);
      this.setState({
        logs
      });
    });
  }

  isPidValid = () => {
    const { selectedPid, processes } = this.state;
    if (!selectedPid) return false;

    return processes[selectedPid];
  }

  canKill = () => {
    const { selectedPid, types } = this.state;
    
    return this.isPidValid() &&
    ( types[selectedPid] !== 'main' &&
      types[selectedPid] !== 'manager' );
  }

  canOpenTrends = () => {
    return this.isPidValid();
  }

  canOpenConsole = () => {
    return this.isPidValid();
  }

  canOpenDevTool = () => {
    const { selectedPid, types } = this.state;

    return this.isPidValid() &&
      ( types[selectedPid] === 'renderer' ||
        types[selectedPid] === 'service' );
  }

  handleKillProcess = () => {
    const pid = this.state.selectedPid;

    if (!pid) return;
    ipcRenderer.send('process:kill-process', pid);
  }

  handleOpenDevTool = () => {
    const pid = this.state.selectedPid;
    ipcRenderer.send('process:open-devtools', pid);
  }

  handleOpenConsole = (status=true) => {
    this.setState({
      logVisible: status
    });
  }

  handleOpenTrends = (status=true) => {
    this.setState({
      trendsVisible: status
    });
  }

  render () {
    const { logVisible, logs, selectedPid, trendsVisible, history } = this.state;
    return (
      <React.Fragment>
        <header className="toolbar toolbar-header">
          <ToolBar
            disableKill={!this.canKill()}
            onKillClick={this.handleKillProcess}
            disabelOpenDevTool={!this.canOpenDevTool()}
            disableConsole={!this.canOpenConsole()}
            disableTrends={!this.canOpenTrends()}
            onOpenDevToolClick={this.handleOpenDevTool}
            onOpenConsoleClick={this.handleOpenConsole}
            onOpenTrendsClick={this.handleOpenTrends}
          />
        </header>
        <div className="process-table-container">
          <ProcessTable
            data={this.state.processes}
            selectedPid={this.state.selectedPid}
            sorting={this.state.sorting}
            types={this.state.types}
            onSortingChange={sorting => this.setState({ sorting })}
            onSelectedPidChange={pid => this.setState({ selectedPid: pid })}
            />
        </div>
        <ProcessConsole
          handleOpenConsole={this.handleOpenConsole}
          visible={logVisible}
          logs={logs[selectedPid]}
        />
        <ProcessTrends
          handleOpenTrends={this.handleOpenTrends}
          visible={trendsVisible}
          memory={(history[selectedPid] || {}).memory || []}
          cpu={(history[selectedPid] || {}).cpu || []}
        />
      </React.Fragment>
    )
  }
}
