import * as React from 'react';
import { ipcRenderer, remote } from 'electron';

import { ProcessTable }from './ProcessTable';
import { ToolBar } from './ToolBar';
import { ProcessConsole } from './ProcessConsole'
import { ProcessSignals } from './ProcessSignals'
import { ProcessTrends } from './ProcessTrends';

import { record, sorting, signal, ProcessManagerState } from '../../types';

interface stdData {
  pid: number,
  data: string
}

export class ProcessManager extends React.Component<{}, ProcessManagerState> {
  constructor(props: object) {
    super(props);
    this.state = {
      processes: [],
      logs: { /* [pid]: [] */ },
      history: {
        /* [pid]: { memory: [], cpu: [] } */
      },
      signals: [],
      types: {},
      sorting: {
        path: 'pid',
        how: 'ascend'
      },
      logVisible: false,
      signalVisible: false,
      trendsVisible: false,
      selectedPid: 0,
  
    }
  }


  componentDidMount() {
    ipcRenderer.on('process:update-list', (event, { records, types }) => {
      console.log('update:list');
      const { history } = this.state;
      for (let pid in records as record) {
        history[pid] = history[pid] || { memory: [], cpu: [] };
        if (!records[pid]) continue;
        history[pid].memory.push(records[pid].memory);
        history[pid].cpu.push(records[pid].cpu);
        history[pid].memory = history[pid].memory.slice(-60);
        history[pid].cpu = history[pid].cpu.slice(-60);
      }
      this.setState({
        processes: records,
        history,
        types
      });
    });

    ipcRenderer.on('process:stdout', (event, dataArray: stdData[]) => {
      console.log('process:stdout');
      const { logs } = this.state;
      dataArray.forEach(({ pid, data })=> {
        logs[pid] = logs[pid] || [];
        logs[pid].unshift(`[${new Date().toLocaleTimeString()}]: ${data}`);
      });
      Object.keys(logs).forEach((pid: string) => {
        logs[Number(pid)].slice(0, 1000);
      });
      this.setState({ logs });
    });
    
    ipcRenderer.on('process:catch-signal', (event, { type, data }) => {
      console.log('process:catch-signal');
      let { signals } = this.state;
      signals.push({
        type, data
      });
      signals = signals.slice(-1000);
      this.setState({ signals });
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
    ( types[selectedPid] &&
      types[selectedPid].type !== 'main' &&
      types[selectedPid].type !== 'manager' );
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
      ( types[selectedPid] &&
        types[selectedPid].type === 'renderer' ||
        types[selectedPid].type === 'service' );
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

  handleOpenConsole = (status=true, attr: 'logVisible' | 'signalVisible') => {
    if (attr === 'logVisible') {
      this.setState({
        'logVisible': status
      });
    } else if (attr === 'signalVisible') {
      this.setState({
        'signalVisible': status
      });
    }
  }

  handleOpenTrends = (status=true) => {
    this.setState({
      trendsVisible: status
    });
  }

  render () {
    const {
      logVisible, logs, selectedPid, trendsVisible, history,
      signals, signalVisible
    } = this.state;
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
        <ProcessSignals
          handleOpenConsole={this.handleOpenConsole}
          visible={signalVisible}
          signals={signals}
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
