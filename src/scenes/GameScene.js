import Phaser from 'phaser';
import {
  DEFAULT_MAX_MOVES,
  DEFAULT_TARGET_SCORE,
  HINT_IDLE_TIME,
  SPECIAL_NONE,
  SPECIAL_STRIPED_H,
  SPECIAL_STRIPED_V,
  SPECIAL_WRAPPED,
} from '../config/constants.js';
import BoardManager from '../managers/BoardManager.js';
import MatchManager from '../managers/MatchManager.js';
import AnimationManager from '../managers/AnimationManager.js';
import InputManager from '../managers/InputManager.js';
import UIManager from '../managers/UIManager.js';
import SpecialGemManager from '../managers/SpecialGemManager.js';
import ObstacleManager from '../managers/ObstacleManager.js';
import SoundGenerator from '../audio/SoundGenerator.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelData = data || {};
  }

  create() {
    this.score = 0;
    this.comboCount = 0;
    this.isProcessing = false;
    this.gameOver = false;
    this.movesRemaining = this.levelData.maxMoves || DEFAULT_MAX_MOVES;
    this.targetScore = this.levelData.targetScore || DEFAULT_TARGET_SCORE;
    this.lastSwapRow = -1;
    this.lastSwapCol = -1;
    this.elapsedSeconds = 0;

    // Managers
    const numTypes = this.levelData.numTypes || 6;
    this.boardMgr = new BoardManager(this, numTypes);
    this.matchMgr = new MatchManager(this.boardMgr);
    this.boardMgr.setMatchManager(this.matchMgr);
    this.obstacleMgr = new ObstacleManager(this, this.boardMgr);
    this.boardMgr.setObstacleManager(this.obstacleMgr);
    this.animMgr = new AnimationManager(this, this.boardMgr);
    this.specialMgr = new SpecialGemManager(this, this.boardMgr, this.animMgr);
    this.uiMgr = new UIManager(this, this.boardMgr);
    this.inputMgr = new InputManager(this, this.boardMgr, {
      onSwap: (gem1, gem2) => this.trySwap(gem1, gem2),
      onSelect: (gem) => this.uiMgr.setSelectionPosition(gem.x, gem.y),
      onDeselect: () => this.uiMgr.hideSelection(),
    });

    // Load obstacles from level data
    if (this.levelData.ice || this.levelData.locks || this.levelData.layout) {
      this.obstacleMgr.loadFromLevel(this.levelData);
    }

    // Montar o jogo
    this.uiMgr.drawBoard();
    this.obstacleMgr.drawBlockedCells();
    this.uiMgr.createHUD(this.movesRemaining, this.targetScore);
    this.boardMgr.fillInitialBoard();
    this.obstacleMgr.renderIce();
    this.obstacleMgr.renderLocks();
    this.animMgr.animateBoardEntry(this.boardMgr.grid);
    this.inputMgr.setup();

    // Pause button — neon
    const pauseBtn = this.add
      .text(455, 18, '| |', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#334466',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerover', () => pauseBtn.setColor('#00aaff'));
    pauseBtn.on('pointerout', () => pauseBtn.setColor('#334466'));
    pauseBtn.on('pointerup', () => {
      if (!this.isProcessing && !this.gameOver) {
        this.scene.pause();
        this.scene.launch('PauseScene', { levelData: this.levelData });
      }
    });

    // Resume from pause
    this.events.on('resume', () => {
      this.resetHintTimer();
    });

    // Timer de jogo (contador de tempo)
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.gameOver) {
          this.elapsedSeconds++;
          this.uiMgr.updateTimer(this.elapsedSeconds);
        }
      },
    });

    // Hint timer
    this.hintTimer = null;
    this.resetHintTimer();
  }

  // ── Hint system ─────────────────────────────────────────────
  resetHintTimer() {
    if (this.hintTimer) {
      this.hintTimer.remove(false);
      this.hintTimer = null;
    }
    this.animMgr.stopHint();

    if (!this.gameOver && !this.isProcessing) {
      this.hintTimer = this.time.delayedCall(HINT_IDLE_TIME, () => {
        this.showHint();
      });
    }
  }

  showHint() {
    if (this.isProcessing || this.gameOver) return;
    const hint = this.boardMgr.findHintMove();
    if (hint) {
      this.animMgr.animateHint(hint.gem1, hint.gem2);
    }
  }

  // ── Swap ────────────────────────────────────────────────────
  trySwap(gem1, gem2) {
    if (this.gameOver) return;

    this.isProcessing = true;
    this.inputMgr.disable();
    this.animMgr.stopHint();
    this.comboCount = 0;

    // Guardar posicao do swap para spawn de gems especiais
    this.lastSwapRow = gem2.getData('row');
    this.lastSwapCol = gem2.getData('col');

    // Verificar combo de dois especiais antes do swap
    const s1 = gem1.getData('special');
    const s2 = gem2.getData('special');

    this.boardMgr.swapData(gem1, gem2);
    this.animMgr.animateSwap(gem1, gem2, () => {
      // Verificar se e um swap de dois especiais (combo)
      const comboCells = this.specialMgr.getCombinationCells(gem1, gem2);
      if (comboCells && comboCells.length > 0) {
        this.movesRemaining--;
        this.uiMgr.updateMoves(this.movesRemaining);
        this.processSpecialCombo(comboCells, gem1, gem2);
        return;
      }

      // Verificar se um bomb esta sendo swapado com gem normal
      if (s1 === 'bomb' || s2 === 'bomb') {
        const bombGem = s1 === 'bomb' ? gem1 : gem2;
        const otherGem = s1 === 'bomb' ? gem2 : gem1;
        const targetType = otherGem.getData('type');

        if (otherGem.getData('special') === SPECIAL_NONE && targetType >= 0) {
          this.movesRemaining--;
          this.uiMgr.updateMoves(this.movesRemaining);
          const bombCells = this.specialMgr.getBombActivationCells(targetType);
          bombCells.push({ row: bombGem.getData('row'), col: bombGem.getData('col') });
          this.animMgr.animateBombActivation(bombGem.getData('row'), bombGem.getData('col'));
          this.animMgr.screenShake(5, 150);
          this.processDestroyAndFill(bombCells);
          return;
        }
      }

      const matches = this.matchMgr.findAllMatches();

      if (matches.length > 0) {
        this.movesRemaining--;
        this.uiMgr.updateMoves(this.movesRemaining);
        this.processMatches();
      } else {
        // Sem match → desfazer
        this.boardMgr.swapData(gem1, gem2);
        this.animMgr.animateSwap(gem1, gem2, () => {
          SoundGenerator.invalid();
          this.animMgr.shakeGem(gem1);
          this.animMgr.shakeGem(gem2);
          this.isProcessing = false;
          this.inputMgr.enable();
          this.resetHintTimer();
        });
      }
    });
  }

  // ── Combo de dois especiais ─────────────────────────────────
  processSpecialCombo(comboCells, gem1, gem2) {
    this.comboCount++;
    const points = comboCells.length * 15 * this.comboCount;
    this.score += points;
    this.uiMgr.updateScore(this.score);
    this.uiMgr.updateProgressBar(this.score);

    // Animacoes de ativacao
    const s1 = gem1.getData('special');
    const s2 = gem2.getData('special');
    const isStriped = (s) => s === SPECIAL_STRIPED_H || s === SPECIAL_STRIPED_V;

    if (isStriped(s1) || isStriped(s2)) {
      this.animMgr.animateStripedLine(gem1.getData('row'), gem1.getData('col'), true);
      this.animMgr.animateStripedLine(gem1.getData('row'), gem1.getData('col'), false);
    }
    if (s1 === SPECIAL_WRAPPED || s2 === SPECIAL_WRAPPED) {
      this.animMgr.animateWrappedExplosion(gem1.getData('row'), gem1.getData('col'));
    }
    if (s1 === 'bomb' || s2 === 'bomb') {
      this.animMgr.animateBombActivation(gem1.getData('row'), gem1.getData('col'));
    }
    this.animMgr.screenShake(6, 200);

    this.processDestroyAndFill(comboCells);
  }

  // ── Match processing com gems especiais ─────────────────────
  processMatches() {
    this.comboCount++;
    SoundGenerator.match(this.comboCount);
    const matchGroups = this.matchMgr.findClassifiedMatches();
    if (matchGroups.length === 0) {
      this.onChainEnd();
      return;
    }

    // Flat list de todas as celulas matched
    const allMatchCells = [];
    const cellSet = new Set();
    matchGroups.forEach((g) => {
      g.cells.forEach((c) => {
        const key = `${c.row},${c.col}`;
        if (!cellSet.has(key)) {
          cellSet.add(key);
          allMatchCells.push(c);
        }
      });
    });

    // Processar gems especiais: quais extras destruir, quais spawnar
    const { extraCells, spawns } = this.specialMgr.processSpecials(
      matchGroups, allMatchCells, this.lastSwapRow, this.lastSwapCol
    );

    // Animacoes de ativacao de especiais existentes
    for (const cell of allMatchCells) {
      const gem = this.boardMgr.getGemAt(cell.row, cell.col);
      if (!gem) continue;
      const special = gem.getData('special');
      if (special === SPECIAL_STRIPED_H) {
        this.animMgr.animateStripedLine(cell.row, cell.col, true);
      } else if (special === SPECIAL_STRIPED_V) {
        this.animMgr.animateStripedLine(cell.row, cell.col, false);
      } else if (special === SPECIAL_WRAPPED) {
        this.animMgr.animateWrappedExplosion(cell.row, cell.col);
      } else if (special === 'bomb') {
        this.animMgr.animateBombActivation(cell.row, cell.col);
      }
    }

    // Merge todas as celulas a destruir (sem duplicatas)
    const destroySet = new Set();
    allMatchCells.forEach((c) => destroySet.add(`${c.row},${c.col}`));
    extraCells.forEach((c) => destroySet.add(`${c.row},${c.col}`));

    // Excluir celulas de spawn da destruicao
    for (const spawn of spawns) {
      destroySet.delete(`${spawn.spawnRow},${spawn.spawnCol}`);
    }

    const allDestroyCells = Array.from(destroySet).map((k) => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });

    if (extraCells.length > 0) {
      this.animMgr.screenShake();
    }

    // Pontuacao
    const points = allDestroyCells.length * 10 * this.comboCount;
    this.score += points;
    this.uiMgr.updateScore(this.score);
    this.uiMgr.updateProgressBar(this.score);

    if (this.comboCount > 1) {
      this.uiMgr.showCombo(this.comboCount);
    }
    this.animMgr.showFloatingPoints(allMatchCells, points);

    // Destruir, spawnar especiais, drop & fill
    this.animMgr.destroyMatches(allDestroyCells, () => {
      // Process obstacle breaks
      this.obstacleMgr.processIceBreak(allDestroyCells);
      this.obstacleMgr.processLockBreak(allDestroyCells);

      // Spawnar gems especiais nas posicoes designadas
      for (const spawn of spawns) {
        const existingGem = this.boardMgr.getGemAt(spawn.spawnRow, spawn.spawnCol);
        if (existingGem) {
          if (spawn.special === 'bomb') {
            this.boardMgr.makeBomb(existingGem);
          } else {
            this.boardMgr.upgradeGemSpecial(existingGem, spawn.special);
          }
          this.animMgr.animateSpecialSpawn(existingGem);
        } else {
          const newGem = this.boardMgr.createGem(
            spawn.spawnRow, spawn.spawnCol, spawn.type, spawn.special
          );
          this.boardMgr.grid[spawn.spawnRow][spawn.spawnCol] = newGem;
          this.animMgr.animateSpecialSpawn(newGem);
        }
      }

      this.animMgr.dropAndFill(() => {
        const newMatches = this.matchMgr.findAllMatches();
        if (newMatches.length > 0) {
          this.time.delayedCall(150, () => {
            this.processMatches();
          });
        } else {
          this.onChainEnd();
        }
      });
    });
  }

  // ── Destruir celulas e preencher (para combos especiais) ────
  processDestroyAndFill(cells) {
    this.comboCount++;
    const points = cells.length * 15 * this.comboCount;
    this.score += points;
    this.uiMgr.updateScore(this.score);
    this.uiMgr.updateProgressBar(this.score);
    this.animMgr.showFloatingPoints(cells, points);

    this.animMgr.destroyMatches(cells, () => {
      this.obstacleMgr.processIceBreak(cells);
      this.obstacleMgr.processLockBreak(cells);

      this.animMgr.dropAndFill(() => {
        const newMatches = this.matchMgr.findAllMatches();
        if (newMatches.length > 0) {
          this.time.delayedCall(150, () => {
            this.processMatches();
          });
        } else {
          this.onChainEnd();
        }
      });
    });
  }

  // ── Fim de uma cadeia de matches ────────────────────────────
  onChainEnd() {
    if (this.score >= this.targetScore) {
      this.handleWin();
      return;
    }
    if (this.movesRemaining <= 0) {
      this.handleLose();
      return;
    }
    if (!this.boardMgr.hasValidMoves()) {
      this.handleDeadlock();
      return;
    }
    this.isProcessing = false;
    this.inputMgr.enable();
    this.resetHintTimer();
  }

  // ── Win / Lose / Deadlock ───────────────────────────────────
  handleWin() {
    this.gameOver = true;
    this.isProcessing = false;
    if (this.hintTimer) this.hintTimer.remove(false);
    if (this.timerEvent) this.timerEvent.remove(false);
    SoundGenerator.victory();
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', {
        won: true,
        score: this.score,
        level: this.levelData.level || 1,
        targetScore: this.targetScore,
        levelData: this.levelData,
        elapsedTime: this.elapsedSeconds,
      });
    });
  }

  handleLose() {
    this.gameOver = true;
    this.isProcessing = false;
    if (this.hintTimer) this.hintTimer.remove(false);
    if (this.timerEvent) this.timerEvent.remove(false);
    SoundGenerator.defeat();
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', {
        won: false,
        score: this.score,
        level: this.levelData.level || 1,
        targetScore: this.targetScore,
        levelData: this.levelData,
        elapsedTime: this.elapsedSeconds,
      });
    });
  }

  handleDeadlock() {
    SoundGenerator.shuffle();
    this.uiMgr.showShuffleText();
    let attempts = 0;
    do {
      this.boardMgr.shuffleBoard();
      attempts++;
    } while (
      (this.matchMgr.findAllMatches().length > 0 || !this.boardMgr.hasValidMoves()) &&
      attempts < 100
    );

    this.animMgr.animateShuffle(this.boardMgr.grid, () => {
      const postMatches = this.matchMgr.findAllMatches();
      if (postMatches.length > 0) {
        this.processMatches();
      } else {
        this.isProcessing = false;
        this.inputMgr.enable();
        this.resetHintTimer();
      }
    });
  }
}
