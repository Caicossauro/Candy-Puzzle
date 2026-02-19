import LEVELS from '../data/levels.js';

export default class LevelManager {
  /**
   * Retorna os dados de um nivel pelo numero (1-based).
   * Retorna null se o nivel nao existir.
   */
  static getLevel(levelNumber) {
    return LEVELS.find((l) => l.level === levelNumber) || null;
  }

  /**
   * Retorna o total de niveis disponiveis.
   */
  static getTotalLevels() {
    return LEVELS.length;
  }

  /**
   * Retorna todos os niveis.
   */
  static getAllLevels() {
    return LEVELS;
  }

  /**
   * Retorna os dados do proximo nivel, ou null se nao existir.
   */
  static getNextLevel(currentLevel) {
    return LevelManager.getLevel(currentLevel + 1);
  }

  /**
   * Calcula quantas estrelas o jogador ganhou baseado no score.
   * Usa starThresholds do nivel: [1 estrela, 2 estrelas, 3 estrelas]
   */
  static calculateStars(levelNumber, score) {
    const level = LevelManager.getLevel(levelNumber);
    if (!level) return 0;

    const thresholds = level.starThresholds;
    if (score >= thresholds[2]) return 3;
    if (score >= thresholds[1]) return 2;
    if (score >= thresholds[0]) return 1;
    return 0;
  }
}
