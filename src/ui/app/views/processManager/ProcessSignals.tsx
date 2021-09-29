import * as React from 'react';
import { Component } from 'react';

interface Props {
  handleOpenConsole: {
    (status: boolean, attr: 'logVisible' | 'signalVisible'): unknown
  },
  signals: {type: string, data: any}[],
  visible: boolean
}

export class ProcessSignals extends Component<Props, {}> {

  handleOpenConsole = () => {
    this.props.handleOpenConsole(false, 'signalVisible');
  }

  render() {
    const { signals=[], visible } = this.props;
    return (
      visible ?
      (<div className="process-console-container">
        <header>
          <span className="text-button small" onClick={this.handleOpenConsole}>X</span>
        </header>
        <div className="selectable-text">
        {
          signals.map(
            signal => <React.Fragment key={signal.type}>{
              (typeof signal.data === 'object') ? `${signal.type} : ${JSON.stringify(signal.data)}` : `${signal.type} : ${signal.data}`
            }<br></br></React.Fragment>
          )
        }
        </div>
      </div>)
      : null
    )
  }
}