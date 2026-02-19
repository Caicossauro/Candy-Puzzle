import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { STRINGS } from '../config/strings.js';
import Button from '../ui/Button.js';
import LevelManager from '../managers/LevelManager.js';
import ProgressManager from '../managers/ProgressManager.js';
import SoundGenerator from '../audio/SoundGenerator.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.won = data.won;
    this.finalScore = data.score;
    this.level = data.level;
    this.targetScore = data.targetScore;
    this.levelData = data.levelData;
    this.elapsedTime = data.elapsedTime || 0;
  }

  create() {
    // Background — preto puro
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Confetti (se venceu)
    if (this.won) {
      this.spawnConfetti();
    }

    // Panel neon
    const panelNeon = this.won ? 0x00ff88 : 0xff0066;
    const panel = this.add.graphics();
    panel.fillStyle(0x030308, 0.97);
    panel.fillRoundedRect(40, 170, GAME_WIDTH - 80, 380, 20);
    panel.lineStyle(8, panelNeon, 0.1);
    panel.strokeRoundedRect(38, 168, GAME_WIDTH - 76, 384, 22);
    panel.lineStyle(1.5, panelNeon, 0.8);
    panel.strokeRoundedRect(40, 170, GAME_WIDTH - 80, 380, 20);

    // Title
    const titleColor = this.won ? '#00ff88' : '#ff0066';
    const titleStr = this.won ? STRINGS.levelComplete : STRINGS.outOfMoves;
    const title = this.add
      .text(GAME_WIDTH / 2, 210, titleStr, {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: titleColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Level indicator — neon dim
    const levelText = this.add
      .text(GAME_WIDTH / 2, 245, `${STRINGS.level} ${this.level}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#445566',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Stars (if won)
    let starsEarned = 0;
    if (this.won) {
      starsEarned = LevelManager.calculateStars(this.level, this.finalScore);
      ProgressManager.completeLevel(this.level, this.finalScore, starsEarned);

      for (let i = 0; i < 3; i++) {
        const starX = GAME_WIDTH / 2 - 50 + i * 50;
        const earned = i < starsEarned;
        const star = this.add
          .text(starX, 300, '\u2605', {
            fontSize: '48px',
            color: earned ? '#ffee00' : '#222233',
          })
          .setOrigin(0.5);

        if (earned) {
          star.setScale(0);
          const starIndex = i;
          this.tweens.add({
            targets: star,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            delay: 400 + i * 250,
            ease: 'Back.easeOut',
            onStart: () => SoundGenerator.star(starIndex),
          });
        }
      }
    }

    // Score — neon cyan
    const scoreY = this.won ? 365 : 310;
    const scoreTxt = this.add
      .text(GAME_WIDTH / 2, scoreY, `${STRINGS.scoreLabel}: ${this.finalScore}`, {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#00aaff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // High score — dim neon
    const progress = ProgressManager.load();
    const highScore = ProgressManager.getHighScore(this.level, progress);
    const highScoreTxt = this.add
      .text(GAME_WIDTH / 2, scoreY + 30, `Recorde: ${highScore}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#334455',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Elapsed time — dim, at panel bottom
    const m = Math.floor(this.elapsedTime / 60);
    const s = this.elapsedTime % 60;
    const timeTxt = this.add
      .text(GAME_WIDTH / 2, 538, `\u23f1 ${m}:${s.toString().padStart(2, '0')}`, {
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        color: '#334455',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Buttons
    const fadeItems = [title, levelText, scoreTxt, highScoreTxt, timeTxt];
    const btnBaseY = this.won ? 455 : 410;

    // Next level button (only if won and next level exists) — neon green
    if (this.won) {
      const nextLevelData = LevelManager.getNextLevel(this.level);
      if (nextLevelData) {
        const nextBtn = new Button(this, GAME_WIDTH / 2, btnBaseY - 55, STRINGS.nextLevel, {
          width: 220,
          height: 46,
          color: 0x00ff88,
          hoverColor: 0x00ff88,
          onClick: () => {
            this.scene.start('GameScene', nextLevelData);
          },
        });
        nextBtn.setAlpha(0);
        fadeItems.push(nextBtn);
      }
    }

    // Retry button — neon red/dim
    const retryBtn = new Button(this, GAME_WIDTH / 2, btnBaseY, STRINGS.retry, {
      width: 220,
      height: 46,
      color: this.won ? 0x334466 : 0xff0066,
      hoverColor: this.won ? 0x334466 : 0xff0066,
      onClick: () => {
        this.scene.start('GameScene', this.levelData);
      },
    });
    retryBtn.setAlpha(0);
    fadeItems.push(retryBtn);

    // Menu button — neon blue dim
    const menuBtn = new Button(this, GAME_WIDTH / 2, btnBaseY + 55, STRINGS.menu, {
      width: 220,
      height: 46,
      color: 0x334466,
      hoverColor: 0x334466,
      onClick: () => {
        this.scene.start('LevelSelectScene');
      },
    });
    menuBtn.setAlpha(0);
    fadeItems.push(menuBtn);

    // Animate entry
    fadeItems.forEach((item, i) => {
      this.tweens.add({
        targets: item,
        alpha: 1,
        duration: 400,
        delay: 150 + i * 80,
      });
    });
  }

  spawnConfetti() {
    // Cores neon para o confetti
    const colors = [0xff0066, 0xffee00, 0x00ff88, 0x00aaff, 0xcc00ff, 0xff6600];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const size = Phaser.Math.Between(3, 7);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const confetti = this.add.rectangle(x, -10, size, size * 2, color);
      confetti.setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        angle: confetti.angle + Phaser.Math.Between(-180, 180),
        x: x + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 800),
        ease: 'Quad.easeIn',
        onComplete: () => confetti.destroy(),
      });
    }
  }
}
