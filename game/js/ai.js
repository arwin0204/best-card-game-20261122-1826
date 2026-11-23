// The Cinder Warden's brain: a readable opponent you can plan against.
// It telegraphs its mood through its intent line, then plays by a simple
// priority list: finish you off when it can, heal when it is badly hurt,
// guard when it is hurt, otherwise spend its embers on the biggest
// damage it can afford. Nothing here is random — the same hand always
// plays the same way, so the player can learn to read it and counter it.
import { CARDS } from './cards.js';

// The one-line mood shown under the Warden's health bar.
export function wardenIntent(ai, you) {
  const hand = ai.hand.map((id) => CARDS[id]);
  const mana = ai.mana;
  const damageOf = (c) => (c.type === 'attack' ? c.value : 2);
  const lethal = hand
    .filter((c) => c.type === 'attack' || c.type === 'ember')
    .reduce((sum, c) => sum + damageOf(c), 0);
  const affordableDamage = hand
    .filter((c) => c.cost <= mana && (c.type === 'attack' || c.type === 'ember'))
    .reduce((sum, c) => sum + damageOf(c), 0);
  if (affordableDamage >= you.hp + you.block) return 'aims to finish you…';
  if (lethal >= you.hp + you.block) return 'is setting up a killing blow…';
  if (ai.hp <= 8 && hand.some((c) => c.type === 'heal' && c.cost <= mana)) return 'is tending its wounds…';
  if (ai.hp <= 12 && hand.some((c) => c.type === 'guard')) return 'is raising its guard…';
  if (hand.some((c) => c.type === 'attack' && c.cost >= 3 && c.cost <= mana)) return 'is winding up a heavy blow…';
  return 'is weighing its embers…';
}

// Choose the Warden's plays for this turn, in order. The caller plays them
// one at a time so the animation can show each card landing.
export function choosePlays(ai, you) {
  const plays = [];
  let mana = ai.mana;
  const hand = ai.hand.slice();
  const playable = () => hand.map((id, i) => ({ card: CARDS[id], index: i }))
    .filter((e) => e.card.cost <= mana);

  // Take a card out of the working hand. Refuses a card the Warden cannot
  // afford, so a plan never overspends (indices shift after each splice).
  const take = (entry) => {
    if (entry.card.cost > mana) return false;
    const at = hand.indexOf(entry.card.id);
    if (at < 0) return false;
    plays.push(entry.card.id);
    mana -= entry.card.cost;
    hand.splice(at, 1);
    return true;
  };
  const damageOf = (c) => (c.type === 'attack' ? c.value : 2);

  // 1. Lethal: if the damage we can afford ends the player, do exactly that.
  let dmg = playable().filter((e) => e.card.type === 'attack' || e.card.type === 'ember');
  const totalDmg = dmg.reduce((s, e) => s + damageOf(e.card), 0);
  if (totalDmg >= you.hp + you.block && dmg.length > 0) {
    dmg.sort((a, b) => b.card.cost - a.card.cost);
    for (const e of dmg) take(e);
    return plays;
  }

  // 2. Heal only when badly hurt and a Mend is affordable.
  const heal = playable().find((e) => e.card.type === 'heal');
  if (ai.hp <= 8 && heal) take(heal);

  // 3. Guard only when really hurt and no heal was played.
  if (ai.hp <= 12) {
    const guard = playable().filter((e) => e.card.type === 'guard')
      .sort((a, b) => b.card.value - a.card.value)[0];
    if (guard) take(guard);
  }

  // 4. Spend the rest on damage, biggest hit first: a big card beats two small ones.
  const free = playable().filter((e) => e.card.cost === 0);
  for (const e of free) take(e);
  dmg = playable().filter((e) => e.card.type === 'attack' || e.card.type === 'ember')
    .sort((a, b) => b.card.value - a.card.value);
  for (const e of dmg) take(e);

  // 5. A leftover draw card is always worth it.
  const draw = playable().find((e) => e.card.type === 'trick' || e.card.type === 'ember');
  if (draw) take(draw);

  // 6. Spend any mana still left on guard, then on a heal if hurt: an unplayed
  // card is a wasted ember, and the Warden never ends its turn holding mana.
  const guard = playable().filter((e) => e.card.type === 'guard')
    .sort((a, b) => b.card.value - a.card.value)[0];
  if (guard) take(guard);
  if (ai.hp < ai.maxHp) {
    const mend = playable().find((e) => e.card.type === 'heal');
    if (mend) take(mend);
  }

  return plays;
}
