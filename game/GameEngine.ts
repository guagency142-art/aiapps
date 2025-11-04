import { Player } from './Player';
import { Dungeon } from './Dungeon';
import { Enemy } from './Enemy';
import { Item, ItemType } from './Item';
import { Particle } from './Particle';
import { PixelRenderer } from './PixelRenderer';

export interface GameState {
  health: number;
  maxHealth: number;
  level: number;
  score: number;
  gold: number;
  keys: number;
  currentFloor: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private dungeon: Dungeon;
  private enemies: Enemy[] = [];
  private items: Item[] = [];
  private particles: Particle[] = [];
  private renderer: PixelRenderer;
  private lastTime = 0;
  private animationId: number | null = null;
  private keys: Set<string> = new Set();
  private onStateChange: (state: GameState) => void;
  private camera = { x: 0, y: 0 };
  private gameOver = false;
  private victory = false;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    onStateChange: (state: GameState) => void
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.onStateChange = onStateChange;
    this.renderer = new PixelRenderer(ctx);

    // Initialize game
    this.dungeon = new Dungeon(50, 40, 1);
    this.player = new Player(
      this.dungeon.startX * 16 + 8,
      this.dungeon.startY * 16 + 8
    );

    this.spawnEnemies();
    this.spawnItems();

    // Setup controls
    this.setupControls();

    this.updateState();
  }

  private setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      
      if (e.key.toLowerCase() === 'r') {
        this.restart();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private spawnEnemies() {
    const enemyCount = 5 + this.player.currentFloor * 2;
    for (let i = 0; i < enemyCount; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * this.dungeon.width);
        y = Math.floor(Math.random() * this.dungeon.height);
        attempts++;
      } while (
        (this.dungeon.tiles[y][x] !== 0 ||
          (Math.abs(x - this.dungeon.startX) < 5 &&
            Math.abs(y - this.dungeon.startY) < 5)) &&
        attempts < 100
      );

      if (attempts < 100) {
        this.enemies.push(new Enemy(x * 16 + 8, y * 16 + 8, this.player.currentFloor));
      }
    }
  }

  private spawnItems() {
    const itemCount = 8 + this.player.currentFloor;
    for (let i = 0; i < itemCount; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * this.dungeon.width);
        y = Math.floor(Math.random() * this.dungeon.height);
        attempts++;
      } while (
        (this.dungeon.tiles[y][x] !== 0 ||
          (Math.abs(x - this.dungeon.startX) < 3 &&
            Math.abs(y - this.dungeon.startY) < 3)) &&
        attempts < 100
      );

      if (attempts < 100) {
        const types: ItemType[] = ['gold', 'health', 'key', 'gem', 'sword', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.items.push(new Item(x * 16 + 8, y * 16 + 8, type));
      }
    }
  }

  private updateState() {
    this.onStateChange({
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      level: this.player.level,
      score: this.player.score,
      gold: this.player.gold,
      keys: this.player.keys,
      currentFloor: this.player.currentFloor,
    });
  }

  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  restart() {
    this.player = new Player(0, 0);
    this.dungeon = new Dungeon(50, 40, 1);
    this.player.x = this.dungeon.startX * 16 + 8;
    this.player.y = this.dungeon.startY * 16 + 8;
    this.enemies = [];
    this.items = [];
    this.particles = [];
    this.gameOver = false;
    this.victory = false;
    this.spawnEnemies();
    this.spawnItems();
    this.updateState();
  }

  private gameLoop(currentTime: number) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number) {
    if (this.gameOver || this.victory) return;

    // Player input
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    if (this.keys.has(' ')) {
      this.player.attack();
    }

    // Update player
    this.player.update(deltaTime, dx, dy, this.dungeon);

    // Check for stairs
    if (this.keys.has('e')) {
      const tileX = Math.floor(this.player.x / 16);
      const tileY = Math.floor(this.player.y / 16);
      if (this.dungeon.tiles[tileY][tileX] === 3) {
        this.nextFloor();
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, this.player, this.dungeon);

      // Check collision with player attack
      if (this.player.isAttacking) {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist < 20 && !enemy.isDead) {
          enemy.takeDamage(this.player.attackDamage);
          this.createHitParticles(enemy.x, enemy.y);
          if (enemy.isDead) {
            this.player.addScore(enemy.scoreValue);
            this.player.addExperience(10 * this.player.currentFloor);
            this.updateState();
          }
        }
      }

      // Check collision with player
      if (!enemy.isDead) {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist < 16) {
          this.player.takeDamage(enemy.damage);
          this.createHitParticles(this.player.x, this.player.y);
          this.updateState();
          if (this.player.health <= 0) {
            this.gameOver = true;
          }
        }
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter((e) => !e.isDead || e.deathTimer > 0);

    // Check item collection
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const dist = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (dist < 12) {
        this.collectItem(item);
        this.items.splice(i, 1);
      }
    }

    // Update particles
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // Update camera
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
  }

  private collectItem(item: Item) {
    switch (item.type) {
      case 'gold':
        this.player.addGold(10 + this.player.currentFloor * 5);
        break;
      case 'health':
        this.player.heal(30);
        break;
      case 'key':
        this.player.addKey();
        break;
      case 'gem':
        this.player.addScore(100 * this.player.currentFloor);
        this.player.addGold(50);
        break;
      case 'sword':
        this.player.upgradeDamage();
        break;
      case 'shield':
        this.player.upgradeDefense();
        break;
    }
    this.createCollectParticles(item.x, item.y, item.type);
    this.updateState();
  }

  private createHitParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push(new Particle(x, y, 'red'));
    }
  }

  private createCollectParticles(x: number, y: number, type: string) {
    const color = type === 'gold' ? 'gold' : type === 'health' ? 'green' : 'cyan';
    for (let i = 0; i < 6; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  private nextFloor() {
    this.player.currentFloor++;
    this.dungeon = new Dungeon(50, 40, this.player.currentFloor);
    this.player.x = this.dungeon.startX * 16 + 8;
    this.player.y = this.dungeon.startY * 16 + 8;
    this.enemies = [];
    this.items = [];
    this.spawnEnemies();
    this.spawnItems();
    this.player.heal(50);
    this.updateState();
    this.createCollectParticles(this.player.x, this.player.y, 'gem');
  }

  private render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Render dungeon
    this.dungeon.render(this.renderer, this.camera, this.canvas);

    // Render items
    for (const item of this.items) {
      item.render(this.renderer);
    }

    // Render enemies
    for (const enemy of this.enemies) {
      enemy.render(this.renderer);
    }

    // Render player
    this.player.render(this.renderer);

    // Render particles
    for (const particle of this.particles) {
      particle.render(this.renderer);
    }

    this.ctx.restore();

    // Render UI overlays
    if (this.gameOver) {
      this.renderGameOver();
    }
  }

  private renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Score: ${this.player.score} | Floor: ${this.player.currentFloor}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }
}
