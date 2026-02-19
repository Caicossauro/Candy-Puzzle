import Phaser from 'phaser';
import SoundGenerator from '../audio/SoundGenerator.js';

export default class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, config = {}) {
    super(scene, x, y);

    const {
      width = 220,
      height = 48,
      fontSize = '20px',
      color = 0x00aaff,      // neon accent color (border + text)
      hoverColor = 0x00aaff, // neon fill on hover
      textColor = null,      // null = auto (matches color)
      radius = 12,
      onClick = null,
    } = config;

    this.btnWidth = width;
    this.btnHeight = height;
    this.color = color;
    this.hoverColor = hoverColor;
    this.radius = radius;

    // Background (neon border style)
    this.bg = scene.add.graphics();
    this.drawBg(false);
    this.add(this.bg);

    // Label — color matches neon accent by default
    const labelColor = textColor || ('#' + color.toString(16).padStart(6, '0'));
    this.label = scene.add
      .text(0, 0, text, {
        fontSize,
        fontFamily: 'Arial, sans-serif',
        color: labelColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add(this.label);

    // Interactive zone
    const zone = scene.add
      .zone(0, 0, width, height)
      .setInteractive({ useHandCursor: true });
    this.add(zone);

    zone.on('pointerover', () => this.onHover());
    zone.on('pointerout', () => this.onOut());
    if (onClick) {
      zone.on('pointerup', () => {
        SoundGenerator.click();
        onClick();
      });
    }

    scene.add.existing(this);
  }

  drawBg(hovered) {
    const g = this.bg;
    g.clear();

    const w = this.btnWidth;
    const h = this.btnHeight;
    const r = this.radius;
    const x = -w / 2;
    const y = -h / 2;
    const neon = hovered ? this.hoverColor : this.color;

    // Dark body
    g.fillStyle(0x000000, 0.75);
    g.fillRoundedRect(x, y, w, h, r);

    // Neon fill on hover
    if (hovered) {
      g.fillStyle(neon, 0.18);
      g.fillRoundedRect(x, y, w, h, r);
    }

    // Outer glow
    g.lineStyle(hovered ? 6 : 4, neon, hovered ? 0.22 : 0.15);
    g.strokeRoundedRect(x, y, w, h, r);

    // Sharp neon edge
    g.lineStyle(1.5, neon, 1.0);
    g.strokeRoundedRect(x, y, w, h, r);
  }

  onHover() {
    this.drawBg(true);
    this.setScale(1.05);
  }

  onOut() {
    this.drawBg(false);
    this.setScale(1);
  }
}
