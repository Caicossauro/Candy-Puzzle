import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { STRINGS } from '../config/strings.js';
import Button from '../ui/Button.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Background — preto puro
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Floating decorative gems — mais visiveis no fundo preto
    for (let i = 0; i < 14; i++) {
      const type = Phaser.Math.Between(0, 5);
      const x = Phaser.Math.Between(30, GAME_WIDTH - 30);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const gem = this.add.sprite(x, y, `gem_${type}`);
      gem.setAlpha(0.25);
      gem.setScale(Phaser.Math.FloatBetween(0.6, 1.2));

      this.tweens.add({
        targets: gem,
        y: y + Phaser.Math.Between(-25, 25),
        x: x + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(2500, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Title — neon cyan com glow stroke
    const title = this.add
      .text(GAME_WIDTH / 2, 220, STRINGS.title, {
        fontSize: '44px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00aaff',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle — neon dim
    const subtitle = this.add
      .text(GAME_WIDTH / 2, 270, 'Match-3 Puzzle Game', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#6688aa',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Title pulse
    this.tweens.add({
      targets: title,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Play button — neon green
    const playBtn = new Button(this, GAME_WIDTH / 2, 400, STRINGS.play, {
      width: 240,
      height: 56,
      fontSize: '28px',
      color: 0x00ff88,
      hoverColor: 0x00ff88,
      radius: 16,
      onClick: () => this.scene.start('LevelSelectScene'),
    });
    playBtn.setAlpha(0);

    // Animate entry
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 220,
      duration: 600,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 200,
    });
    this.tweens.add({
      targets: playBtn,
      alpha: 1,
      duration: 400,
      delay: 400,
    });
  }
}
