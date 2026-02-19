import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { STRINGS } from '../config/strings.js';
import Button from '../ui/Button.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.levelData = data.levelData;
  }

  create() {
    // Dark overlay — mais opaco para contraste neon
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel neon — fundo quase preto + borda neon azul
    const px = GAME_WIDTH / 2 - 160;
    const py = 210;
    const pw = 320;
    const ph = 300;
    const panel = this.add.graphics();
    panel.fillStyle(0x030308, 0.97);
    panel.fillRoundedRect(px, py, pw, ph, 20);
    panel.lineStyle(8, 0x00aaff, 0.12);
    panel.strokeRoundedRect(px - 2, py - 2, pw + 4, ph + 4, 22);
    panel.lineStyle(1.5, 0x00aaff, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 20);

    // Title — neon white
    this.add
      .text(GAME_WIDTH / 2, 255, STRINGS.pause, {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00aaff',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Resume button — neon green
    new Button(this, GAME_WIDTH / 2, 330, STRINGS.resume, {
      width: 220,
      height: 46,
      color: 0x00ff88,
      hoverColor: 0x00ff88,
      onClick: () => {
        this.scene.resume('GameScene');
        this.scene.stop();
      },
    });

    // Restart button — neon orange
    new Button(this, GAME_WIDTH / 2, 390, STRINGS.restart, {
      width: 220,
      height: 46,
      color: 0xff6600,
      hoverColor: 0xff6600,
      onClick: () => {
        const data = this.levelData;
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('GameScene', data);
      },
    });

    // Quit button — neon pink
    new Button(this, GAME_WIDTH / 2, 450, STRINGS.quit, {
      width: 220,
      height: 46,
      color: 0xff0066,
      hoverColor: 0xff0066,
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('LevelSelectScene');
      },
    });
  }
}
