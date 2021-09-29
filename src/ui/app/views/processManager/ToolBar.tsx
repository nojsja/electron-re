import * as React from 'react';
import * as PropTypes from 'prop-types';

interface Props {
  onKillClick: {
    (): unknown
  },
  disableKill: boolean,
  onOpenDevToolClick: {
    (): unknown
  },
  disabelOpenDevTool: boolean,
  disableConsole: boolean,
  disableTrends: boolean,
  onOpenConsoleClick: {
    (status: boolean, attr: 'logVisible' | 'signalVisible'): unknown
  },
  onOpenTrendsClick: {
    (): unknown
  }
}

export class ToolBar extends React.Component<Props, {}> {

  static propTypes = {
    onKillClick: PropTypes.func,
    disableKill: PropTypes.bool,
    onOpenDevToolClick: PropTypes.func,
    disabelOpenDevTool: PropTypes.bool,
    disableConsole: PropTypes.bool,
    disableTrends: PropTypes.bool,
    onOpenConsoleClick: PropTypes.func,
    onOpenTrendsClick: PropTypes.func
  }

  render() {
    return (
        <div className="toolbar-actions">
            <div className="btn-group">
              <button
                className="btn btn-default"
                disabled={this.props.disableKill}
                onClick={this.props.onKillClick}
              >
                Kill
              </button>
              <button
                className="btn btn-default"
                disabled={this.props.disabelOpenDevTool}
                onClick={this.props.onOpenDevToolClick}
              >
                DevTools
              </button>
              <button
                className="btn btn-default"
                disabled={this.props.disableConsole}
                onClick={() => this.props.onOpenConsoleClick(true, 'logVisible')}
              >
                Console
              </button>
              <button
                className="btn btn-default"
                disabled={this.props.disableTrends}
                onClick={this.props.onOpenTrendsClick}
              >
                Trends
              </button>
              <button
                className="btn btn-default"
                disabled={false}
                onClick={() => this.props.onOpenConsoleClick(true, 'signalVisible')}
              >
                Signals
              </button>
            </div>
          </div>
    )
  }
}
