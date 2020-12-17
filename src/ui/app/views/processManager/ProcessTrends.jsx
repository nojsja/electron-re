import { rm } from 'fs';
import React, { Component } from 'react'

import { fnDebounce } from 'utils/utils';
import { UI_Drawer, Data_Drawer } from './ProcessDrawer';

const debouncer = new fnDebounce();

/* *************** ProcessTrends *************** */
export class ProcessTrends extends React.PureComponent {
  componentDidMount() {
    this.uiDrawer = new UI_Drawer('#trendsUI', {
      xPoints: 60,
      yPoints: 100
    });
    this.dataDrawer = new Data_Drawer('#trendsData');
    window.addEventListener('resize', this.resizeDebouncer);
  }

  resize = () => {
    this.uiDrawer.reset();
  }

  resizeDebouncer = () => {
    console.log('debouncer');
    debouncer(this.resize, 1000, false, null);
  }

  componentWillUnmount() {
    this.uiDrawer.reset();
    window.removeEventListener('resize', this.resizeDebouncer);
  }

  handleCloseTrends = () => {
    this.props.handleOpenTrends(false);
  }

  render() {
    const { visible, memory, cpu } = this.props;
    if (visible) {
      this.uiDrawer.draw();
      this.dataDrawer.draw(cpu, memory);
    };

    return (
      <div className={`process-trends-container ${!visible ? 'hidden' : 'progressive-show' }`}>
        <header>
          <span className="text-button small" onClick={this.handleCloseTrends}>X</span>
        </header>
        <div className="trends-drawer">
          <canvas
            width={document.body.clientWidth * window.devicePixelRatio}
            height={document.body.clientHeight * window.devicePixelRatio}
            id="trendsUI"
          />
          <canvas
            width={document.body.clientWidth * window.devicePixelRatio}
            height={document.body.clientHeight * window.devicePixelRatio}
            id="trendsData"
          />
        </div>
      </div>
    )
  }
}

export default ProcessTrends;
