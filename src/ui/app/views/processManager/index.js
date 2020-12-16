import React from 'react';
import { ipcRenderer, remote } from 'electron';

import { formatSizeStr } from 'utils/utils';

import ProcessTable from './ProcessTable';
import ToolBar from './ToolBar';
import ProcessConsole from './ProcessConsole'

export default class ProcessManager extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      processData: null,
      selectedPid: null,
      logVisible: false,
      processes: [],
      logs: {
        // [pid]: []
      },
      types: {},
      sorting: {
        path: null,
        how: 'ascend'
      }
    }
  }


  componentDidMount() {
    ipcRenderer.on('process:update-list', (event, { records, types }) => {
      this.setState({
        processes: records,
        types
      });
    });

    ipcRenderer.on('process:stdout', (event, { pid, data }) => {
      const { logs } = this.state;
      logs[pid] = logs[pid] || [];
      logs[pid].unshift(data);
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
    let bool;

    if (!selectedPid) return false;

    bool =
      this.isPidValid() &&
      ( types[selectedPid] !== 'main' &&
        types[selectedPid] !== 'manager' );
    
    return bool;
  }

  canOpenConsole = () => {
    const { selectedPid, types } = this.state;
    let bool;

    if (!selectedPid) return false;

    bool =
      this.isPidValid() &&
      ( types[selectedPid] !== 'renderer' &&
        types[selectedPid] !== 'service' );
    
    return bool;
  }

  canOpenDevTool = () => {
    const { selectedPid, types } = this.state;
    let bool;

    if (!selectedPid) return false;

    bool =
      this.isPidValid() &&
      ( types[selectedPid] === 'renderer' ||
        types[selectedPid] === 'service' );
    
    return bool;
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

  formatData = () => {
    const { processes, sorting, types } = this.state;
    const data = Object.keys(processes)
      .filter(pid => processes[pid])
      .map(pid => ({
        name: Number(pid),
        cpu: (processes[pid].cpu).toFixed(2),
        memory: formatSizeStr(processes[pid].memory),
        pid: Number(pid),
        mark: types[pid] || 'node',
        ppid: Number(processes[pid].ppid),
        key: pid
      }))
      .sort((p1, p2) => {
        if (sorting.how === 'descend') return p2[sorting.path] - p1[sorting.path];
        return p1[sorting.path] - p2[sorting.path];
      });

    return { data };
  }

  render () {
    const { data } = this.formatData();
    const { logVisible, logs, selectedPid } = this.state;
    return (
      <React.Fragment>
        <header className="toolbar toolbar-header">
          <ToolBar
            disableKill={!this.canKill()}
            onKillClick={this.handleKillProcess}
            disabelOpenDevTool={!this.canOpenDevTool()}
            disableConsole={!this.canOpenConsole()}
            onOpenDevToolClick={this.handleOpenDevTool}
            onOpenConsoleClick={this.handleOpenConsole}
          />
        </header>
        <div className="process-table-container">
          <ProcessTable
            data={data}
            selectedPid={this.state.selectedPid}
            sorting={this.state.sorting}
            onSortingChange={sorting => this.setState({ sorting })}
            onSelectedPidChange={pid => this.setState({ selectedPid: pid })}
            />
        </div>
        <ProcessConsole handleOpenConsole={this.handleOpenConsole} visible={logVisible} logs={logs[selectedPid]}/>
      </React.Fragment>
    )
  }
}
