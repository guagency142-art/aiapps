import { Player } from './Player';
import { Dungeon } from './Dungeon';
import { PixelRenderer } from './PixelRenderer';

export class Enemy {
  x: number;
  y: number;
  width = 12;
  height = 12;
  speed = 40;
  health: number;
  maxHealth: number;
  damage: number;
  scoreValue: number;
  isDead = false;
  deathTimer = 0;
  
  animationFrame = 0;
  animationTimer = 0;
  aggroRange = 150;
  attackRange = 16;
  
  type: 'goblin' | 'skeleton' | 'demon';
  color: string;

  constructor(x: number, y: number, floor: number) {
    this.x = x;
    this.y = y;
    
    // Scale difficulty with floor
    const types: ('goblin' | 'skeleton' | 'demon')[] = ['goblin', 'skeleton', 'demon'];
    const weights = [0.6, 0.3, 0.1];
    const roll = Math.random();
    let sum = 0;
    this.type = 'goblin';
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (roll < sum) {
        this.type = types[i];
        break;
      }
    }

    switch (this.type) {
      case 'goblin':
        this.health = 30 + floor * 10;
        this.damage = 5 + floor * 2;
        this.scoreValue = 50;
        this.color = '#7cb342';
        this.speed = 50;
        break;
      case 'skeleton':
        this.health = 40 + floor * 15;
        this.damage = 8 + floor * 3;
        this.scoreValue = 100;
        this.color = '#e0e0e0';
        this.speed = 45;
        break;
      case 'demon':
        this.health = 60 + floor * 20;
        this.damage = 12 + floor * 4;
        this.scoreValue = 200;
        this.color = '#d32f2f';
        this.speed = 60;
        break;
    }

