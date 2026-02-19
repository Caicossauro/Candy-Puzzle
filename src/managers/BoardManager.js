import Phaser from 'phaser';
import {
  NUM_ROWS,
  NUM_COLS,
  NUM_TYPES,
  CELL_SIZE,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  SPECIAL_NONE,
  TYPE_BOMB,
} from '../config/constants.js';

export default class BoardManager {
  constructor(scene, numTypes = NUM_TYPES) {
    this.scene = scene;
    this.grid = [];
    this.numTypes = numTypes;
  }

  gridToWorld(row, col) {
    return {
      x: BOARD_OFFSET_X + col * CELL_SIZE,
      y: BOARD_OFFSET_Y + row * CELL_SIZE,
    };
  }

  getTextureKey(type, special) {
    if (special === 'bomb' || type === TYPE_BOMB) return 'gem_bomb';
    if (special && special !== SPECIAL_NONE) return `gem_${type}_${special}`;
    return `gem_${type}`;
  }

  createGem(row, col, type, special = SPECIAL_NONE) {
    const pos = this.gridToWorld(row, col);
    const key = this.getTextureKey(type, special);
    const gem = this.scene.add.sprite(pos.x, pos.y, key);
    gem.setInteractive();
    gem.setData('row', row);
    gem.setData('col', col);
    gem.setData('type', type);
    gem.setData('special', special);
    return gem;
  }

  upgradeGemSpecial(gem, special) {
    const type = gem.getData('type');
    gem.setData('special', special);
    gem.setTexture(this.getTextureKey(type, special));
  }

  makeBomb(gem) {
    gem.setData('type', TYPE_BOMB);
    gem.setData('special', 'bomb');
    gem.setTexture('gem_bomb');
  }

  wouldMatchOnPlace(row, col, type) {
    if (
      col >= 2 &&
      this.grid[row][col - 1] &&
      this.grid[row][col - 1].getData('type') === type &&
      this.grid[row][col - 2] &&
      this.grid[row][col - 2].getData('type') === type
    ) {
      return true;
    }
    if (
      row >= 2 &&
      this.grid[row - 1] &&
      this.grid[row - 1][col] &&
      this.grid[row - 1][col].getData('type') === type &&
      this.grid[row - 2] &&
      this.grid[row - 2][col] &&
      this.grid[row - 2][col].getData('type') === type
    ) {
      return true;
    }
    return false;
  }

  fillInitialBoard() {
    for (let row = 0; row < NUM_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < NUM_COLS; col++) {
        if (this.obstacleMgr && !this.obstacleMgr.isCellActive(row, col)) {
          this.grid[row][col] = null;
          continue;
        }

        let type;
        do {
          type = Phaser.Math.Between(0, this.numTypes - 1);
        } while (this.wouldMatchOnPlace(row, col, type));

        const gem = this.createGem(row, col, type);
        this.grid[row][col] = gem;
      }
    }
  }

  swapData(gem1, gem2) {
    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');

    this.grid[r1][c1] = gem2;
    this.grid[r2][c2] = gem1;

    gem1.setData('row', r2);
    gem1.setData('col', c2);
    gem2.setData('row', r1);
    gem2.setData('col', c1);
  }

  getGemAt(row, col) {
    if (row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS) return null;
    return this.grid[row][col];
  }

  clearCell(row, col) {
    this.grid[row][col] = null;
  }

  setMatchManager(matchMgr) {
    this.matchMgr = matchMgr;
  }

  setObstacleManager(obsMgr) {
    this.obstacleMgr = obsMgr;
  }

  hasValidMoves() {
    const dirs = [[0, 1], [1, 0]];
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        for (const [dr, dc] of dirs) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= NUM_ROWS || nc >= NUM_COLS) continue;

          const gem1 = this.grid[row][col];
          const gem2 = this.grid[nr][nc];
          if (!gem1 || !gem2) continue;

          // Skip locked gems
          if (this.obstacleMgr &&
            (this.obstacleMgr.isLocked(row, col) || this.obstacleMgr.isLocked(nr, nc))) continue;

          // Swap com bomb e sempre valido
          if (gem1.getData('special') === 'bomb' || gem2.getData('special') === 'bomb') return true;

          this.swapData(gem1, gem2);
          const hasMatch = this.matchMgr.findAllMatches().length > 0;
          this.swapData(gem1, gem2);

          if (hasMatch) return true;
        }
      }
    }
    return false;
  }

  findHintMove() {
    const dirs = [[0, 1], [1, 0]];
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        for (const [dr, dc] of dirs) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= NUM_ROWS || nc >= NUM_COLS) continue;

          const gem1 = this.grid[row][col];
          const gem2 = this.grid[nr][nc];
          if (!gem1 || !gem2) continue;

          // Skip locked gems
          if (this.obstacleMgr &&
            (this.obstacleMgr.isLocked(row, col) || this.obstacleMgr.isLocked(nr, nc))) continue;

          if (gem1.getData('special') === 'bomb' || gem2.getData('special') === 'bomb') {
            return { gem1, gem2 };
          }

          this.swapData(gem1, gem2);
          const hasMatch = this.matchMgr.findAllMatches().length > 0;
          this.swapData(gem1, gem2);

          if (hasMatch) return { gem1, gem2 };
        }
      }
    }
    return null;
  }

  shuffleBoard() {
    const types = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        if (this.obstacleMgr && !this.obstacleMgr.isCellActive(row, col)) continue;
        if (this.obstacleMgr && this.obstacleMgr.isLocked(row, col)) continue;
        const gem = this.grid[row][col];
        if (gem && gem.getData('special') === SPECIAL_NONE) {
          types.push(gem.getData('type'));
        }
      }
    }

    for (let i = types.length - 1; i > 0; i--) {
      const j = Phaser.Math.Between(0, i);
      [types[i], types[j]] = [types[j], types[i]];
    }

    let idx = 0;
    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        if (this.obstacleMgr && !this.obstacleMgr.isCellActive(row, col)) continue;
        if (this.obstacleMgr && this.obstacleMgr.isLocked(row, col)) continue;
        const gem = this.grid[row][col];
        if (gem && gem.getData('special') === SPECIAL_NONE) {
          gem.setData('type', types[idx]);
          gem.setTexture(`gem_${types[idx]}`);
          idx++;
        }
      }
    }
  }
}
