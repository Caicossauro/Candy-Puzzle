import {
  NUM_ROWS,
  NUM_COLS,
  SPECIAL_NONE,
  SPECIAL_STRIPED_H,
  SPECIAL_STRIPED_V,
  SPECIAL_WRAPPED,
  TYPE_BOMB,
} from '../config/constants.js';

export default class SpecialGemManager {
  constructor(scene, boardManager, animationManager) {
    this.scene = scene;
    this.board = boardManager;
    this.anim = animationManager;
  }

  /**
   * Determina qual gem especial criar a partir de um match group classificado.
   * Retorna { special, spawnRow, spawnCol } ou null se for match normal (line3).
   */
  getSpecialFromMatch(group, swapGemRow, swapGemCol) {
    // Posicao de spawn: onde o jogador fez o swap (se estiver no match), senao centro do match
    let spawnRow = swapGemRow;
    let spawnCol = swapGemCol;
    const inMatch = group.cells.some((c) => c.row === swapGemRow && c.col === swapGemCol);
    if (!inMatch) {
      const mid = Math.floor(group.cells.length / 2);
      spawnRow = group.cells[mid].row;
      spawnCol = group.cells[mid].col;
    }

    switch (group.shape) {
      case 'line4':
        // Striped: direcao oposta ao match
        return {
          special: group.direction === 'h' ? SPECIAL_STRIPED_V : SPECIAL_STRIPED_H,
          spawnRow,
          spawnCol,
          type: group.type,
        };
      case 'line5':
        // Color bomb
        return {
          special: 'bomb',
          spawnRow,
          spawnCol,
          type: TYPE_BOMB,
        };
      case 'L':
      case 'T':
        // Wrapped
        return {
          special: SPECIAL_WRAPPED,
          spawnRow,
          spawnCol,
          type: group.type,
        };
      default:
        return null;
    }
  }

