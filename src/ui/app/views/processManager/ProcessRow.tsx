import * as React from 'react';
import * as PropTypes from 'prop-types';

interface Props {
  pid: number,
  url: string,
  ppid: number,
  memory: string,
  mark: string,
  cpu: number,
  selected: boolean,
  onSelect: {
    (): unknown
  }
}

export class ProcessRow extends React.Component<Props, {}> {
  static propTypes = {
    pid: PropTypes.number,
    ppid: PropTypes.number,
    memory: PropTypes.string,
    mark: PropTypes.string,
    cpu: PropTypes.number,
    selected: PropTypes.bool,
    onSelect: PropTypes.func
  }

  render() {
    const { cpu, url, pid, ppid, memory, mark } = this.props;
    return (
      <tr
        className={this.props.selected ? 'selected': ''}
        onClick={this.props.onSelect}
      >
        <td title={url} className="url">{url}</td>
        <td>{pid}</td>
        <td>{mark}</td>
        <td>{ppid}</td>
        <td>{memory}</td>
        <td>{cpu}</td>
      </tr>
    )
  }
}
