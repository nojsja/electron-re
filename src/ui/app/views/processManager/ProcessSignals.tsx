import * as React from 'react';
import { Component } from 'react';

interface Props {
  handleOpenConsole: {
    (status: boolean, attr: 'logVisible' | 'signalVisible'): unknown
  },
  signals: {
    type: string,
    data: any,
    origin: string,
    method: string,
    target: string,
    channel: string,
  }[],
  visible: boolean
}

const getDataString = (data: any): string => {
  console.log(data);
  return (typeof data === 'object') ? JSON.stringify(data) : data
};

export class ProcessSignals extends Component<Props, {}> {

  handleOpenConsole = () => {
    this.props.handleOpenConsole(false, 'signalVisible');
  }

  render() {
    const { signals=[], visible } = this.props;
    return (
      visible ?
      (<div className="process-signal-container">
        <header>
          <span className="text-button small" onClick={this.handleOpenConsole}>X</span>
        </header>
        <div className="selectable-text">
          <table className="signals">
            <thead>
              <tr>
                <th>origin</th>
                <th>method</th>
                <th>target</th>
                <th>channel</th>
                <th>body</th>
              </tr>
            </thead>
            <tbody className="signals">
              {
                signals.map(
                  (signal, index) => {
                      let d = getDataString(signal.data);
                      return (
                        <tr>
                          <td>{signal.origin}</td>
                          <td>{signal.method}</td>
                          <td>{signal.target}</td>
                          <td>{signal.channel}</td>
                          <td>
                            <input readOnly title={d} defaultValue={d}></input>
                          </td>
                        </tr>
                      );
                    }
                )
              }
            </tbody>
          </table>
        </div>
      </div>)
      : null
    )
  }
}