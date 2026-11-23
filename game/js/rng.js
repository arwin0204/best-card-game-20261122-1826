// Seeded randomness (mulberry32) so a screenshot seed replays the same game.
// The same seed always deals the same hands, which is what makes
// ?seed=7 screenshots reproducible run after run. The generator keeps its
// state in a closure, so two games with different seeds never interfere.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by the rng handed in — never Math.random,
// so a seeded game shuffles the same way every time.
export function shuffle(array, rng) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pick one entry by weight, using the same seeded rng.
export function pickWeighted(entries, rng) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
