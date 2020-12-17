import React from 'react';
import PropTypes from 'prop-types';

import { formatSizeStr } from 'utils/utils';

import ProcessRow from './ProcessRow';
import ProcessTableHeader from './ProcessTableHeader';


export default class ProcessTable extends React.Component {
  static propTypes = {
    processData: PropTypes.arrayOf(PropTypes.object),
    selectedPid: PropTypes.number,
    sorting: PropTypes.PropTypes.shape({
      path: PropTypes.string,
      how: PropTypes.string
    }),
    onSortingChange: PropTypes.func,
    onSelectedPidChange: PropTypes.func
  }

  formatData = (processes, sorting, types) => {
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
        if (sorting.path === 'memory') {
          return (sorting.how === 'descend') ?
            processes[p2.pid].memory - processes[p1.pid].memory :
            processes[p1.pid].memory - processes[p2.pid].memory;
        } else {
          return (sorting.how === 'descend') ?
            p2[sorting.path] - p1[sorting.path] :
            p1[sorting.path] - p2[sorting.path];
        }
      });

    return { data };
  }

  render() {
    const { sorting, types } = this.props;
    const { data } = this.formatData(this.props.data, sorting, types);
    return (
      <table className="process-table table-striped">
        <thead>
          <tr>
            <ProcessTableHeader
              path='pid'
              sorting={sorting}
              onSortingChange={this.props.onSortingChange}
            >Pid</ProcessTableHeader>

            <ProcessTableHeader
              path='mark'
              sorting={sorting}
              onSortingChange={this.props.onSortingChange}
              disableSort
            >Mark</ProcessTableHeader>

            <ProcessTableHeader
              path='ppid'
              sorting={sorting}
              onSortingChange={this.props.onSortingChange}
            >Parent</ProcessTableHeader>

            <ProcessTableHeader
              path='memory'
              sorting={sorting}
              onSortingChange={this.props.onSortingChange}
            >Memory</ProcessTableHeader>

            <ProcessTableHeader
              path='cpu'
              sorting={sorting}
              onSortingChange={this.props.onSortingChange}
            >CPU(%)</ProcessTableHeader>

          </tr>
        </thead>
        <tbody>
        {
          data.map(p =>
            <ProcessRow
              key={p.pid}
              {...p}
              onSelect={() => this.props.onSelectedPidChange(p.pid)}
              selected={this.props.selectedPid === p.pid}
            />
          )
        }
        </tbody>
      </table>
    )
  }
}
