import React from 'react';
import PropTypes from 'prop-types';

export default class ProcessRow extends React.Component {
  static propTypes = {
    pid: PropTypes.number,
    ppid: PropTypes.number,
    memory: PropTypes.string,
    mark: PropTypes.string,
    cpu: PropTypes.string,
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
