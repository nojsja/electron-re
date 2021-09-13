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
    (): unknown
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
                onClick={this.props.onOpenConsoleClick}
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
            </div>
          </div>
    )
  }
}
