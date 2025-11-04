import { PixelRenderer } from './PixelRenderer';

export class Dungeon {
  width: number;
  height: number;
  tiles: number[][];
  startX: number = 0;
  startY: number = 0;
  exitX: number = 0;
  exitY: number = 0;
  floor: number;

  constructor(width: number, height: number, floor: number) {
    this.width = width;
    this.height = height;
    this.floor = floor;
    this.tiles = this.generateDungeon();
  }

  private generateDungeon(): number[][] {
    // Initialize with walls
    const tiles: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = 1;
      }
    }

    // Generate rooms
    const rooms: { x: number; y: number; width: number; height: number }[] = [];
    const numRooms = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numRooms; i++) {
      const roomWidth = 4 + Math.floor(Math.random() * 6);
      const roomHeight = 4 + Math.floor(Math.random() * 6);
      const roomX = Math.floor(Math.random() * (this.width - roomWidth - 2)) + 1;
      const roomY = Math.floor(Math.random() * (this.height - roomHeight - 2)) + 1;

      // Check for overlap
      let overlaps = false;
      for (const room of rooms) {
        if (
          roomX < room.x + room.width + 1 &&
          roomX + roomWidth + 1 > room.x &&
          roomY < room.y + room.height + 1 &&
          roomY + roomHeight + 1 > room.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });

        // Carve out room
        for (let y = roomY; y < roomY + roomHeight; y++) {
          for (let x = roomX; x < roomX + roomWidth; x++) {
            tiles[y][x] = 0;
          }
        }
      }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const prevRoom = rooms[i - 1];
      const currRoom = rooms[i];

      const prevCenterX = Math.floor(prevRoom.x + prevRoom.width / 2);
      const prevCenterY = Math.floor(prevRoom.y + prevRoom.height / 2);
      const currCenterX = Math.floor(currRoom.x + currRoom.width / 2);
      const currCenterY = Math.floor(currRoom.y + currRoom.height / 2);

      // Horizontal corridor
      const startX = Math.min(prevCenterX, currCenterX);
      const endX = Math.max(prevCenterX, currCenterX);
      for (let x = startX; x <= endX; x++) {
        tiles[prevCenterY][x] = 0;
        if (prevCenterY > 0) tiles[prevCenterY - 1][x] = 0;
      }

      // Vertical corridor
      const startY = Math.min(prevCenterY, currCenterY);
      const endY = Math.max(prevCenterY, currCenterY);
      for (let y = startY; y <= endY; y++) {
        tiles[y][currCenterX] = 0;
        if (currCenterX > 0) tiles[y][currCenterX - 1] = 0;
      }
    }

    // Set start position
    if (rooms.length > 0) {
      const startRoom = rooms[0];
      this.startX = Math.floor(startRoom.x + startRoom.width / 2);
      this.startY = Math.floor(startRoom.y + startRoom.height / 2);
      tiles[this.startY][this.startX] = 2; // Start tile

      // Set exit position
      const exitRoom = rooms[rooms.length - 1];
      this.exitX = Math.floor(exitRoom.x + exitRoom.width / 2);
      this.exitY = Math.floor(exitRoom.y + exitRoom.height / 2);
      tiles[this.exitY][this.exitX] = 3; // Exit/stairs tile
    }

    return tiles;
  }

  render(renderer: PixelRenderer, camera: { x: number; y: number }, canvas: HTMLCanvasElement) {
    const startX = Math.max(0, Math.floor(camera.x / 16) - 1);
    const endX = Math.min(this.width, Math.ceil((camera.x + canvas.width) / 16) + 1);
    const startY = Math.max(0, Math.floor(camera.y / 16) - 1);
    const endY = Math.min(this.height, Math.ceil((camera.y + canvas.height) / 16) + 1);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.tiles[y][x];
        const screenX = x * 16;
        const screenY = y * 16;

        if (tile === 0) {
          // Floor
          this.renderFloor(renderer, screenX, screenY);
        } else if (tile === 1) {
          // Wall
          this.renderWall(renderer, screenX, screenY, x, y);
        } else if (tile === 2) {
          // Start
          this.renderFloor(renderer, screenX, screenY);
          this.renderStart(renderer, screenX, screenY);
        } else if (tile === 3) {
          // Exit/Stairs
          this.renderFloor(renderer, screenX, screenY);
          this.renderStairs(renderer, screenX, screenY);
        }
      }
    }
  }

  private renderFloor(renderer: PixelRenderer, x: number, y: number) {
    const baseColor = '#2a2a2a';
    const accentColor = '#333333';
    
    for (let dy = 0; dy < 16; dy++) {
      for (let dx = 0; dx < 16; dx++) {
        const color = (dx + dy) % 4 === 0 ? accentColor : baseColor;
        renderer.drawPixel(x + dx, y + dy, color);
      }
    }
  }

  private renderWall(renderer: PixelRenderer, x: number, y: number, tileX: number, tileY: number) {
    const topColor = '#5a5a5a';
    const sideColor = '#4a4a4a';
    const darkColor = '#3a3a3a';

    // Check if this is a top edge
    const isTopEdge = tileY === 0 || this.tiles[tileY - 1][tileX] === 0;

    if (isTopEdge) {
      // Top face
      for (let dy = 0; dy < 6; dy++) {
        for (let dx = 0; dx < 16; dx++) {
          renderer.drawPixel(x + dx, y + dy, topColor);
        }
      }
      // Front face
      for (let dy = 6; dy < 16; dy++) {
        for (let dx = 0; dx < 16; dx++) {
          const color = dx % 4 === 0 ? darkColor : sideColor;
          renderer.drawPixel(x + dx, y + dy, color);
        }
      }
    } else {
      // Just a solid wall
      for (let dy = 0; dy < 16; dy++) {
        for (let dx = 0; dx < 16; dx++) {
          renderer.drawPixel(x + dx, y + dy, darkColor);
        }
      }
    }
  }

  private renderStart(renderer: PixelRenderer, x: number, y: number) {
    const color = '#00ff00';
    const centerX = x + 8;
    const centerY = y + 8;

    // Draw a green marker
    for (let i = -2; i <= 2; i++) {
      renderer.drawPixel(centerX + i, centerY, color);
      renderer.drawPixel(centerX, centerY + i, color);
    }
  }

  private renderStairs(renderer: PixelRenderer, x: number, y: number) {
    const color = '#ffd700';
    const darkColor = '#cc9900';

    // Draw stairs
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 2; j++) {
        const stairColor = i % 2 === 0 ? color : darkColor;
        renderer.drawPixel(x + 4 + i, y + 4 + i - j, stairColor);
      }
    }

    // Add glow effect
    const glowColor = 'rgba(255, 215, 0, 0.3)';
    for (let dy = 2; dy < 14; dy++) {
      for (let dx = 2; dx < 14; dx++) {
        if (Math.random() > 0.7) {
          renderer.drawPixel(x + dx, y + dy, glowColor);
        }
      }
    }
  }
}
