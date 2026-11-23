// The card catalogue: every card in Ember Duel, with its cost, type and effect.
// Five kinds, told apart by colour AND shape: attack ▲ red, guard ▣ blue,
// heal ✚ green, ember ● orange, trick ◆ purple — never by text alone.
// A card's `value` is its headline number: damage for attack and ember,
// block for guard, HP restored for heal, cards drawn for trick.
export const CARD_TYPES = {
  attack: { label: 'ATTACK', glyph: '▲', css: 'card-attack' },
  guard: { label: 'GUARD', glyph: '▣', css: 'card-guard' },
  heal: { label: 'HEAL', glyph: '✚', css: 'card-heal' },
  ember: { label: 'EMBER', glyph: '●', css: 'card-ember' },
  trick: { label: 'TRICK', glyph: '◆', css: 'card-trick' },
};

// Every card's effect lives here as an `apply` function. It takes the player
// who played it (self) and their opponent (foe) and returns a small report
// of what happened, so the log and the floating numbers can describe it.
// Block is the only defence: it soaks damage first and fades at the start
// of its owner's next turn (see state.js).
export const CARDS = {
  spark: {
    id: 'spark', name: 'Spark', type: 'attack', cost: 1, value: 3,
    text: 'Deal 3 damage.',
    apply(self, foe) { return dealDamage(foe, self, 3); },
  },
  flameLash: {
    id: 'flameLash', name: 'Flame Lash', type: 'attack', cost: 2, value: 5,
    text: 'Deal 5 damage.',
    apply(self, foe) { return dealDamage(foe, self, 5); },
  },
  inferno: {
    id: 'inferno', name: 'Inferno', type: 'attack', cost: 4, value: 9,
    text: 'Deal 9 damage.',
    apply(self, foe) { return dealDamage(foe, self, 9); },
  },
  doubleStrike: {
    id: 'doubleStrike', name: 'Double Strike', type: 'attack', cost: 3, value: 8,
    text: 'Deal 4 damage, twice.',
    apply(self, foe) {
      const first = dealDamage(foe, self, 4);
      const second = dealDamage(foe, self, 4);
      return { damage: first.damage + second.damage, blocked: first.blocked + second.blocked, healed: 0, drawn: 0, mana: 0 };
    },
  },
  guard: {
    id: 'guard', name: 'Guard', type: 'guard', cost: 1, value: 6,
    text: 'Gain 6 block.',
    apply(self) { self.block += 6; return { damage: 0, blocked: 0, healed: 0, drawn: 0, mana: 0 }; },
  },
  stonewall: {
    id: 'stonewall', name: 'Stonewall', type: 'guard', cost: 2, value: 11,
    text: 'Gain 11 block.',
    apply(self) { self.block += 11; return { damage: 0, blocked: 0, healed: 0, drawn: 0, mana: 0 }; },
  },
  mend: {
    id: 'mend', name: 'Mend', type: 'heal', cost: 2, value: 6,
    text: 'Restore 6 HP.',
    apply(self) {
      const healed = Math.min(6, self.maxHp - self.hp);
      self.hp += healed;
      return { damage: 0, blocked: 0, healed, drawn: 0, mana: 0 };
    },
  },
  emberDraw: {
    id: 'emberDraw', name: 'Ember Draw', type: 'ember', cost: 1, value: 2,
    text: 'Deal 2 damage. Draw a card.',
    apply(self, foe) {
      const r = dealDamage(foe, self, 2);
      r.drawn = self.drawCards ? self.drawCards(1) : 0;
      return r;
    },
  },
  cinderTrick: {
    id: 'cinderTrick', name: 'Cinder Trick', type: 'trick', cost: 0, value: 1,
    text: 'Deal 1 damage. Gain 1 ember.',
    apply(self, foe) {
      const r = dealDamage(foe, self, 1);
      self.mana = Math.min(self.maxMana, self.mana + 1);
      r.mana = 1;
      return r;
    },
  },
  rally: {
    id: 'rally', name: 'Rally', type: 'trick', cost: 2, value: 2,
    text: 'Draw 2 cards.',
    apply(self) {
      const drawn = self.drawCards ? self.drawCards(2) : 0;
      return { damage: 0, blocked: 0, healed: 0, drawn, mana: 0 };
    },
  },
};

// Damage first eats block, then HP. Returns what actually happened, so the
// caller can tell the player how much was blocked and how much went through.
export function dealDamage(target, attacker, amount) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const through = amount - blocked;
  target.hp = Math.max(0, target.hp - through);
  return { damage: through, blocked, healed: 0, drawn: 0, mana: 0 };
}

export function cardById(id) {
  return CARDS[id];
}
