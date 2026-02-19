import Phaser from 'phaser';
import { generateTextures } from '../textures/GemTextureGenerator.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    generateTextures(this);
    this.scene.start('MenuScene');
  }
}
