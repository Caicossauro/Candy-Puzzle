/**
 * Gerador de sons sintetizados via Web Audio API.
 * Zero arquivos externos — tudo gerado proceduralmente.
 */

let ctx = null;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function ensureResumed() {
  const c = getContext();
  if (c.state === 'suspended') {
    c.resume();
  }
  return c;
}

// ── Utilitarios de sintese ──────────────────────────────────────

function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
  const c = ensureResumed();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.05);
}

function playNoise(duration, volume = 0.08, delay = 0) {
  const c = ensureResumed();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  source.connect(gain);
  gain.connect(c.destination);
  source.start(c.currentTime + delay);
}

// ── Sons do jogo ────────────────────────────────────────────────

const SoundGenerator = {
  /** Som de swap entre gems */
  swap() {
    playTone(400, 0.08, 'sine', 0.1);
    playTone(500, 0.08, 'sine', 0.1, 0.04);
  },

  /** Som de match — tom sobe com o combo count */
  match(comboCount = 1) {
    const baseFreq = 440 + (comboCount - 1) * 80;
    playTone(baseFreq, 0.12, 'sine', 0.12);
    playTone(baseFreq * 1.25, 0.1, 'sine', 0.08, 0.06);
    playTone(baseFreq * 1.5, 0.08, 'sine', 0.06, 0.12);
  },

  /** Som de destruir gems */
  destroy() {
    playNoise(0.08, 0.06);
    playTone(300, 0.06, 'square', 0.04);
  },

  /** Som de gem especial sendo criada */
  specialSpawn() {
    playTone(600, 0.15, 'sine', 0.12);
    playTone(800, 0.12, 'sine', 0.10, 0.08);
    playTone(1000, 0.10, 'triangle', 0.08, 0.14);
  },

  /** Ativacao de striped gem */
  stripedActivation() {
    playTone(500, 0.2, 'sawtooth', 0.08);
    playTone(700, 0.15, 'sawtooth', 0.06, 0.05);
    playNoise(0.12, 0.05, 0.02);
  },

  /** Ativacao de wrapped gem */
  wrappedActivation() {
    playTone(300, 0.25, 'square', 0.08);
    playTone(200, 0.2, 'square', 0.06, 0.05);
    playNoise(0.15, 0.07, 0.03);
  },

  /** Ativacao de color bomb */
  bombActivation() {
    playTone(200, 0.3, 'sawtooth', 0.10);
    playTone(150, 0.25, 'square', 0.08, 0.05);
    playTone(100, 0.3, 'sawtooth', 0.06, 0.1);
    playNoise(0.2, 0.08, 0.05);
  },

  /** Arpejo ascendente de vitoria */
  victory() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      playTone(freq, 0.3, 'sine', 0.12, i * 0.12);
      playTone(freq * 1.005, 0.3, 'sine', 0.06, i * 0.12); // chorus
    });
    // Acorde final
    playTone(523, 0.6, 'triangle', 0.06, 0.55);
    playTone(659, 0.6, 'triangle', 0.05, 0.55);
    playTone(784, 0.6, 'triangle', 0.05, 0.55);
  },

  /** Tons descendentes de derrota */
  defeat() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      playTone(freq, 0.25, 'sine', 0.10, i * 0.15);
    });
  },

  /** Click de botao */
  click() {
    playTone(800, 0.04, 'sine', 0.08);
  },

  /** Estrela conquistada */
  star(index = 0) {
    const freq = 800 + index * 200;
    playTone(freq, 0.2, 'sine', 0.10, index * 0.25);
    playTone(freq * 1.5, 0.15, 'triangle', 0.06, index * 0.25 + 0.05);
  },

  /** Som de gems caindo */
  drop() {
    playTone(250, 0.06, 'sine', 0.04);
  },

  /** Som de shuffle */
  shuffle() {
    for (let i = 0; i < 4; i++) {
      playTone(300 + i * 50, 0.06, 'sine', 0.04, i * 0.06);
    }
  },

  /** Som de swap invalido */
  invalid() {
    playTone(200, 0.1, 'square', 0.06);
    playTone(180, 0.1, 'square', 0.06, 0.08);
  },
};

export default SoundGenerator;
