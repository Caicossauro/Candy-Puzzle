import Phaser from 'phaser';
import {
  NUM_COLS,
  NUM_ROWS,
  CELL_SIZE,
  SWAP_DURATION,
  DESTROY_DURATION,
  FALL_DURATION_PER_CELL,
  GEM_COLORS,
  SHUFFLE_DURATION,
  HINT_PULSE_DURATION,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
} from '../config/constants.js';
import SoundGenerator from '../audio/SoundGenerator.js';

export default class AnimationManager {
  constructor(scene, boardManager) {
    this.scene = scene;
    this.board = boardManager;
    this.hintTweens = [];
  }

  animateBoardEntry(grid) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < (grid[row] ? grid[row].length : 0); col++) {
        const gem = grid[row][col];
        if (!gem) continue;
        gem.setScale(0);
        this.scene.tweens.add({
          targets: gem,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          delay: (row * NUM_COLS + col) * 15,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  animateSwap(gem1, gem2, onComplete) {
    SoundGenerator.swap();
    const x1 = gem1.x;
    const y1 = gem1.y;
    const x2 = gem2.x;
    const y2 = gem2.y;
    let done = 0;

    const checkDone = () => {
      done++;
      if (done === 2 && onComplete) onComplete();
    };

    this.scene.tweens.add({
      targets: gem1,
      x: x2,
      y: y2,
      duration: SWAP_DURATION,
      ease: 'Quad.easeInOut',
      onComplete: checkDone,
    });

    this.scene.tweens.add({
      targets: gem2,
      x: x1,
      y: y1,
      duration: SWAP_DURATION,
      ease: 'Quad.easeInOut',
      onComplete: checkDone,
    });
  }

  shakeGem(gem) {
    this.scene.tweens.add({
      targets: gem,
      x: gem.x - 4,
      duration: 50,
      yoyo: true,
      repeat: 2,
    });
  }

  destroyMatches(matches, onComplete) {
    SoundGenerator.destroy();
    let remaining = matches.length;

    matches.forEach((match, i) => {
      const gem = this.board.grid[match.row][match.col];
      if (!gem) {
        remaining--;
        if (remaining <= 0 && onComplete) onComplete();
        return;
      }

      this.burstParticles(gem.x, gem.y, gem.getData('type'));
      this.board.clearCell(match.row, match.col);

      this.scene.tweens.add({
        targets: gem,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: DESTROY_DURATION,
        delay: i * 15,
        ease: 'Quad.easeIn',
        onComplete: () => {
          gem.destroy();
          remaining--;
          if (remaining <= 0 && onComplete) onComplete();
        },
      });
    });
  }

  burstParticles(x, y, type) {
    const colorObj = type >= 0 && type < GEM_COLORS.length
      ? GEM_COLORS[type]
      : { main: 0xffffff };
    const count = 8;

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(2, 5);
      const particle = this.scene.add.circle(x, y, size, colorObj.main);
      particle.setDepth(15);

      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.3, 0.3);
      const dist = Phaser.Math.Between(25, 55);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  animateSpecialSpawn(gem) {
    SoundGenerator.specialSpawn();
    // Flash branco + pulse ao criar gem especial
    const flash = this.scene.add.circle(gem.x, gem.y, 20, 0xffffff, 0.8);
    flash.setDepth(16);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    gem.setScale(0);
    this.scene.tweens.add({
      targets: gem,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: gem,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      },
    });
  }

  animateStripedLine(row, col, horizontal) {
    SoundGenerator.stripedActivation();
    const pos = this.board.gridToWorld(row, col);
    // Laser beam visual
    const beam = this.scene.add.graphics();
    beam.setDepth(18);

    if (horizontal) {
      const startX = BOARD_OFFSET_X - CELL_SIZE / 2;
      const endX = BOARD_OFFSET_X + (NUM_COLS - 0.5) * CELL_SIZE;
      beam.fillStyle(0xffffff, 0.6);
      beam.fillRect(startX, pos.y - 3, endX - startX, 6);
    } else {
      const startY = BOARD_OFFSET_Y - CELL_SIZE / 2;
      const endY = BOARD_OFFSET_Y + (NUM_ROWS - 0.5) * CELL_SIZE;
      beam.fillStyle(0xffffff, 0.6);
      beam.fillRect(pos.x - 3, startY, 6, endY - startY);
    }

    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => beam.destroy(),
    });
  }

  animateWrappedExplosion(row, col) {
    SoundGenerator.wrappedActivation();
    const pos = this.board.gridToWorld(row, col);
    // Anel de explosao expandindo
    const ring = this.scene.add.circle(pos.x, pos.y, 10, 0xffffff, 0);
    ring.setStrokeStyle(3, 0xffffff, 0.8);
    ring.setDepth(18);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Particulas extras
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const p = this.scene.add.circle(pos.x, pos.y, 3, 0xffee00);
      p.setDepth(17);
      this.scene.tweens.add({
        targets: p,
        x: pos.x + Math.cos(angle) * CELL_SIZE * 1.5,
        y: pos.y + Math.sin(angle) * CELL_SIZE * 1.5,
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  animateBombActivation(row, col) {
    SoundGenerator.bombActivation();
    const pos = this.board.gridToWorld(row, col);
    // Onda de choque multicolorida
    const colors = [0xff0066, 0xffee00, 0x00aaff, 0x00ff88];
    colors.forEach((c, i) => {
      const ring = this.scene.add.circle(pos.x, pos.y, 5, c, 0);
      ring.setStrokeStyle(2, c, 0.7);
      ring.setDepth(18);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 6 + i,
        scaleY: 6 + i,
        alpha: 0,
        duration: 500,
        delay: i * 60,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    });
  }

  screenShake(intensity = 4, duration = 100) {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  showFloatingPoints(matches, points) {
    let cx = 0;
    let cy = 0;
    matches.forEach((m) => {
      const pos = this.board.gridToWorld(m.row, m.col);
      cx += pos.x;
      cy += pos.y;
    });
    cx /= matches.length;
    cy /= matches.length;

    const txt = this.scene.add
      .text(cx, cy, `+${points}`, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.scene.tweens.add({
      targets: txt,
      y: cy - 50,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  dropAndFill(onComplete) {
    const grid = this.board.grid;
    const obsMgr = this.board.obstacleMgr;
    let maxDelay = 0;

    for (let col = 0; col < NUM_COLS; col++) {
      let emptyCount = 0;

      // Drop existing gems down
      for (let row = NUM_ROWS - 1; row >= 0; row--) {
        // Blocked cell acts as a floor
        if (obsMgr && !obsMgr.isCellActive(row, col)) {
          emptyCount = 0;
          continue;
        }

        if (!grid[row][col]) {
          emptyCount++;
        } else if (emptyCount > 0) {
          const gem = grid[row][col];
          const newRow = row + emptyCount;

          grid[newRow][col] = gem;
          grid[row][col] = null;
          gem.setData('row', newRow);

          const newPos = this.board.gridToWorld(newRow, col);
          const delay = emptyCount * FALL_DURATION_PER_CELL;
          maxDelay = Math.max(maxDelay, delay);

          this.scene.tweens.add({
            targets: gem,
            y: newPos.y,
            duration: delay,
            ease: 'Bounce.easeOut',
          });
        }
      }

      // Fill remaining empty active cells from top
      let newCount = 0;
      for (let row = 0; row < NUM_ROWS; row++) {
        if (obsMgr && !obsMgr.isCellActive(row, col)) {
          newCount = 0;
          continue;
        }
        if (grid[row][col]) continue;

        newCount++;
        const type = Phaser.Math.Between(0, this.board.numTypes - 1);
        const pos = this.board.gridToWorld(row, col);

        const gem = this.board.createGem(row, col, type);
        gem.y = pos.y - newCount * CELL_SIZE;

        grid[row][col] = gem;

        const delay = newCount * FALL_DURATION_PER_CELL + 50;
        maxDelay = Math.max(maxDelay, delay);

        this.scene.tweens.add({
          targets: gem,
          y: pos.y,
          duration: delay,
          ease: 'Bounce.easeOut',
        });
      }
    }

    this.scene.time.delayedCall(maxDelay + 100, () => {
      if (onComplete) onComplete();
    });
  }

  animateShuffle(grid, onComplete) {
    const half = SHUFFLE_DURATION / 2;
    const allGems = [];

    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        if (grid[row][col]) allGems.push(grid[row][col]);
      }
    }

    // Encolher todas as gems
    let shrinkDone = 0;
    allGems.forEach((gem) => {
      this.scene.tweens.add({
        targets: gem,
        scaleX: 0,
        scaleY: 0,
        duration: half,
        ease: 'Quad.easeIn',
        onComplete: () => {
          shrinkDone++;
          if (shrinkDone === allGems.length) {
            // Shuffle ja foi aplicado no BoardManager antes de chamar esta animacao
            // Agora expandir de volta
            allGems.forEach((g) => {
              g.setScale(0);
              this.scene.tweens.add({
                targets: g,
                scaleX: 1,
                scaleY: 1,
                duration: half,
                ease: 'Back.easeOut',
              });
            });
            this.scene.time.delayedCall(half + 50, () => {
              if (onComplete) onComplete();
            });
          }
        },
      });
    });
  }

  animateHint(gem1, gem2) {
    this.stopHint();

    [gem1, gem2].forEach((gem) => {
      const tween = this.scene.tweens.add({
        targets: gem,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.7,
        duration: HINT_PULSE_DURATION,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.hintTweens.push(tween);
    });
  }

  stopHint() {
    this.hintTweens.forEach((tween) => {
      if (tween && tween.isPlaying()) {
        const targets = tween.targets;
        tween.stop();
        // Restaurar escala e alpha
        targets.forEach((t) => {
          if (t && t.active) {
            t.setScale(1);
            t.setAlpha(1);
          }
        });
      }
    });
    this.hintTweens = [];
  }
}