  /**
   * Coleta celulas extras a destruir quando uma gem especial e ativada.
   * Retorna array de {row, col}.
   */
  getActivationCells(gem) {
    const special = gem.getData('special');
    const row = gem.getData('row');
    const col = gem.getData('col');
    const cells = [];

    if (special === SPECIAL_STRIPED_H) {
      for (let c = 0; c < NUM_COLS; c++) {
        cells.push({ row, col: c });
      }
    } else if (special === SPECIAL_STRIPED_V) {
      for (let r = 0; r < NUM_ROWS; r++) {
        cells.push({ row: r, col });
      }
    } else if (special === SPECIAL_WRAPPED) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < NUM_ROWS && nc >= 0 && nc < NUM_COLS) {
            cells.push({ row: nr, col: nc });
          }
        }
      }
    } else if (special === 'bomb') {
      // Bomb precisa de um tipo alvo - tratado separadamente em activateBomb
    }

    return cells;
  }

  /**
   * Ativa um color bomb com um tipo alvo.
   * Remove todas as gems daquele tipo.
   */
  getBombActivationCells(targetType) {
    const cells = [];
    const grid = this.board.grid;
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        const gem = grid[r][c];
        if (gem && gem.getData('type') === targetType) {
          cells.push({ row: r, col: c });
        }
      }
    }
    return cells;
  }

  /**
   * Verifica se dois gems especiais estao sendo swapados juntos.
   * Retorna array de celulas extras a destruir, ou null se nao e combo especial.
   */
  getCombinationCells(gem1, gem2) {
    const s1 = gem1.getData('special');
    const s2 = gem2.getData('special');

    if (s1 === SPECIAL_NONE && s2 === SPECIAL_NONE) return null;

    const isStriped = (s) => s === SPECIAL_STRIPED_H || s === SPECIAL_STRIPED_V;
    const isWrapped = (s) => s === SPECIAL_WRAPPED;
    const isBomb = (s) => s === 'bomb';

    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');

    const cells = [];
    const addCell = (r, c) => {
      if (r >= 0 && r < NUM_ROWS && c >= 0 && c < NUM_COLS) {
        cells.push({ row: r, col: c });
      }
    };

    // Bomb + Bomb -> limpa tudo
    if (isBomb(s1) && isBomb(s2)) {
      for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
          cells.push({ row: r, col: c });
        }
      }
      return cells;
    }

    // Bomb + qualquer -> remove todas da cor do outro gem
    if (isBomb(s1) || isBomb(s2)) {
      const otherGem = isBomb(s1) ? gem2 : gem1;
      const targetType = otherGem.getData('type');
      const bombGem = isBomb(s1) ? gem1 : gem2;

      // Se o outro tambem e especial (striped/wrapped + bomb)
      if (isStriped(otherGem.getData('special'))) {
        // Transforma todas da cor em striped e ativa -> na pratica limpa muito
        // Simplificacao: limpar todas da cor + linhas/colunas dessas posicoes
        const colorCells = this.getBombActivationCells(targetType);
        colorCells.forEach((cc) => {
          addCell(cc.row, cc.col);
          // Adiciona linha ou coluna de cada uma
          if (otherGem.getData('special') === SPECIAL_STRIPED_H) {
            for (let c = 0; c < NUM_COLS; c++) addCell(cc.row, c);
          } else {
            for (let r = 0; r < NUM_ROWS; r++) addCell(r, cc.col);
          }
        });
      } else if (isWrapped(otherGem.getData('special'))) {
        // Limpa todas da cor + 3x3 em torno de cada
        const colorCells = this.getBombActivationCells(targetType);
        colorCells.forEach((cc) => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              addCell(cc.row + dr, cc.col + dc);
            }
          }
        });
      } else {
        // Bomb + gem normal: limpa todas da cor
        cells.push(...this.getBombActivationCells(targetType));
      }
      // Incluir a posicao do bomb
      addCell(bombGem.getData('row'), bombGem.getData('col'));
      return cells;
    }

    // Striped + Striped -> cruz (linha + coluna)
    if (isStriped(s1) && isStriped(s2)) {
      const row = r1;
      const col = c1;
      for (let c = 0; c < NUM_COLS; c++) addCell(row, c);
      for (let r = 0; r < NUM_ROWS; r++) addCell(r, col);
      // Tambem a posicao do outro
      for (let c = 0; c < NUM_COLS; c++) addCell(r2, c);
      for (let r = 0; r < NUM_ROWS; r++) addCell(r, c2);
      return cells;
    }

    // Wrapped + Wrapped -> explosao 5x5
    if (isWrapped(s1) && isWrapped(s2)) {
      const centerR = r1;
      const centerC = c1;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          addCell(centerR + dr, centerC + dc);
        }
      }
      return cells;
    }

    // Striped + Wrapped -> 3 linhas + 3 colunas (cruz gorda)
    if ((isStriped(s1) && isWrapped(s2)) || (isWrapped(s1) && isStriped(s2))) {
      const centerR = r1;
      const centerC = c1;
      for (let dr = -1; dr <= 1; dr++) {
        for (let c = 0; c < NUM_COLS; c++) addCell(centerR + dr, c);
      }
      for (let dc = -1; dc <= 1; dc++) {
        for (let r = 0; r < NUM_ROWS; r++) addCell(r, centerC + dc);
      }
      return cells;
    }

    // Um deles e especial, o outro nao — ativacao simples
    return null;
  }

  /**
   * Coleta todas as celulas extras a destruir dado os match groups e gems especiais no match.
   * Tambem retorna as info de spawn de novas gems especiais.
   */
  processSpecials(matchGroups, allMatchCells, swapGemRow, swapGemCol) {
    const extraCells = new Set();
    const spawns = [];
    const grid = this.board.grid;

    // 1. Determinar spawns de novas gems especiais a partir dos match groups
    for (const group of matchGroups) {
      const spawnInfo = this.getSpecialFromMatch(group, swapGemRow, swapGemCol);
      if (spawnInfo) {
        spawns.push(spawnInfo);
      }
    }

    // 2. Verificar gems especiais que estao sendo destruidas nos matches
    for (const cell of allMatchCells) {
      const gem = grid[cell.row][cell.col];
      if (!gem) continue;
      const special = gem.getData('special');
      if (special !== SPECIAL_NONE) {
        // Celula de spawn nao e ativada (sera preservada)
        const isSpawnCell = spawns.some((s) => s.spawnRow === cell.row && s.spawnCol === cell.col);
        if (!isSpawnCell) {
          const activationCells = this.getActivationCells(gem);
          activationCells.forEach((c) => extraCells.add(`${c.row},${c.col}`));
        }
      }
    }

    // 3. Verificar se gems especiais nas celulas extras tambem precisam ser ativadas (cadeia)
    // Limitado a 1 nivel de profundidade para evitar loops infinitos
    const extraArray = Array.from(extraCells);
    for (const key of extraArray) {
      const [r, c] = key.split(',').map(Number);
      const gem = grid[r][c];
      if (!gem) continue;
      const special = gem.getData('special');
      if (special !== SPECIAL_NONE && special !== 'bomb') {
        const chain = this.getActivationCells(gem);
        chain.forEach((cc) => extraCells.add(`${cc.row},${cc.col}`));
      }
    }

    // Converter set para array
    const extraCellsArray = Array.from(extraCells).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    });

    return { extraCells: extraCellsArray, spawns };
  }
}
