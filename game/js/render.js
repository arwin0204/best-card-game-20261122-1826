// Rendering: turns the game state into DOM. Cards slide, flip and snap
// into place; damage numbers float up from the fighter who took the hit.
// render() redraws everything from scratch each time, so the DOM can never
// drift out of sync with the state.
import { CARDS, CARD_TYPES } from './cards.js';
import { wardenIntent } from './ai.js';

const $ = (id) => document.getElementById(id);

// Build one face-up card element. `opts.key` is the keyboard hint (1–7),
// `opts.unplayable` dims a card the player cannot afford right now.
export function cardElement(id, opts = {}) {
  const card = CARDS[id];
  const type = CARD_TYPES[card.type];
  const el = document.createElement('div');
  el.className = `card ${type.css}`;
  el.dataset.cardId = id;
  el.setAttribute('aria-label', `${card.name}, costs ${card.cost} embers: ${card.text}`);
  // The big number is the card's headline value: damage, block or healing.
  // Tricks show their cost instead, since drawing cards has no single number.
  const num = card.type === 'trick' ? card.cost : card.value;
  el.innerHTML =
    `<div class="card-head"><span class="card-cost${card.cost === 0 ? ' free' : ''}">${card.cost}</span>` +
    `<span class="card-name">${card.name}</span></div>` +
    `<div class="card-glyph">${type.glyph}</div>` +
    `<div class="card-type">${type.label}</div>` +
    `<div class="card-text">${card.text}</div>` +
    `<div class="card-num">${num}</div>`;
  if (opts.key) {
    const k = document.createElement('span');
    k.className = 'card-key';
    k.textContent = opts.key;
    el.appendChild(k);
  }
  if (opts.unplayable) el.classList.add('unplayable');
  return el;
}

// The Warden's hand is always face-down: one patterned back per card.
export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.innerHTML = '<span class="back-mark">●</span>';
  return el;
}

function setHp(fillEl, textEl, fighter) {
  const pct = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  fillEl.style.width = `${pct}%`;
  textEl.textContent = `${fighter.hp} / ${fighter.maxHp} HP`;
}

function setBlock(el, fighter) {
  el.textContent = fighter.block > 0 ? `▣ ${fighter.block} block` : '';
  el.classList.toggle('on', fighter.block > 0);
}

// Redraw the whole table from the current game state.
export function render(game, handlers) {
  const { you, foe } = game;

  setHp($('foe-hp-fill'), $('foe-hp-text'), foe);
  setHp($('you-hp-fill'), $('you-hp-text'), you);
  setBlock($('foe-block'), foe);
  setBlock($('you-block'), you);

  $('mana-text').textContent = `● ${you.mana} / ${you.maxMana} embers`;
  $('turn-label').textContent = `TURN ${game.turn}`;
  $('phase-label').textContent =
    game.phase === 'player' ? 'Your move — play a card'
    : game.phase === 'ai' ? 'The Warden is thinking…'
    : game.phase === 'won' ? 'Victory is yours'
    : game.phase === 'lost' ? 'The duel is lost'
    : 'Ember Duel';
  $('foe-intent').textContent = game.phase === 'ai' || game.phase === 'player'
    ? wardenIntent(foe, you) : '';

  // Opponent hand: face-down card backs, one per card.
  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  foe.hand.forEach(() => foeHand.appendChild(cardBackElement()));

  // Your hand, with keyboard hints and affordability dimming.
  const youHand = $('you-hand');
  youHand.innerHTML = '';
  you.hand.forEach((id, i) => {
    const affordable = CARDS[id].cost <= you.mana && game.phase === 'player';
    const el = cardElement(id, { key: String(i + 1), unplayable: !affordable });
    el.addEventListener('click', () => handlers.onPlayCard(i, el));
    youHand.appendChild(el);
  });

  $('draw-count').textContent = you.deck.drawPile.length;
  $('discard-count').textContent = you.deck.discardPile.length;
  $('end-turn').disabled = game.phase !== 'player';
  $('log').innerHTML = game.log.map((l) => `<div>${l}</div>`).join('');
  $('score-line').textContent =
    `Damage dealt ${game.stats.damageDealt} · Cards played ${game.stats.cardsPlayed} · Turn ${game.turn}`;
}

// A floating number over one fighter: -5 damage, +6 healing, +11 block.
export function floatNumber(target, text, kind) {
  const layer = $('float-layer');
  const anchor = target === 'foe' ? $('foe-box') : $('you-box');
  const stage = $('stage').getBoundingClientRect();
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float-num ${kind}`;
  el.textContent = text;
  el.style.left = `${r.left - stage.left + r.width / 2 - 20}px`;
  el.style.top = `${r.top - stage.top + 10}px`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// A quick jolt of the table when a heavy hit lands.
export function shakeTable() {
  const table = $('table');
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}

export function showEndScreen(game) {
  const won = game.phase === 'won';
  const title = $('end-title');
  title.textContent = won ? 'VICTORY' : 'DEFEAT';
  title.className = won ? 'win' : 'lose';
  $('end-sub').textContent = won
    ? 'The Cinder Warden falls. Your flame burns brightest.'
    : 'Your flame gutters out. The Warden stands over the embers.';
  $('end-stats').innerHTML =
    `Turns fought: <b>${game.stats.turns}</b><br>` +
    `Damage dealt: <b>${game.stats.damageDealt}</b> · Damage taken: <b>${game.stats.damageTaken}</b><br>` +
    `Cards played: <b>${game.stats.cardsPlayed}</b> · HP left: <b>${game.you.hp} / ${game.you.maxHp}</b>`;
  $('end-screen').classList.remove('hidden');
}

export function hideEndScreen() {
  $('end-screen').classList.add('hidden');
}

export function showTitleScreen() {
  $('title-screen').classList.remove('hidden');
}

export function hideTitleScreen() {
  $('title-screen').classList.add('hidden');
}
