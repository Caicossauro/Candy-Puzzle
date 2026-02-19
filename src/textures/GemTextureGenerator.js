import { GEM_COLORS, GEM_SIZE, CELL_SIZE } from '../config/constants.js';

const S = GEM_SIZE;
const H = S / 2;
const R = H - 4;

// ── Glow layers para efeito neon ────────────────────────────────
// Simula bloom desenhando multiplas strokes com alpha decrescente
const GLOW_LAYERS = [
  { width: 9, alpha: 0.04 },
  { width: 6, alpha: 0.12 },
  { width: 3, alpha: 0.35 },
  { width: 1.5, alpha: 1.0 },
];

// ── Funcoes de path (sem fill/stroke — apenas definem o caminho) ─

function pathCircle(g, cx, cy, r) {
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.closePath();
}

function pathDiamond(g, cx, cy, r) {
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.lineTo(cx + r, cy);
  g.lineTo(cx, cy + r);
  g.lineTo(cx - r, cy);
  g.closePath();
}

function pathTriangle(g, cx, cy, r) {
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.lineTo(cx + r * 0.9, cy + r * 0.7);
  g.lineTo(cx - r * 0.9, cy + r * 0.7);
  g.closePath();
}

function pathHexagon(g, cx, cy, r) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

function pathStar(g, cx, cy, outerR, innerR) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

// ── Funcao principal de gem neon (path-based shapes) ────────────

function drawNeonGem(g, color, pathFn, ...args) {
  const neon = color.main;

  // Corpo preto com leve tint neon
  pathFn(g, ...args);
  g.fillStyle(0x000000, 0.92);
  g.fillPath();

  pathFn(g, ...args);
  g.fillStyle(neon, 0.07);
  g.fillPath();

  // Camadas de glow (mais larga e transparente -> mais estreita e opaca)
  for (const { width, alpha } of GLOW_LAYERS) {
    pathFn(g, ...args);
    g.lineStyle(width, neon, alpha);
    g.strokePath();
  }

  // Highlight branco (ponto de brilho)
  g.beginPath();
  g.arc(H - 7, H - 8, 2.5, 0, Math.PI * 2);
  g.fillStyle(0xffffff, 0.85);
  g.fillPath();

  // Segundo highlight menor
  g.beginPath();
  g.arc(H + 4, H - 10, 1.2, 0, Math.PI * 2);
  g.fillStyle(0xffffff, 0.5);
  g.fillPath();
}

// ── Quadrado arredondado (usa strokeRoundedRect em camadas) ──────

function drawNeonSquare(g, color) {
  const neon = color.main;
  const sr = R - 2;

  // Corpo preto com tint
  g.fillStyle(0x000000, 0.92);
  g.fillRoundedRect(H - sr, H - sr, sr * 2, sr * 2, 8);
  g.fillStyle(neon, 0.07);
  g.fillRoundedRect(H - sr, H - sr, sr * 2, sr * 2, 8);

  // Camadas de glow para quadrado
  const squareLayers = [
    { extra: 3, width: 9, alpha: 0.04 },
    { extra: 2, width: 6, alpha: 0.12 },
    { extra: 1, width: 3, alpha: 0.35 },
    { extra: 0, width: 1.5, alpha: 1.0 },
  ];

  for (const { extra, width, alpha } of squareLayers) {
    g.lineStyle(width, neon, alpha);
    g.strokeRoundedRect(H - sr - extra, H - sr - extra, (sr + extra) * 2, (sr + extra) * 2, 8 + extra);
  }

  // Highlights
  g.beginPath();
  g.arc(H - 7, H - 8, 2.5, 0, Math.PI * 2);
  g.fillStyle(0xffffff, 0.85);
  g.fillPath();
}

// ── Overlays de gems especiais (neon) ───────────────────────────

