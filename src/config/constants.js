export const NUM_ROWS = 8;
export const NUM_COLS = 8;
export const NUM_TYPES = 6;
export const GEM_SIZE = 48;
export const CELL_SIZE = 54;
export const BOARD_OFFSET_X = (480 - NUM_COLS * CELL_SIZE) / 2 + CELL_SIZE / 2;
export const BOARD_OFFSET_Y = 170;
export const SWAP_DURATION = 150;
export const FALL_DURATION_PER_CELL = 80;
export const DESTROY_DURATION = 200;
export const SWIPE_THRESHOLD = 15;

// Fase 2 — Core systems
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

// Fase 3 — Special gems
export const SPECIAL_NONE = 'none';
export const SPECIAL_STRIPED_H = 'striped_h';
export const SPECIAL_STRIPED_V = 'striped_v';
export const SPECIAL_WRAPPED = 'wrapped';
export const SPECIAL_BOMB = 'bomb';
export const TYPE_BOMB = -1;
export const DEFAULT_MAX_MOVES = 20;
export const DEFAULT_TARGET_SCORE = 5000;
export const HINT_IDLE_TIME = 4000;
export const HINT_PULSE_DURATION = 600;
export const SHUFFLE_DURATION = 400;

// Paleta neon — cores vibrantes sobre fundo preto
export const GEM_COLORS = [
  { main: 0xff0066, light: 0xff66aa }, // neon pink (circulo)
  { main: 0x00ff88, light: 0x66ffbb }, // neon green (losango)
  { main: 0x00aaff, light: 0x55ccff }, // electric blue (quadrado)
  { main: 0xffee00, light: 0xffee88 }, // neon yellow (triangulo)
  { main: 0xcc00ff, light: 0xee66ff }, // neon magenta (hexagono)
  { main: 0xff6600, light: 0xff9944 }, // neon orange (estrela)
];
