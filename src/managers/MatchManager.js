import { NUM_ROWS, NUM_COLS } from '../config/constants.js';

export default class MatchManager {
  constructor(boardManager) {
    this.board = boardManager;
  }

  /**
   * Retorna matches classificados.
   * Cada grupo: { cells: [{row,col}], shape, direction, type, length }
   * shape: 'line3' | 'line4' | 'line5' | 'L' | 'T'
   */
  findClassifiedMatches() {
    const grid = this.board.grid;
    const hRuns = []; // { cells, type, direction: 'h' }
    const vRuns = []; // { cells, type, direction: 'v' }

    // Encontrar todas as runs horizontais >= 3
    for (let row = 0; row < NUM_ROWS; row++) {
      let col = 0;
      while (col < NUM_COLS) {
        const gem = grid[row][col];
        if (!gem) { col++; continue; }
        const type = gem.getData('type');
        let end = col + 1;
        while (end < NUM_COLS && grid[row][end] && grid[row][end].getData('type') === type) {
          end++;
        }
        if (end - col >= 3) {
          const cells = [];
          for (let c = col; c < end; c++) cells.push({ row, col: c });
          hRuns.push({ cells, type, direction: 'h' });
        }
        col = end;
      }
    }

    // Encontrar todas as runs verticais >= 3
    for (let col = 0; col < NUM_COLS; col++) {
      let row = 0;
      while (row < NUM_ROWS) {
        const gem = grid[row][col];
        if (!gem) { row++; continue; }
        const type = gem.getData('type');
        let end = row + 1;
        while (end < NUM_ROWS && grid[end][col] && grid[end][col].getData('type') === type) {
          end++;
        }
        if (end - row >= 3) {
          const cells = [];
          for (let r = row; r < end; r++) cells.push({ row: r, col });
          vRuns.push({ cells, type, direction: 'v' });
        }
        row = end;
      }
    }

    // Agrupar runs que se intersectam (mesmo tipo) em match groups
    const groups = [];
    const usedH = new Set();
    const usedV = new Set();

    for (let hi = 0; hi < hRuns.length; hi++) {
      for (let vi = 0; vi < vRuns.length; vi++) {
        if (hRuns[hi].type !== vRuns[vi].type) continue;

        // Verificar interseccao
        const intersection = hRuns[hi].cells.find((hc) =>
          vRuns[vi].cells.some((vc) => vc.row === hc.row && vc.col === hc.col)
        );

        if (intersection) {
          // Merge: L ou T shape
          const cellSet = new Set();
          hRuns[hi].cells.forEach((c) => cellSet.add(`${c.row},${c.col}`));
          vRuns[vi].cells.forEach((c) => cellSet.add(`${c.row},${c.col}`));

          const mergedCells = Array.from(cellSet).map((k) => {
            const [r, c] = k.split(',').map(Number);
            return { row: r, col: c };
          });

          const hLen = hRuns[hi].cells.length;
          const vLen = vRuns[vi].cells.length;
          // T: interseccao no meio de uma run; L: interseccao nas pontas
          const shape = (hLen > 3 || vLen > 3) ? 'T' : 'L';

          groups.push({
            cells: mergedCells,
            shape,
            direction: null,
            type: hRuns[hi].type,
            length: mergedCells.length,
          });

          usedH.add(hi);
          usedV.add(vi);
        }
      }
    }

    // Runs horizontais nao usadas em interseccoes
    hRuns.forEach((run, i) => {
      if (usedH.has(i)) return;
      const len = run.cells.length;
      let shape = 'line3';
      if (len === 4) shape = 'line4';
      else if (len >= 5) shape = 'line5';

      groups.push({
        cells: run.cells,
        shape,
        direction: 'h',
        type: run.type,
        length: len,
      });
    });

    // Runs verticais nao usadas em interseccoes
    vRuns.forEach((run, i) => {
      if (usedV.has(i)) return;
      const len = run.cells.length;
      let shape = 'line3';
      if (len === 4) shape = 'line4';
      else if (len >= 5) shape = 'line5';

      groups.push({
        cells: run.cells,
        shape,
        direction: 'v',
        type: run.type,
        length: len,
      });
    });

    return groups;
  }

  /**
   * findAllMatches retorna a lista flat de {row, col} para compatibilidade.
   * Usado por hasValidMoves/findHintMove (que so precisam saber se ha match ou nao).
   */
  findAllMatches() {
    const groups = this.findClassifiedMatches();
    const cellSet = new Set();
    groups.forEach((g) => {
      g.cells.forEach((c) => cellSet.add(`${c.row},${c.col}`));
    });
    return Array.from(cellSet).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c };
    });
  }
}