function drawStripedOverlay(g, color, horizontal) {
  const neon = color.main;
  g.fillStyle(neon, 0.7);
  if (horizontal) {
    for (let i = -1; i <= 1; i++) {
      g.fillRect(H - R + 4, H + i * 6 - 1, (R - 4) * 2, 2);
    }
  } else {
    for (let i = -1; i <= 1; i++) {
      g.fillRect(H + i * 6 - 1, H - R + 4, 2, (R - 4) * 2);
    }
  }
  // Glow on stripes
  g.fillStyle(0xffffff, 0.3);
  if (horizontal) {
    g.fillRect(H - R + 6, H - 1.5, (R - 6) * 2, 1);
  } else {
    g.fillRect(H - 1.5, H - R + 6, 1, (R - 6) * 2);
  }
}

function drawWrappedOverlay(g, color) {
  const neon = color.main;
  // Outer glow ring
  g.lineStyle(4, neon, 0.2);
  g.strokeCircle(H, H, R - 5);
  // Sharp ring
  g.lineStyle(1.5, neon, 0.9);
  g.strokeCircle(H, H, R - 5);
  // Center dot
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(H, H, 3);
}

// ── Array de drawers por tipo ────────────────────────────────────

const SHAPE_DRAWERS = [
  (g, color) => drawNeonGem(g, color, pathCircle, H, H, R),           // 0: Pink — Circulo
  (g, color) => drawNeonGem(g, color, pathDiamond, H, H, R - 1),      // 1: Green — Losango
  (g, color) => drawNeonSquare(g, color),                              // 2: Blue — Quadrado
  (g, color) => drawNeonGem(g, color, pathTriangle, H, H + 1, R),     // 3: Yellow — Triangulo
  (g, color) => drawNeonGem(g, color, pathHexagon, H, H, R - 1),      // 4: Magenta — Hexagono
  (g, color) => drawNeonGem(g, color, pathStar, H, H, R - 1, R * 0.4),// 5: Orange — Estrela
];

// ── Geracao de texturas ──────────────────────────────────────────

