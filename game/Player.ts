import { Dungeon } from './Dungeon';
import { PixelRenderer } from './PixelRenderer';

export class Player {
  x: number;
  y: number;
  width = 12;
  height = 12;
  speed = 80;
  health = 100;
  maxHealth = 100;
  level = 1;
  experience = 0;
  experienceToNextLevel = 100;
  score = 0;
  gold = 0;
  keys = 0;
  currentFloor = 1;
  attackDamage = 20;
  defense = 0;
  
  isAttacking = false;
  attackTimer = 0;
  attackCooldown = 0.5;
  attackDirection = 0;
  
  animationFrame = 0;
  animationTimer = 0;
  facing = 0; // 0: down, 1: up, 2: left, 3: right

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number, dx: number, dy: number, dungeon: Dungeon) {
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    // Update facing direction
    if (dx < 0) this.facing = 2;
    else if (dx > 0) this.facing = 3;
    else if (dy < 0) this.facing = 1;
    else if (dy > 0) this.facing = 0;

    // Animation
    if (dx !== 0 || dy !== 0) {
      this.animationTimer += deltaTime;
      if (this.animationTimer > 0.15) {
        this.animationFrame = (this.animationFrame + 1) % 4;
        this.animationTimer = 0;
      }
    } else {
      this.animationFrame = 0;
    }

    // Movement with collision
    const newX = this.x + dx * this.speed * deltaTime;
    const newY = this.y + dy * this.speed * deltaTime;

    if (!this.checkCollision(newX, this.y, dungeon)) {
      this.x = newX;
    }
    if (!this.checkCollision(this.x, newY, dungeon)) {
      this.y = newY;
    }

    // Attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
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

  attack() {
    if (this.attackTimer <= 0) {
      this.isAttacking = true;
      this.attackTimer = this.attackCooldown;
      this.attackDirection = this.facing;
    }
  }

  takeDamage(damage: number) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.health -= actualDamage;
    if (this.health < 0) this.health = 0;
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addGold(amount: number) {
    this.gold += amount;
  }

  addKey() {
    this.keys++;
  }

  addScore(points: number) {
    this.score += points;
  }

  addExperience(amount: number) {
    this.experience += amount;
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    this.maxHealth += 20;
    this.health = this.maxHealth;
    this.attackDamage += 5;
  }

  upgradeDamage() {
    this.attackDamage += 10;
  }

  upgradeDefense() {
    this.defense += 5;
    this.maxHealth += 20;
    this.health += 20;
  }

  render(renderer: PixelRenderer) {
    const colors = {
      skin: '#ffdbac',
      armor: '#4a90e2',
      armorDark: '#2e5c8a',
      weapon: '#c0c0c0',
      hair: '#8b4513',
    };

    const centerX = Math.floor(this.x);
    const centerY = Math.floor(this.y);

    // Body (armor)
    renderer.drawPixel(centerX, centerY - 2, colors.armor);
    renderer.drawPixel(centerX - 1, centerY - 2, colors.armor);
    renderer.drawPixel(centerX + 1, centerY - 2, colors.armor);
    renderer.drawPixel(centerX, centerY - 3, colors.armor);
    renderer.drawPixel(centerX, centerY - 1, colors.armorDark);
    renderer.drawPixel(centerX - 1, centerY - 1, colors.armorDark);
    renderer.drawPixel(centerX + 1, centerY - 1, colors.armorDark);

    // Head
    renderer.drawPixel(centerX, centerY - 5, colors.skin);
    renderer.drawPixel(centerX - 1, centerY - 5, colors.skin);
    renderer.drawPixel(centerX + 1, centerY - 5, colors.skin);
    renderer.drawPixel(centerX, centerY - 6, colors.hair);
    renderer.drawPixel(centerX - 1, centerY - 6, colors.hair);
    renderer.drawPixel(centerX + 1, centerY - 6, colors.hair);
    renderer.drawPixel(centerX, centerY - 4, colors.skin);

    // Legs (animated)
    const legOffset = Math.sin(this.animationFrame) * 1;
    renderer.drawPixel(centerX - 1 + legOffset, centerY, colors.armorDark);
    renderer.drawPixel(centerX + 1 - legOffset, centerY, colors.armorDark);
    renderer.drawPixel(centerX - 1 + legOffset, centerY + 1, colors.armor);
    renderer.drawPixel(centerX + 1 - legOffset, centerY + 1, colors.armor);

    // Weapon (when attacking)
    if (this.isAttacking) {
      let weaponX = centerX;
      let weaponY = centerY;
      switch (this.attackDirection) {
        case 0: weaponY += 4; break; // down
        case 1: weaponY -= 8; break; // up
        case 2: weaponX -= 5; break; // left
        case 3: weaponX += 5; break; // right
      }
      renderer.drawPixel(weaponX, weaponY, colors.weapon);
      renderer.drawPixel(weaponX, weaponY - 1, colors.weapon);
      renderer.drawPixel(weaponX, weaponY + 1, '#ffd700');
    }

    // Health bar
    const barWidth = 16;
    const healthPercent = this.health / this.maxHealth;
    const barX = centerX - barWidth / 2;
    const barY = centerY - 10;

    // Background
    for (let i = 0; i < barWidth; i++) {
      renderer.drawPixel(barX + i, barY, '#333');
    }

    // Health
    const healthWidth = Math.floor(barWidth * healthPercent);
    const healthColor = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    for (let i = 0; i < healthWidth; i++) {
      renderer.drawPixel(barX + i, barY, healthColor);
    }
  }
}
