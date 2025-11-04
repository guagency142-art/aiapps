import { PixelRenderer } from './PixelRenderer';

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 1 + Math.random() * 2;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 20; // Slight upward bias
    
    this.life = 0.3 + Math.random() * 0.4;
    this.maxLife = this.life;
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 100 * deltaTime; // Gravity
    this.life -= deltaTime;
  }

  render(renderer: PixelRenderer) {
    const alpha = this.life / this.maxLife;
    let color = this.color;
    
    // Add alpha if not already present
    if (!color.includes('rgba')) {
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        // Named colors
        const colorMap: { [key: string]: string } = {
          red: `rgba(255, 0, 0, ${alpha})`,
          green: `rgba(0, 255, 0, ${alpha})`,
          blue: `rgba(0, 0, 255, ${alpha})`,
          gold: `rgba(255, 215, 0, ${alpha})`,
          cyan: `rgba(0, 255, 255, ${alpha})`,
          white: `rgba(255, 255, 255, ${alpha})`,
        };
        color = colorMap[color] || `rgba(255, 255, 255, ${alpha})`;
      }
    }

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    
    for (let i = 0; i < this.size; i++) {
      renderer.drawPixel(x + i, y, color);
      if (this.size > 1) {
        renderer.drawPixel(x, y + i, color);
      }
    }
  }
}
