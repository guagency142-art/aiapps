import { PixelRenderer } from './PixelRenderer';

export type ItemType = 'gold' | 'health' | 'key' | 'gem' | 'sword' | 'shield';

export class Item {
  x: number;
  y: number;
  type: ItemType;
  animationTimer = 0;
  bobOffset = 0;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  render(renderer: PixelRenderer) {
    this.animationTimer += 0.016; // Approximate frame time
    this.bobOffset = Math.sin(this.animationTimer * 3) * 2;

    const centerX = Math.floor(this.x);
    const centerY = Math.floor(this.y + this.bobOffset);

    switch (this.type) {
      case 'gold':
        this.renderGold(renderer, centerX, centerY);
        break;
      case 'health':
        this.renderHealth(renderer, centerX, centerY);
        break;
      case 'key':
        this.renderKey(renderer, centerX, centerY);
        break;
      case 'gem':
        this.renderGem(renderer, centerX, centerY);
        break;
      case 'sword':
        this.renderSword(renderer, centerX, centerY);
        break;
      case 'shield':
        this.renderShield(renderer, centerX, centerY);
        break;
    }
  }

  private renderGold(renderer: PixelRenderer, x: number, y: number) {
    const gold = '#ffd700';
    const darkGold = '#daa520';

    renderer.drawPixel(x, y, gold);
    renderer.drawPixel(x - 1, y, darkGold);
    renderer.drawPixel(x + 1, y, darkGold);
    renderer.drawPixel(x, y - 1, gold);
    renderer.drawPixel(x, y + 1, darkGold);
    renderer.drawPixel(x - 1, y - 1, gold);
    renderer.drawPixel(x + 1, y - 1, gold);
  }

  private renderHealth(renderer: PixelRenderer, x: number, y: number) {
    const red = '#ff0000';
    const darkRed = '#cc0000';

    // Heart shape
    renderer.drawPixel(x - 1, y - 1, red);
    renderer.drawPixel(x + 1, y - 1, red);
    renderer.drawPixel(x - 2, y, red);
    renderer.drawPixel(x - 1, y, darkRed);
    renderer.drawPixel(x, y, red);
    renderer.drawPixel(x + 1, y, darkRed);
    renderer.drawPixel(x + 2, y, red);
    renderer.drawPixel(x - 1, y + 1, red);
    renderer.drawPixel(x, y + 1, darkRed);
    renderer.drawPixel(x + 1, y + 1, red);
    renderer.drawPixel(x, y + 2, red);
  }

  private renderKey(renderer: PixelRenderer, x: number, y: number) {
    const gold = '#ffd700';
    const darkGold = '#daa520';

    // Key shaft
    renderer.drawPixel(x, y - 2, gold);
    renderer.drawPixel(x, y - 1, gold);
    renderer.drawPixel(x, y, gold);
    
    // Key head
    renderer.drawPixel(x - 1, y - 3, darkGold);
    renderer.drawPixel(x, y - 3, gold);
    renderer.drawPixel(x + 1, y - 3, darkGold);
    
    // Key teeth
    renderer.drawPixel(x + 1, y, darkGold);
    renderer.drawPixel(x + 1, y + 1, darkGold);
  }

  private renderGem(renderer: PixelRenderer, x: number, y: number) {
    const colors = ['#00ffff', '#0080ff', '#8000ff', '#ff00ff'];
    const color = colors[Math.floor(this.animationTimer * 2) % colors.length];

    renderer.drawPixel(x, y - 2, color);
    renderer.drawPixel(x - 1, y - 1, color);
    renderer.drawPixel(x, y - 1, '#fff');
    renderer.drawPixel(x + 1, y - 1, color);
    renderer.drawPixel(x - 1, y, color);
    renderer.drawPixel(x, y, color);
    renderer.drawPixel(x + 1, y, color);
    renderer.drawPixel(x, y + 1, color);
  }

  private renderSword(renderer: PixelRenderer, x: number, y: number) {
    const blade = '#c0c0c0';
    const handle = '#8b4513';
    const gold = '#ffd700';

    // Blade
    renderer.drawPixel(x, y - 3, blade);
    renderer.drawPixel(x, y - 2, blade);
    renderer.drawPixel(x, y - 1, blade);
    renderer.drawPixel(x - 1, y - 3, blade);
    
    // Guard
    renderer.drawPixel(x - 1, y, gold);
    renderer.drawPixel(x, y, gold);
    renderer.drawPixel(x + 1, y, gold);
    
    // Handle
    renderer.drawPixel(x, y + 1, handle);
    renderer.drawPixel(x, y + 2, handle);
  }

  private renderShield(renderer: PixelRenderer, x: number, y: number) {
    const silver = '#c0c0c0';
    const blue = '#4169e1';
    const gold = '#ffd700';

    // Shield outline
    renderer.drawPixel(x, y - 2, silver);
    renderer.drawPixel(x - 1, y - 1, silver);
    renderer.drawPixel(x + 1, y - 1, silver);
    renderer.drawPixel(x - 2, y, silver);
    renderer.drawPixel(x + 2, y, silver);
    renderer.drawPixel(x - 1, y + 1, silver);
    renderer.drawPixel(x + 1, y + 1, silver);
    renderer.drawPixel(x, y + 2, silver);
    
    // Shield fill
    renderer.drawPixel(x, y - 1, blue);
    renderer.drawPixel(x - 1, y, blue);
    renderer.drawPixel(x, y, gold);
    renderer.drawPixel(x + 1, y, blue);
    renderer.drawPixel(x, y + 1, blue);
  }
}
