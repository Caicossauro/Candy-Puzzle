import { NUM_ROWS, NUM_COLS, CELL_SIZE } from '../config/constants.js';
import SoundGenerator from '../audio/SoundGenerator.js';

/**
 * Gerencia obstaculos no tabuleiro: gelo, cadeado e celulas bloqueadas.
 *
 * - Gelo (ice): 1-2 camadas. Quebra com matches adjacentes ou sobre.
 * - Cadeado (lock): Gem nao pode ser movida. Quebra quando a gem e combinada.
 * - Layout: Celulas bloqueadas onde nenhuma gem pode existir.
 */
export default class ObstacleManager {
  constructor(scene, boardManager) {
    this.scene = scene;
    this.board = boardManager;

    // ice[row][col] = 0 (sem gelo), 1 ou 2 (camadas)
    this.ice = [];
    // locks[row][col] = true/false
    this.locks = [];
    // layout[row][col] = true (ativa) / false (bloqueada)
    this.layout = [];
    // Sprites visuais
    this.iceSprites = [];
    this.lockSprites = [];

    this.initEmptyGrid();
  }

  initEmptyGrid() {
    for (let r = 0; r < NUM_ROWS; r++) {
      this.ice[r] = [];
      this.locks[r] = [];
      this.layout[r] = [];
      this.iceSprites[r] = [];
      this.lockSprites[r] = [];
      for (let c = 0; c < NUM_COLS; c++) {
        this.ice[r][c] = 0;
        this.locks[r][c] = false;
        this.layout[r][c] = true;
        this.iceSprites[r][c] = null;
        this.lockSprites[r][c] = null;
      }
    }
  }

