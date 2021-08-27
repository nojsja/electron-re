import React, { Component } from 'react'

import { fnDebounce } from 'utils/utils';
import { UI_Drawer, Data_Drawer } from './ProcessDrawer';

const debouncer = new fnDebounce();

/* *************** ProcessTrends *************** */
export class ProcessTrends extends React.PureComponent {
  state = {
    width: '',
    height: ''
  }
  uiRef = React.createRef()
  dataRef = React.createRef()
  dpr =
    window.devicePixelRatio ||
    window.webkitDevicePixelRatio ||
    window.mozDevicePixelRatio ||
    1;

  componentDidMount() {
    this.uiDrawer = new UI_Drawer('#trendsUI', {
      xPoints: 60,
      yPoints: 100
    });
    this.dataDrawer = new Data_Drawer('#trendsData');
    window.addEventListener('resize', this.resizeDebouncer);
    // setTimeout(() => {
    //   this.uiRef.current.scale(this.dpr, this.dpr);
    //   this.dataRef.current.scale(this.dpr, this.dpr);
    // });

    this.setState({
      width: `${document.querySelector('.trends-drawer').clientWidth}`,
      height: `${document.querySelector('.trends-drawer').clientHeight}`
    });
  }

  resize = () => {
    this.setState({
      width: `${document.querySelector('.trends-drawer').clientWidth}`,
      height: `${document.querySelector('.trends-drawer').clientHeight}`
    }, () => {
      const { memory, cpu } = this.props;
      this.uiDrawer.reset();
      this.uiDrawer.draw();
      this.dataDrawer.draw(cpu, memory);
      // setTimeout(() => {
      //   this.uiRef.current.scale(this.dpr, this.dpr);
      //   this.dataRef.current.scale(this.dpr, this.dpr);
      // });
    });
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
    const { width, height } = this.state;

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
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            style={{
              width: `${width}px`,
              height: `${height}px`
            }}
            id="trendsUI"
            ref={this.uiRef}
          />
          <canvas
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            ref={this.dataRef}
            id="trendsData"
            style={{
              width: `${width}px`,
              height: `${height}px`,
            }}
          />
        </div>
      </div>
    )
  }
}

export default ProcessTrends;
