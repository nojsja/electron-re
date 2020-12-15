import React, { Component } from 'react'

export class ProcessConsole extends Component {

  handleOpenConsole = () => {
    this.props.handleOpenConsole(false);
  }

  render() {
    const { logs=[], visible } = this.props;
    return (
      visible ?
      (<div className="process-console-container scroll-show">
        <header>
          <button className="btn btn-default"  onClick={this.handleOpenConsole}>X</button>
        </header>
        { logs.map(log => <p>{log}</p>) }
      </div>)
      : null
    )
  }
}

export default ProcessConsole
