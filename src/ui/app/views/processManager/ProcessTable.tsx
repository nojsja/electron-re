import * as React from 'react';
import * as PropTypes from 'prop-types';

import { formatSizeStr } from '../../utils/utils';
import { record, sorting, processTypes } from '../../types';

import { ProcessRow } from './ProcessRow';
import { ProcessTableHeader } from './ProcessTableHeader';

interface Props {
  types: processTypes,
  sorting: sorting,
  data: record,
  selectedPid: number,
  onSelectedPidChange: {
    (pid: number): void
  },
  onSortingChange: {
    (path: sorting): void
  }
}

export class ProcessTable extends React.Component<Props, {}> {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    types: PropTypes.arrayOf(PropTypes.object),
    processData: PropTypes.arrayOf(PropTypes.object),
    selectedPid: PropTypes.number,
    sorting: PropTypes.shape({
      path: PropTypes.string,
      how: PropTypes.string
    }),
    onSortingChange: PropTypes.func,
    onSelectedPidChange: PropTypes.func
  }

  formatData = (processes: record, sorting: sorting, types: processTypes) => {
    const data = Object.keys(processes)
      .filter((pid) => processes[+pid])
      .map(pid => {
        let data = {
          name: Number(pid),
          cpu: Number((processes[+pid].cpu).toFixed(2)),
          memory: formatSizeStr(processes[+pid].memory),
          pid: Number(pid),
          url: types[+pid]?.url || '(none)',
          mark: types[+pid]?.type || 'node',
          ppid: Number(processes[+pid].ppid),
          key: Number(pid)
        };

        return data;
      })
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
              path='url'
              sorting={sorting}
              disableSort
              onSortingChange={this.props.onSortingChange}
            >URL</ProcessTableHeader>
            <ProcessTableHeader
              path='pid'
              sorting={sorting}
              disableSort={false}
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
              disableSort={false}
              onSortingChange={this.props.onSortingChange}
            >Parent</ProcessTableHeader>

            <ProcessTableHeader
              path='memory'
              sorting={sorting}
              disableSort={false}
              onSortingChange={this.props.onSortingChange}
            >Memory</ProcessTableHeader>

            <ProcessTableHeader
              path='cpu'
              sorting={sorting}
              disableSort={false}
              onSortingChange={this.props.onSortingChange}
            >CPU(%)</ProcessTableHeader>

          </tr>
        </thead>
        <tbody>
        {
          data.map(p =>
            <ProcessRow
              // key={p.pid}
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
