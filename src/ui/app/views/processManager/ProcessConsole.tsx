import * as React from 'react';
import { Component } from 'react';

interface Props {
  handleOpenConsole: {
    (attr: boolean): unknown
  },
  logs: string[],
  visible: boolean
}

export class ProcessConsole extends Component<Props, {}> {

  handleOpenConsole = () => {
    this.props.handleOpenConsole(false);
  }

  render() {
    const { logs=[], visible } = this.props;
    return (
      visible ?
      (<div className="process-console-container">
        <header>
          <span className="text-button small" onClick={this.handleOpenConsole}>X</span>
        </header>
        <div className="selectable-text">
        { logs.map(log => <React.Fragment key={log}>{log}<br></br></React.Fragment>) }
        </div>
      </div>)
      : null
    )
  }
}