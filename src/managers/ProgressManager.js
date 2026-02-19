const STORAGE_KEY = 'candy_puzzle_progress';

const DEFAULT_PROGRESS = {
  completed: [],  // indices de niveis completados (0-based)
  stars: {},      // { [levelNumber]: bestStars }
  highScores: {}, // { [levelNumber]: bestScore }
};

export default class ProgressManager {
  /**
   * Carrega o progresso salvo do localStorage.
   */
  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return { ...DEFAULT_PROGRESS, ...data };
      }
    } catch (e) {
      // localStorage indisponivel ou corrompido
    }
    return { ...DEFAULT_PROGRESS };
  }

  /**
   * Salva o progresso no localStorage.
   */
  static save(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      // localStorage indisponivel
    }
  }

  /**
   * Verifica se um nivel esta desbloqueado.
   * Nivel 1 sempre desbloqueado. Demais exigem o anterior completado.
   */
  static isLevelUnlocked(levelNumber, progress) {
    if (levelNumber <= 1) return true;
    return progress.completed.includes(levelNumber - 2);
  }

  /**
   * Retorna as estrelas conquistadas em um nivel.
   */
  static getStars(levelNumber, progress) {
    return progress.stars[levelNumber] || 0;
  }

  /**
   * Retorna o melhor score em um nivel.
   */
  static getHighScore(levelNumber, progress) {
    return progress.highScores[levelNumber] || 0;
  }

  /**
   * Registra a conclusao de um nivel.
   * Atualiza completed, stars e highScore mantendo os melhores valores.
   */
  static completeLevel(levelNumber, score, stars) {
    const progress = ProgressManager.load();

    const levelIndex = levelNumber - 1;
    if (!progress.completed.includes(levelIndex)) {
      progress.completed.push(levelIndex);
    }

    // Salvar melhor estrela
    const prevStars = progress.stars[levelNumber] || 0;
    progress.stars[levelNumber] = Math.max(prevStars, stars);

    // Salvar melhor score
    const prevScore = progress.highScores[levelNumber] || 0;
    progress.highScores[levelNumber] = Math.max(prevScore, score);

    ProgressManager.save(progress);
    return progress;
  }

  /**
   * Retorna o total de estrelas acumuladas.
   */
  static getTotalStars(progress) {
    return Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
  }

  /**
   * Limpa todo o progresso (para debug/reset).
   */
  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}
