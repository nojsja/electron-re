import React from 'react';
import { ipcRenderer, remote } from 'electron';

import { formatSizeStr } from 'utils/utils';

import ProcessTable from './ProcessTable';
import ToolBar from './ToolBar';

export default class ProcessManager extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      processData: null,
      selectedPid: null,
      processes: [],
      types: {},
      sorting: {
        path: null,
        how: 'ascend'
      }
    }
  }


  componentDidMount() {
    ipcRenderer.on('process:update-list', function(event, { records, types }) {
      this.setState({
        processes: records,
        types
      });
    }.bind(this));
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

  canOpenDevTool = () => {
    const { selectedPid, types } = this.state;
    let bool;

    if (!selectedPid) return false;

    bool =
      this.isPidValid() &&
      (types[selectedPid] === 'renderer' );
    
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

  formatData = () => {
    const { processes, sorting, types } = this.state;
    const data = Object.keys(processes)
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

    return (
      <React.Fragment>
        <header className="toolbar toolbar-header">
          <ToolBar
            disableKill={!this.canKill()}
            onKillClick={this.handleKillProcess}
            disabelOpenDevTool={!this.canOpenDevTool()}
            onOpenDevToolClick={this.handleOpenDevTool}

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
      </React.Fragment>
    )
  }
}