    this.maxHealth = this.health;
  }

  update(deltaTime: number, player: Player, dungeon: Dungeon) {
    if (this.isDead) {
      this.deathTimer -= deltaTime;
      return;
    }

    this.animationTimer += deltaTime;
    if (this.animationTimer > 0.2) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }

    // Simple AI - chase player if in range
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    
    if (dist < this.aggroRange && dist > this.attackRange) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      const newX = this.x + dx * this.speed * deltaTime;
      const newY = this.y + dy * this.speed * deltaTime;

      if (!this.checkCollision(newX, this.y, dungeon)) {
        this.x = newX;
      }
      if (!this.checkCollision(this.x, newY, dungeon)) {
        this.y = newY;
      }
    }
  }

  private checkCollision(x: number, y: number, dungeon: Dungeon): boolean {
    const corners = [
      { dx: -this.width / 2, dy: -this.height / 2 },
      { dx: this.width / 2, dy: -this.height / 2 },
      { dx: -this.width / 2, dy: this.height / 2 },
      { dx: this.width / 2, dy: this.height / 2 },
    ];

    for (const corner of corners) {
      const tileX = Math.floor((x + corner.dx) / 16);
      const tileY = Math.floor((y + corner.dy) / 16);

      if (
        tileX < 0 ||
        tileY < 0 ||
        tileX >= dungeon.width ||
        tileY >= dungeon.height ||
        dungeon.tiles[tileY][tileX] === 1
      ) {
        return true;
      }
    }

    return false;
  }

  takeDamage(damage: number) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathTimer = 0.5;
    }
  }

  render(renderer: PixelRenderer) {
    const centerX = Math.floor(this.x);
    const centerY = Math.floor(this.y);

    if (this.isDead) {
      // Death animation
      const alpha = this.deathTimer / 0.5;
      const color = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${alpha})`;
      
      for (let i = -2; i <= 2; i++) {
        renderer.drawPixel(centerX + i, centerY, color);
      }
      return;
    }

    switch (this.type) {
      case 'goblin':
        this.renderGoblin(renderer, centerX, centerY);
        break;
      case 'skeleton':
        this.renderSkeleton(renderer, centerX, centerY);
        break;
      case 'demon':
        this.renderDemon(renderer, centerX, centerY);
        break;
    }

    // Health bar
    const barWidth = 16;
    const healthPercent = this.health / this.maxHealth;
    const barX = centerX - barWidth / 2;
    const barY = centerY - 10;

    for (let i = 0; i < barWidth; i++) {
      renderer.drawPixel(barX + i, barY, '#333');
    }

    const healthWidth = Math.floor(barWidth * healthPercent);
    for (let i = 0; i < healthWidth; i++) {
      renderer.drawPixel(barX + i, barY, '#f00');
    }
  }

  private renderGoblin(renderer: PixelRenderer, centerX: number, centerY: number) {
    const green = '#7cb342';
    const darkGreen = '#558b2f';
    const eye = '#ff0';

    // Body
    renderer.drawPixel(centerX, centerY - 2, green);
    renderer.drawPixel(centerX - 1, centerY - 2, green);
    renderer.drawPixel(centerX + 1, centerY - 2, green);
    renderer.drawPixel(centerX, centerY - 1, darkGreen);

    // Head
    renderer.drawPixel(centerX, centerY - 4, green);
    renderer.drawPixel(centerX - 1, centerY - 4, green);
    renderer.drawPixel(centerX + 1, centerY - 4, green);
    renderer.drawPixel(centerX - 1, centerY - 5, eye);
    renderer.drawPixel(centerX + 1, centerY - 5, eye);

    // Legs
    const legOffset = Math.sin(this.animationFrame) * 1;
    renderer.drawPixel(centerX - 1 + legOffset, centerY, darkGreen);
    renderer.drawPixel(centerX + 1 - legOffset, centerY, darkGreen);
  }

  private renderSkeleton(renderer: PixelRenderer, centerX: number, centerY: number) {
    const bone = '#e0e0e0';
    const dark = '#9e9e9e';

    // Skull
    renderer.drawPixel(centerX, centerY - 5, bone);
    renderer.drawPixel(centerX - 1, centerY - 5, bone);
    renderer.drawPixel(centerX + 1, centerY - 5, bone);
    renderer.drawPixel(centerX - 1, centerY - 6, '#000');
    renderer.drawPixel(centerX + 1, centerY - 6, '#000');

    // Ribs
    renderer.drawPixel(centerX, centerY - 3, bone);
    renderer.drawPixel(centerX - 1, centerY - 2, bone);
    renderer.drawPixel(centerX + 1, centerY - 2, bone);
    renderer.drawPixel(centerX, centerY - 1, dark);

    // Legs
    renderer.drawPixel(centerX - 1, centerY, bone);
    renderer.drawPixel(centerX + 1, centerY, bone);
  }

  private renderDemon(renderer: PixelRenderer, centerX: number, centerY: number) {
    const red = '#d32f2f';
    const darkRed = '#b71c1c';
    const fire = '#ff6f00';

    // Body
    renderer.drawPixel(centerX, centerY - 2, red);
    renderer.drawPixel(centerX - 1, centerY - 2, red);
    renderer.drawPixel(centerX + 1, centerY - 2, red);
    renderer.drawPixel(centerX - 2, centerY - 2, darkRed);
    renderer.drawPixel(centerX + 2, centerY - 2, darkRed);
    renderer.drawPixel(centerX, centerY - 1, darkRed);

    // Head with horns
    renderer.drawPixel(centerX, centerY - 5, red);
    renderer.drawPixel(centerX - 1, centerY - 5, red);
    renderer.drawPixel(centerX + 1, centerY - 5, red);
    renderer.drawPixel(centerX - 2, centerY - 6, darkRed); // horn
    renderer.drawPixel(centerX + 2, centerY - 6, darkRed); // horn
    renderer.drawPixel(centerX - 1, centerY - 6, fire); // eyes
    renderer.drawPixel(centerX + 1, centerY - 6, fire); // eyes

    // Legs
    renderer.drawPixel(centerX - 1, centerY, darkRed);
    renderer.drawPixel(centerX + 1, centerY, darkRed);
    renderer.drawPixel(centerX - 1, centerY + 1, red);
    renderer.drawPixel(centerX + 1, centerY + 1, red);
  }
}
