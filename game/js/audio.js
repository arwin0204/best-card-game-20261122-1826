// Tiny synthesized sound effects: WebAudio oscillators, no audio files.
// Everything is generated at run time, so the game loads nothing over
// the network. Volumes stay low (at most 0.14) so the effects garnish
// the game instead of shouting over it.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One short note: a frequency, a delay, a length, a wave shape, a volume.
// Each effect is one or two notes; win and lose are little four-note runs.
function tone(freq, at, dur, type = 'sine', vol = 0.12) {
  if (muted) return;
  try {
    const ac = audioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + dur + 0.02);
  } catch (e) { /* audio is a garnish: it must never break the game */ }
}

export const sfx = {
  click() { tone(660, 0, 0.06, 'triangle', 0.06); },
  draw() { tone(520, 0, 0.07, 'sine', 0.07); tone(780, 0.06, 0.08, 'sine', 0.06); },
  play() { tone(440, 0, 0.08, 'triangle', 0.1); tone(660, 0.07, 0.1, 'triangle', 0.09); },
  hit() { tone(160, 0, 0.16, 'sawtooth', 0.14); tone(90, 0.05, 0.2, 'square', 0.1); },
  guard() { tone(330, 0, 0.12, 'sine', 0.1); tone(495, 0.08, 0.14, 'sine', 0.08); },
  heal() { tone(523, 0, 0.12, 'sine', 0.09); tone(659, 0.09, 0.12, 'sine', 0.09); tone(784, 0.18, 0.2, 'sine', 0.08); },
  turn() { tone(392, 0, 0.1, 'triangle', 0.08); tone(523, 0.09, 0.12, 'triangle', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.28, 'triangle', 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sine', 0.1)); },
};

// Pick the right sound for a card by its kind.
export function playForCard(card) {
  if (card.type === 'attack' || card.type === 'ember') sfx.hit();
  else if (card.type === 'guard') sfx.guard();
  else if (card.type === 'heal') sfx.heal();
  else sfx.play();
}
