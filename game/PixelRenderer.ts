export class PixelRenderer {
  private ctx: CanvasRenderingContext2D;
  private pixelSize = 1;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawPixel(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x) * this.pixelSize,
      Math.floor(y) * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
  }

  drawRect(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x) * this.pixelSize,
      Math.floor(y) * this.pixelSize,
      width * this.pixelSize,
      height * this.pixelSize
    );
  }

  drawText(text: string, x: number, y: number, color: string, size: number = 8) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.fillText(text, x, y);
  }
}
