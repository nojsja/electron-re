/* -------------- Drawer -------------- */

export class Drawer {
  ctx: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement | null

  constructor(selector: string) {
    this.ctx = null;
    this.canvas = null;
    let find = document.querySelector(selector);
    if (find !== null) {
      this.canvas = find as HTMLCanvasElement;
      if (this.canvas.getContext) {
        this.ctx = this.canvas.getContext('2d');
        if (this.ctx) this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }

  getRect = () => {
    return {
      width: this.canvas?.width,
      height: this.canvas?.height,
      padding: 30,
    };
  }

  clear() {
    if (this.ctx) {
      const { width, height, padding } = this.getRect();
      if (width !== undefined && height !== undefined)
        this.ctx.clearRect(0, 0, width, height);
    }
  }

  draw(cpu: number[], memory: number[]) {
    throw new Error('Drawer: draw - method is not implemented!');
  }
}

/* -------------- Data_Drawer -------------- */

export class Data_Drawer extends Drawer {
  constructor(selector: string) {
    super(selector);
  }

  drawWork(data: number[], lineColor="white") {
    const { ctx } = this;
    const { width, height, padding } = this.getRect();
    let x, y;

    if (!ctx || height === undefined || width === undefined) return;

    ctx.strokeStyle = lineColor;
    ctx.beginPath();

    ctx.moveTo(
      Math.floor(padding),
      Math.floor(height - padding - (( height - 2 * padding ) / 100) * (data[0] < 100 ? data[0] : 100))
    );

    for (let i = 1; i < data.length; i++) {
      x = padding + ((width - 2 * padding) / 60) * (i + 1);
      y = height - padding - (( height - 2 * padding ) / 100) * (data[i] < 100 ? data[i] : 100);
      ctx.lineTo(Math.floor(x), Math.floor(y));
    }

    ctx.stroke();
  }

  draw(cpu: number[], memory: number[]) {
    if (!this.ctx) return console.error(new Error('Failed to get context(2d) of canvas!'));
    const G = 1024 * 1024 * 1024;
    this.clear();
    this.drawWork(cpu, 'rgb(116, 227, 255)');
    this.drawWork(memory.map(minfo => (minfo / G) * 100), 'rgb(124, 255, 174)');
  }
}

/* -------------- UI_Drawer -------------- */

export class UI_Drawer extends Drawer {
  xPoints: number
  yPoints: number
  initialized: boolean
  constructor(selector: string, {
    xPoints=60, yPoints=100
  }) {
    super(selector);
    this.xPoints = xPoints;
    this.yPoints = yPoints;
    this.initialized = false;
  }

  drawWork() {
    const { ctx } = this;
    const { width, height, padding } = this.getRect();
    let x, y;

    if (!ctx || height === undefined || width === undefined) return;

    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, Math.floor(height - padding));
    ctx.lineTo(Math.floor(width - padding), Math.floor(height - padding));
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = ".8rem sans-serif";
    ctx.fillText("%/1Gb", padding - 5, padding - 2);

    ctx.font = ".8rem sans-serif";

    for (let i = 0; i < this.yPoints; i += (this.yPoints / 10) ) {
      if (i === 0) continue;
      x = padding;
      y = height - padding - i * (( height - 2 * padding ) / this.yPoints);
      ctx.fillRect(Math.floor(x), Math.floor(y), 3, 1);
      ctx.fillText(String(i), 5, Math.floor(y + 5));
    }

    ctx.font = ".8rem sans-serif";

    for (let i = 0; i <= this.xPoints; i += 5) {
      x = padding + i * (( width - 2 * padding ) / this.xPoints);
      y = height - padding - 3;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 3);
      ctx.fillText(String(i), Math.floor(x - 5), Math.floor(height - 10));
    }
  }

  reset() {
    this.initialized = false;
  }

  draw() {
    if (!this.ctx) return console.error(new Error('Failed to get context(2d) of canvas!'));
    const { width, height } = this.getRect();

    if (!this.initialized) {
      if (width && height) {
        this.clear();
        this.drawWork();
        this.initialized = true;
      }
    }
  }
}