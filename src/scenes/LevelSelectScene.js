import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { STRINGS } from '../config/strings.js';
import Button from '../ui/Button.js';
import LevelManager from '../managers/LevelManager.js';
import ProgressManager from '../managers/ProgressManager.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const progress = ProgressManager.load();
    const levels = LevelManager.getAllLevels();
    const totalStars = ProgressManager.getTotalStars(progress);

    // Background — preto puro
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title — neon
    this.add
      .text(GAME_WIDTH / 2, 45, STRINGS.selectLevel, {
        fontSize: '26px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00aaff',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Total stars counter — neon yellow
    this.add
      .text(GAME_WIDTH - 50, 45, `\u2605 ${totalStars}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffee00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Back button — neon blue
    new Button(this, 40, 45, '\u2190', {
      width: 44,
      height: 44,
      fontSize: '24px',
      color: 0x00aaff,
      hoverColor: 0x00aaff,
      radius: 22,
      onClick: () => this.scene.start('MenuScene'),
    });

    // Level grid: 4 columns, scrollable container
    const cols = 4;
    const startX = 78;
    const startY = 100;
    const spacingX = 108;
    const spacingY = 100;

    // Scrollable container for many levels
    const totalRows = Math.ceil(levels.length / cols);
    const contentHeight = totalRows * spacingY + 40;
    const visibleHeight = GAME_HEIGHT - startY;
    const needsScroll = contentHeight > visibleHeight;

    this.scrollContainer = this.add.container(0, 0);

    levels.forEach((levelData, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const unlocked = ProgressManager.isLevelUnlocked(levelData.level, progress);
      const stars = ProgressManager.getStars(levelData.level, progress);

      this.createLevelButton(x, y, levelData, unlocked, stars);
    });

    // Scroll support for many levels
    if (needsScroll) {
      this.scrollY = 0;
      this.maxScroll = contentHeight - visibleHeight + 20;

      this.input.on('wheel', (_pointer, _gos, _dx, dy) => {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll);
        this.scrollContainer.y = -this.scrollY;
      });
    }
  }

  createLevelButton(x, y, levelData, unlocked, stars) {
    const container = this.add.container(x, y);
    this.scrollContainer.add(container);

    const bg = this.add.graphics();
    const neonBorder = 0x00aaff;
    if (unlocked) {
      // Fundo escuro + borda neon
      bg.fillStyle(0x000000, 0.9);
      bg.fillRoundedRect(-38, -38, 76, 76, 14);
      bg.lineStyle(5, neonBorder, 0.12);
      bg.strokeRoundedRect(-40, -40, 80, 80, 16);
      bg.lineStyle(1.5, neonBorder, 0.8);
      bg.strokeRoundedRect(-38, -38, 76, 76, 14);
    } else {
      bg.fillStyle(0x0a0a1a, 0.6);
      bg.fillRoundedRect(-38, -38, 76, 76, 14);
      bg.lineStyle(1, 0x222233, 0.6);
      bg.strokeRoundedRect(-38, -38, 76, 76, 14);
    }
    container.add(bg);

    // Level number
    const numText = this.add
      .text(0, stars > 0 ? -6 : 0, levelData.level.toString(), {
        fontSize: '26px',
        fontFamily: 'Arial, sans-serif',
        color: unlocked ? '#ffffff' : '#333355',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(numText);

    if (unlocked) {
      // Stars display — neon yellow
      const starChars = [];
      for (let i = 0; i < 3; i++) {
        starChars.push(i < stars ? '\u2605' : '\u2606');
      }
      const starText = this.add
        .text(0, 22, starChars.join(''), {
          fontSize: '13px',
          color: stars > 0 ? '#ffee00' : '#334455',
        })
        .setOrigin(0.5);
      container.add(starText);

      // Interactive zone
      const zone = this.add
        .zone(0, 0, 76, 76)
        .setInteractive({ useHandCursor: true });
      container.add(zone);

      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(neonBorder, 0.18);
        bg.fillRoundedRect(-38, -38, 76, 76, 14);
        bg.lineStyle(7, neonBorder, 0.2);
        bg.strokeRoundedRect(-40, -40, 80, 80, 16);
        bg.lineStyle(2, neonBorder, 1.0);
        bg.strokeRoundedRect(-38, -38, 76, 76, 14);
        container.setScale(1.1);
      });
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(-38, -38, 76, 76, 14);
        bg.lineStyle(5, neonBorder, 0.12);
        bg.strokeRoundedRect(-40, -40, 80, 80, 16);
        bg.lineStyle(1.5, neonBorder, 0.8);
        bg.strokeRoundedRect(-38, -38, 76, 76, 14);
        container.setScale(1);
      });
      zone.on('pointerup', () => {
        this.scene.start('GameScene', levelData);
      });
    }

    // Entry animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: (levelData.level - 1) * 20,
      ease: 'Back.easeOut',
    });
  }
}
