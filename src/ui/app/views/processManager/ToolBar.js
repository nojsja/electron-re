import React from 'react';
import PropTypes from 'prop-types';

export default class ToolBar extends React.Component {

  static propTypes = {
    onKillClick: PropTypes.func,
    disableKill: PropTypes.bool,
    onOpenDevToolClick: PropTypes.func,
    disabelOpenDevTool: PropTypes.bool,
    disableConsole: PropTypes.bool
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
                Kill Process
              </button>
              <button
                className="btn btn-default"
                disabled={this.props.disabelOpenDevTool}
                onClick={this.props.onOpenDevToolClick}
              >
                Open DevTools
              </button>
              <button
                className="btn btn-default"
                disabled={this.props.disableConsole}
                onClick={this.props.onOpenConsoleClick}
              >
                Console
              </button>
            </div>
          </div>
    )
  }
}
