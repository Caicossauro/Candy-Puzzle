import {
  NUM_ROWS,
  NUM_COLS,
  CELL_SIZE,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
} from '../config/constants.js';
import { STRINGS } from '../config/strings.js';

// Neon palette para HUD
const NEON_BLUE   = '#00aaff';
const NEON_YELLOW = '#ffee00';
const NEON_PINK   = '#ff0066';
const NEON_GREEN  = '#00ff88';
const NEON_DIM    = '#445566';

export default class UIManager {
  constructor(scene, boardManager) {
    this.scene = scene;
    this.board = boardManager;
    this.scoreText = null;
    this.comboText = null;
    this.selectionSprite = null;
    this.movesText = null;
    this.targetText = null;
    this.timerText = null;
  }

  drawBoard() {
    const padding = 8;
    const boardW = NUM_COLS * CELL_SIZE + padding * 2;
    const boardH = NUM_ROWS * CELL_SIZE + padding * 2;
    const boardX = BOARD_OFFSET_X - CELL_SIZE / 2 - padding;
    const boardY = BOARD_OFFSET_Y - CELL_SIZE / 2 - padding;

    const bg = this.scene.add.graphics();

    // Fundo preto
    bg.fillStyle(0x000000, 1);
    bg.fillRoundedRect(boardX, boardY, boardW, boardH, 14);

    // Glow externo neon roxo
    bg.lineStyle(8, 0x6600ff, 0.1);
    bg.strokeRoundedRect(boardX - 2, boardY - 2, boardW + 4, boardH + 4, 16);

    // Borda neon nitida
    bg.lineStyle(1.5, 0x6600ff, 0.7);
    bg.strokeRoundedRect(boardX, boardY, boardW, boardH, 14);

    // Grade sutil — celulas como pontos
    bg.lineStyle(1, 0x111133, 0.9);
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        const pos = this.board.gridToWorld(r, c);
        bg.strokeCircle(pos.x, pos.y, CELL_SIZE / 2 - 1);
      }
    }
  }

  createHUD(maxMoves, targetScore) {
    // Titulo
    this.scene.add
      .text(240, 18, STRINGS.title, {
        fontSize: '26px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00aaff',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Movimentos (esquerda)
    this.scene.add
      .text(70, 50, STRINGS.movesLabel, {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_DIM,
      })
      .setOrigin(0.5);

    this.movesText = this.scene.add
      .text(70, 75, maxMoves.toString(), {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_BLUE,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Pontuacao (centro)
    this.scene.add
      .text(240, 50, STRINGS.scoreLabel, {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_DIM,
      })
      .setOrigin(0.5);

    this.scoreText = this.scene.add
      .text(240, 75, '0', {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_YELLOW,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Objetivo (direita)
    this.scene.add
      .text(410, 50, STRINGS.targetLabel, {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_DIM,
      })
      .setOrigin(0.5);

    this.targetText = this.scene.add
      .text(410, 75, targetScore.toString(), {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_PINK,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Barra de progresso — neon
    this.progressBarBg = this.scene.add.graphics();
    this.progressBarBg.lineStyle(1, 0x334455, 0.8);
    this.progressBarBg.strokeRoundedRect(80, 102, 320, 10, 5);
    this.progressBarBg.fillStyle(0x050510, 0.9);
    this.progressBarBg.fillRoundedRect(80, 102, 320, 10, 5);

    this.progressBarFill = this.scene.add.graphics();
    this.targetScore = targetScore;
    this.updateProgressBar(0);

    // Timer — canto superior direito (abaixo do botao de pausa)
    this.scene.add
      .text(455, 40, 'TEMPO', {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_DIM,
      })
      .setOrigin(0.5);

    this.timerText = this.scene.add
      .text(455, 56, '0:00', {
        fontSize: '15px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_GREEN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Combo text — neon yellow com glow
    this.comboText = this.scene.add
      .text(240, 128, '', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_YELLOW,
        fontStyle: 'bold',
        stroke: '#ffee00',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Anel de selecao
    this.selectionSprite = this.scene.add.sprite(0, 0, 'selection_ring');
    this.selectionSprite.setVisible(false);
    this.selectionSprite.setDepth(10);

    this.scene.tweens.add({
      targets: this.selectionSprite,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.5,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  updateScore(score) {
    this.scoreText.setText(score.toString());
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
    });
    this.updateProgressBar(score);
  }

  showCombo(comboCount) {
    const labels = STRINGS.combo;
    const label = comboCount < labels.length
      ? labels[comboCount]
      : STRINGS.comboLegendary(comboCount);

    this.comboText.setText(label);
    this.comboText.setAlpha(1);
    this.comboText.setScale(0.5);

    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.comboText,
          alpha: 0,
          scaleY: 0.8,
          delay: 600,
          duration: 300,
        });
      },
    });
  }

  setSelectionPosition(x, y) {
    this.selectionSprite.setPosition(x, y);
    this.selectionSprite.setVisible(true);
  }

  hideSelection() {
    this.selectionSprite.setVisible(false);
  }

  updateMoves(remaining) {
    this.movesText.setText(remaining.toString());

    if (remaining <= 3) {
      this.movesText.setColor(NEON_PINK);
      this.scene.tweens.add({
        targets: this.movesText,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 100,
        yoyo: true,
      });
    }
  }

  updateProgressBar(score) {
    this.progressBarFill.clear();
    const ratio = Math.min(score / this.targetScore, 1);
    const width = 320 * ratio;
    if (width > 0) {
      const neonFill = ratio >= 1 ? 0x00ff88 : 0x00aaff;
      const glowFill = ratio >= 1 ? 0x00ff88 : 0x00aaff;
      // Glow
      this.progressBarFill.fillStyle(glowFill, 0.2);
      this.progressBarFill.fillRoundedRect(80, 100, width, 14, 5);
      // Fill nitido
      this.progressBarFill.fillStyle(neonFill, 1.0);
      this.progressBarFill.fillRoundedRect(80, 103, width, 8, 4);
    }
  }

  updateTimer(seconds) {
    if (!this.timerText) return;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
  }

  showShuffleText() {
    const txt = this.scene.add
      .text(240, 400, STRINGS.shuffling, {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: NEON_BLUE,
        fontStyle: 'bold',
        stroke: '#00aaff',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: txt,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => txt.destroy(),
    });
  }
}
