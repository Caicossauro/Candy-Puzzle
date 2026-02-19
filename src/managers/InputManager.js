import { NUM_ROWS, NUM_COLS, SWIPE_THRESHOLD } from '../config/constants.js';

export default class InputManager {
  constructor(scene, boardManager, callbacks) {
    this.scene = scene;
    this.board = boardManager;
    this.callbacks = callbacks; // { onSwap(gem1, gem2), onSelect(gem), onDeselect() }

    this.selectedGem = null;
    this.dragGem = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasDragged = false;
    this.enabled = true;
  }

  setup() {
    this.scene.input.on('gameobjectdown', (pointer, gem) => {
      if (!this.enabled) return;
      this.dragGem = gem;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.hasDragged = false;
    });

    this.scene.input.on('pointermove', (pointer) => {
      if (!this.dragGem || !this.enabled || this.hasDragged) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > SWIPE_THRESHOLD) {
        this.hasDragged = true;
        this.handleSwipe(this.dragGem, dx, dy);
        this.dragGem = null;
      }
    });

    this.scene.input.on('pointerup', () => {
      if (!this.dragGem || !this.enabled) {
        this.dragGem = null;
        return;
      }

      if (!this.hasDragged) {
        this.handleClick(this.dragGem);
      }
      this.dragGem = null;
    });
  }

  handleSwipe(gem, dx, dy) {
    const row = gem.getData('row');
    const col = gem.getData('col');

    // Locked gems cannot be swiped
    if (this.board.obstacleMgr && this.board.obstacleMgr.isLocked(row, col)) return;

    let targetRow = row;
    let targetCol = col;

    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (
      targetRow < 0 ||
      targetRow >= NUM_ROWS ||
      targetCol < 0 ||
      targetCol >= NUM_COLS
    ) {
      return;
    }

    const targetGem = this.board.grid[targetRow][targetCol];
    if (targetGem) {
      if (this.board.obstacleMgr && this.board.obstacleMgr.isLocked(targetRow, targetCol)) return;
      this.clearSelection();
      this.callbacks.onSwap(gem, targetGem);
    }
  }

  handleClick(gem) {
    if (!this.selectedGem) {
      this.selectGem(gem);
    } else if (this.selectedGem === gem) {
      this.clearSelection();
    } else {
      const row1 = this.selectedGem.getData('row');
      const col1 = this.selectedGem.getData('col');
      const row2 = gem.getData('row');
      const col2 = gem.getData('col');
      const isAdjacent = Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;

      if (isAdjacent) {
        if (this.board.obstacleMgr &&
          (this.board.obstacleMgr.isLocked(row1, col1) || this.board.obstacleMgr.isLocked(row2, col2))) {
          this.selectGem(gem);
          return;
        }
        const selected = this.selectedGem;
        this.clearSelection();
        this.callbacks.onSwap(selected, gem);
      } else {
        this.selectGem(gem);
      }
    }
  }

  selectGem(gem) {
    this.selectedGem = gem;
    this.callbacks.onSelect(gem);

    // Bounce
    this.scene.tweens.add({
      targets: gem,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
    });
  }

  clearSelection() {
    this.selectedGem = null;
    this.callbacks.onDeselect();
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