export function generateTextures(scene) {
  GEM_COLORS.forEach((color, i) => {
    const draw = SHAPE_DRAWERS[i] || SHAPE_DRAWERS[0];

    // Normal
    const g = scene.make.graphics({ add: false });
    draw(g, color);
    g.generateTexture(`gem_${i}`, S, S);
    g.destroy();

    // Striped Horizontal
    const sh = scene.make.graphics({ add: false });
    draw(sh, color);
    drawStripedOverlay(sh, color, true);
    sh.generateTexture(`gem_${i}_striped_h`, S, S);
    sh.destroy();

    // Striped Vertical
    const sv = scene.make.graphics({ add: false });
    draw(sv, color);
    drawStripedOverlay(sv, color, false);
    sv.generateTexture(`gem_${i}_striped_v`, S, S);
    sv.destroy();

    // Wrapped
    const w = scene.make.graphics({ add: false });
    draw(w, color);
    drawWrappedOverlay(w, color);
    w.generateTexture(`gem_${i}_wrapped`, S, S);
    w.destroy();
  });

  // Color Bomb — neon multicolorido
  const bomb = scene.make.graphics({ add: false });

  // Corpo preto
  bomb.beginPath();
  bomb.arc(H, H, R, 0, Math.PI * 2);
  bomb.fillStyle(0x000000, 0.9);
  bomb.fillPath();

  // Fatias neon
  const sliceColors = [0xff0066, 0xffee00, 0x00ff88, 0x00aaff, 0xcc00ff, 0xff6600];
  const sliceAngle = (Math.PI * 2) / sliceColors.length;
  sliceColors.forEach((c, i) => {
    bomb.fillStyle(c, 0.8);
    bomb.slice(H, H, R - 2, i * sliceAngle, (i + 1) * sliceAngle, false);
    bomb.fillPath();
  });

  // Anel exterior neon glow
  bomb.lineStyle(6, 0xffffff, 0.08);
  bomb.strokeCircle(H, H, R);
  bomb.lineStyle(2, 0xffffff, 0.5);
  bomb.strokeCircle(H, H, R);

  // Centro brilhante
  bomb.beginPath();
  bomb.arc(H, H, 7, 0, Math.PI * 2);
  bomb.fillStyle(0xffffff, 0.9);
  bomb.fillPath();

  // Estrela de brilho
  bomb.lineStyle(1.5, 0xffffff, 0.7);
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 4) * i;
    const dx = Math.cos(angle) * 11;
    const dy = Math.sin(angle) * 11;
    bomb.beginPath();
    bomb.moveTo(H + dx, H + dy);
    bomb.lineTo(H - dx, H - dy);
    bomb.strokePath();
  }

  bomb.generateTexture('gem_bomb', S, S);
  bomb.destroy();

  // Anel de selecao — neon branco
  const ring = scene.make.graphics({ add: false });
  ring.lineStyle(5, 0xffffff, 0.08);
  ring.strokeCircle(H, H, H - 1);
  ring.lineStyle(2, 0xffffff, 0.7);
  ring.strokeCircle(H, H, H - 2);
  ring.generateTexture('selection_ring', S, S);
  ring.destroy();

  // ── Texturas de obstaculos ──────────────────────────────────────

  const CS = CELL_SIZE;
  const CH = CS / 2;

  // Ice overlay — camada 1 (gelo fino)
  const ice1 = scene.make.graphics({ add: false });
  ice1.fillStyle(0x85c1e9, 0.3);
  ice1.fillRoundedRect(2, 2, CS - 4, CS - 4, 4);
  ice1.lineStyle(1, 0xaed6f1, 0.5);
  ice1.strokeRoundedRect(2, 2, CS - 4, CS - 4, 4);
  ice1.lineStyle(1, 0xd6eaf8, 0.6);
  ice1.beginPath();
  ice1.moveTo(CH - 8, CH - 5);
  ice1.lineTo(CH + 3, CH + 2);
  ice1.lineTo(CH + 10, CH - 3);
  ice1.strokePath();
  ice1.fillStyle(0xffffff, 0.4);
  ice1.fillCircle(CH - 8, CH - 10, 3);
  ice1.fillCircle(CH + 6, CH - 12, 2);
  ice1.generateTexture('ice_1', CS, CS);
  ice1.destroy();

  // Ice overlay — camada 2 (gelo grosso)
  const ice2 = scene.make.graphics({ add: false });
  ice2.fillStyle(0x5dade2, 0.4);
  ice2.fillRoundedRect(1, 1, CS - 2, CS - 2, 5);
  ice2.lineStyle(2, 0x85c1e9, 0.6);
  ice2.strokeRoundedRect(1, 1, CS - 2, CS - 2, 5);
  ice2.lineStyle(1.5, 0xd6eaf8, 0.7);
  ice2.beginPath();
  ice2.moveTo(CH - 12, CH - 8);
  ice2.lineTo(CH - 2, CH);
  ice2.lineTo(CH + 8, CH - 6);
  ice2.strokePath();
  ice2.beginPath();
  ice2.moveTo(CH - 5, CH + 4);
  ice2.lineTo(CH + 6, CH + 10);
  ice2.strokePath();
  ice2.fillStyle(0xffffff, 0.5);
  ice2.fillCircle(CH - 10, CH - 12, 3);
  ice2.fillCircle(CH + 8, CH - 10, 2);
  ice2.fillCircle(CH - 6, CH + 8, 2);
  ice2.lineStyle(1, 0xffffff, 0.4);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    ice2.beginPath();
    ice2.moveTo(CH, CH);
    ice2.lineTo(CH + Math.cos(a) * 8, CH + Math.sin(a) * 8);
    ice2.strokePath();
  }
  ice2.generateTexture('ice_2', CS, CS);
  ice2.destroy();

  // Lock overlay — cadeado
  const lockG = scene.make.graphics({ add: false });
  lockG.fillStyle(0x7f8c8d, 0.8);
  lockG.fillRoundedRect(H - 10, H - 2, 20, 16, 3);
  lockG.lineStyle(3, 0x95a5a6, 0.9);
  lockG.beginPath();
  lockG.arc(H, H - 4, 8, Math.PI, 0, false);
  lockG.strokePath();
  lockG.fillStyle(0x2c3e50, 1);
  lockG.fillCircle(H, H + 4, 3);
  lockG.fillRect(H - 1, H + 5, 2, 5);
  lockG.fillStyle(0xbdc3c7, 0.5);
  lockG.fillCircle(H - 5, H + 1, 2);
  lockG.generateTexture('lock_overlay', S, S);
  lockG.destroy();
}