  /**
   * Configura obstaculos a partir dos dados do nivel.
   * levelData.ice = [[row, col, layers], ...]
   * levelData.locks = [[row, col], ...]
   * levelData.layout = 2D array de 0/1 (opcional)
   */
  loadFromLevel(levelData) {
    if (levelData.layout) {
      for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
          this.layout[r][c] = levelData.layout[r]
            ? !!levelData.layout[r][c]
            : true;
        }
      }
    }

    if (levelData.ice) {
      for (const [row, col, layers] of levelData.ice) {
        this.ice[row][col] = layers || 1;
      }
    }

    if (levelData.locks) {
      for (const [row, col] of levelData.locks) {
        this.locks[row][col] = true;
      }
    }
  }

  /** Verifica se a celula esta ativa (nao bloqueada pelo layout) */
  isCellActive(row, col) {
    if (row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS) return false;
    return this.layout[row][col];
  }

  /** Verifica se a gem nesta posicao esta trancada */
  isLocked(row, col) {
    return this.locks[row][col];
  }

  /** Retorna camadas de gelo na posicao */
  getIce(row, col) {
    return this.ice[row][col];
  }

  /** Verifica se o nivel tem algum obstaculo */
  hasObstacles() {
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (!this.layout[r][c] || this.ice[r][c] > 0 || this.locks[r][c]) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Renderizacao ──────────────────────────────────────────────

  /** Desenha celulas bloqueadas no tabuleiro */
  drawBlockedCells() {
    const g = this.scene.add.graphics();
    g.setDepth(0);

    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (!this.layout[r][c]) {
          const pos = this.board.gridToWorld(r, c);
          g.fillStyle(0x0a0a1a, 0.9);
          g.fillRect(
            pos.x - CELL_SIZE / 2,
            pos.y - CELL_SIZE / 2,
            CELL_SIZE,
            CELL_SIZE
          );
        }
      }
    }
  }

  /** Cria sprites de gelo sobre as gems */
  renderIce() {
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (this.ice[r][c] > 0) {
          this.createIceSprite(r, c);
        }
      }
    }
  }

  createIceSprite(row, col) {
    if (this.iceSprites[row][col]) {
      this.iceSprites[row][col].destroy();
    }
    const pos = this.board.gridToWorld(row, col);
    const key = this.ice[row][col] >= 2 ? 'ice_2' : 'ice_1';
    const sprite = this.scene.add.sprite(pos.x, pos.y, key);
    sprite.setDepth(5);
    sprite.setAlpha(this.ice[row][col] >= 2 ? 0.7 : 0.5);
    this.iceSprites[row][col] = sprite;
  }

  /** Cria sprites de cadeado sobre as gems */
  renderLocks() {
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (this.locks[r][c]) {
          this.createLockSprite(r, c);
        }
      }
    }
  }

  createLockSprite(row, col) {
    if (this.lockSprites[row][col]) {
      this.lockSprites[row][col].destroy();
    }
    const pos = this.board.gridToWorld(row, col);
    const sprite = this.scene.add.sprite(pos.x, pos.y, 'lock_overlay');
    sprite.setDepth(6);
    this.lockSprites[row][col] = sprite;
  }

  // ── Logica de quebra ──────────────────────────────────────────

  /**
   * Processa gelo adjacente a celulas destruidas.
   * Retorna array de celulas cujo gelo foi completamente removido.
   */
  processIceBreak(destroyedCells) {
    const iceAffected = new Set();

    for (const cell of destroyedCells) {
      // A propria celula e adjacentes
      const targets = [
        { row: cell.row, col: cell.col },
        { row: cell.row - 1, col: cell.col },
        { row: cell.row + 1, col: cell.col },
        { row: cell.row, col: cell.col - 1 },
        { row: cell.row, col: cell.col + 1 },
      ];

      for (const t of targets) {
        if (
          t.row >= 0 && t.row < NUM_ROWS &&
          t.col >= 0 && t.col < NUM_COLS &&
          this.ice[t.row][t.col] > 0
        ) {
          iceAffected.add(`${t.row},${t.col}`);
        }
      }
    }

    const broken = [];
    for (const key of iceAffected) {
      const [r, c] = key.split(',').map(Number);
      this.ice[r][c]--;

      if (this.ice[r][c] <= 0) {
        this.ice[r][c] = 0;
        broken.push({ row: r, col: c });
      }

      // Atualizar sprite
      this.animateIceBreak(r, c);
    }

    return broken;
  }

  animateIceBreak(row, col) {
    const sprite = this.iceSprites[row][col];
    if (!sprite) return;

    SoundGenerator.destroy();

    if (this.ice[row][col] <= 0) {
      // Destruir sprite completamente
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 250,
        onComplete: () => {
          sprite.destroy();
          this.iceSprites[row][col] = null;
        },
      });

      // Particulas de gelo
      const pos = this.board.gridToWorld(row, col);
      for (let i = 0; i < 6; i++) {
        const p = this.scene.add.circle(
          pos.x, pos.y, 3, 0x85c1e9
        );
        p.setDepth(15);
        const angle = (Math.PI * 2 * i) / 6;
        this.scene.tweens.add({
          targets: p,
          x: pos.x + Math.cos(angle) * 30,
          y: pos.y + Math.sin(angle) * 30,
          alpha: 0,
          duration: 300,
          onComplete: () => p.destroy(),
        });
      }
    } else {
      // Reduzir para camada 1
      sprite.setTexture('ice_1');
      sprite.setAlpha(0.5);
      this.scene.tweens.add({
        targets: sprite,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
      });
    }
  }

  /**
   * Processa cadeados em celulas destruidas.
   * Remove locks das celulas que foram matched.
   */
  processLockBreak(destroyedCells) {
    const unlocked = [];

    for (const cell of destroyedCells) {
      if (this.locks[cell.row][cell.col]) {
        this.locks[cell.row][cell.col] = false;
        unlocked.push(cell);
        this.animateLockBreak(cell.row, cell.col);
      }
    }

    return unlocked;
  }

  animateLockBreak(row, col) {
    const sprite = this.lockSprites[row][col];
    if (!sprite) return;

    SoundGenerator.wrappedActivation();

    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      angle: 15,
      duration: 300,
      onComplete: () => {
        sprite.destroy();
        this.lockSprites[row][col] = null;
      },
    });
  }

  /** Verifica se todo o gelo foi removido */
  isAllIceCleared() {
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (this.ice[r][c] > 0) return false;
      }
    }
    return true;
  }

  /** Verifica se todos os cadeados foram removidos */
  isAllLocksCleared() {
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        if (this.locks[r][c]) return false;
      }
    }
    return true;
  }
}
