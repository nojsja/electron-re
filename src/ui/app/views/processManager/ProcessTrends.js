import { rm } from 'fs';
import React, { Component } from 'react'

import { deepComparison } from 'utils/utils';

class Drawer {
  constructor(selector) {
    this.canvas = document.querySelector(selector);
    this.ctx = null;
    if (this.canvas && this.canvas.getContext) {
      this.ctx = this.canvas.getContext('2d');
      // this.drawUI();
    }
  }

  getRect = () => {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      padding: 30,
    };
  }

  clear() {
    if (this.ctx) {
      const { width, height, padding } = this.getRect();
      this.ctx.clearRect(0, 0, width, height);
    }
  }

  drawUI() {
    const { ctx } = this;
    const { width, height, padding } = this.getRect();
    let x, y;

    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = "20px sans-serif";
    ctx.fillText("%", padding - 5, padding - 2);

    ctx.font = "16px sans-serif";

    for (let i = 0; i < 100; i += 10 ) {
      if (i === 0) continue;
      x = padding;
      y = height - padding - i * (( height - 2 * padding ) / 100);
      ctx.fillRect(x, y, 3, 1);
      ctx.fillText(i, 5, y + 5);
    }

    ctx.font = "16px sans-serif";

    for (let i = 0; i <= 60; i += 5) {
      x = padding + i * (( width - 2 * padding ) / 60);
      y = height - padding - 3;
      ctx.fillRect(x, y, 1, 3);
      ctx.fillText(i, x - 5, height - 10);
    }
  }

  drawData(memory, cpu) {
    const { ctx } = this;
    const { width, height, padding } = this.getRect();
    let x, y;

    ctx.strokeStyle = 'white';
    ctx.beginPath();

    ctx.moveTo(
      padding + ((width - 2 * padding) / 60),
      height - padding - (( height - 2 * padding ) / 100) * (cpu[0] < 100 ? cpu[0] : 100)
    );

    for (let i = 1; i < cpu.length; i++) {
      x = padding + ((width - 2 * padding) / 60) * (i + 1);
      y = height - padding - (( height - 2 * padding ) / 100) * (cpu[i] < 100 ? cpu[i] : 100);
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  draw(memory, cpu) {
    if (!this.ctx) return console.error(new Error('Failed to get context(2d) of canvas!'));
    console.log('draw');
    this.clear();
    this.drawUI();
    this.drawData(memory, cpu);
  }
}

export class ProcessTrends extends React.PureComponent {

  state={

  }

  canvas=React.createRef()

  componentDidMount() {
    this.drawer = new Drawer('#trends');
  }

  componentWillUnmount() {
    this.drawer.clear();
  }

  handleOpenTrends = () => {
    this.props.handleOpenTrends(false);
  }

  render() {
    const { visible, memory, cpu } = this.props;
    console.log('render');
    if (visible) this.drawer.draw(memory, cpu);
    return (
      <div className={`process-trends-container ${!visible ? 'hidden' : '' }`}>
        <header>
          <span className="text-button small" onClick={this.handleOpenTrends}>X</span>
        </header>
        <div className="trends-drawer">
          <canvas width={800} height={600} id="trends" ref={this.canvas}/>
        </div>
      </div>
    )
  }
}

export default ProcessTrends;
