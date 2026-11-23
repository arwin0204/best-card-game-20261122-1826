// The game state and its rules: turns, embers, block, win and loss.
// Pure logic — no DOM here. The DOM lives in render.js, the pacing in main.js.
// Every rule a player needs is in this one file.
import { CARDS } from './cards.js';
import { makeDeck, drawFrom, discardCard, discardHand } from './deck.js';
import { makeRng } from './rng.js';

export const MAX_HP = 30;
export const WARDEN_HP = 36; // the Warden is tougher: a straight damage race favours whoever moves first
export const MAX_MANA = 10;
export const HAND_LIMIT = 7;

export function newFighter(name) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    block: 0,
    mana: 0,
    maxMana: 0,
    hand: [],
    deck: null,
    drawCards(n) { return 0; },
  };
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    turn: 1,
    phase: 'title', // title | player | ai | won | lost
    you: newFighter('Ember Knight'),
    foe: newFighter('Cinder Warden'),
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, turns: 0 },
    over: false,
  };
  game.you.deck = makeDeck(rng);
  game.foe.deck = makeDeck(rng);
  game.foe.maxHp = WARDEN_HP;
  game.foe.hp = WARDEN_HP;
  // Each fighter's drawCards closes over its own deck and the shared rng.
  game.you.drawCards = (n) => drawFrom(game.you.deck, game.you.hand, n, rng);
  game.foe.drawCards = (n) => drawFrom(game.foe.deck, game.foe.hand, n, rng);
  return game;
}

// The log keeps only the last three lines, so the arena never overflows.
export function logLine(game, html) {
  game.log.push(html);
  if (game.log.length > 3) game.log.shift();
}

export function beginDuel(game) {
  game.phase = 'player';
  game.you.drawCards(4);
  game.foe.drawCards(4);
  logLine(game, 'The duel begins. <b>Your move</b> — play a card, then end your turn.');
  startPlayerTurn(game, true);
}

// Your turn starts: block fades, embers refill to the turn number
// (1 on turn 1, up to 10), and you draw 3 — except on the opening turn,
// where the opening 4 cards are already in hand.
export function startPlayerTurn(game, first = false) {
  const you = game.you;
  you.block = 0;
  you.maxMana = Math.min(MAX_MANA, game.turn);
  you.mana = you.maxMana;
  const drawn = you.drawCards(first ? 0 : 3);
  while (you.hand.length > HAND_LIMIT) {
    const burned = you.hand.pop();
    game.you.deck.discardPile.push(burned);
  }
  game.phase = 'player';
  game.stats.turns = game.turn;
  logLine(game, `Turn ${game.turn}: your embers refill to <b>${you.mana}</b>${drawn ? `, you draw <b>${drawn}</b>.` : '.'}`);
}

// The Warden's turn starts the same way, but it draws four cards a turn —
// its hand runs deeper than yours, which is part of the challenge.
export function startFoeTurn(game) {
  const foe = game.foe;
  foe.block = 0;
  foe.maxMana = Math.min(MAX_MANA, game.turn);
  foe.mana = foe.maxMana;
  foe.drawCards(4);
  while (foe.hand.length > HAND_LIMIT) {
    const burned = foe.hand.pop();
    game.foe.deck.discardPile.push(burned);
  }
  game.phase = 'ai';
  logLine(game, `The Cinder Warden stirs — <b>${foe.mana} embers</b> at its command.`);
}

// Play one of your cards by hand index. Returns {ok, reason, result}.
export function playCard(game, index) {
  if (game.phase !== 'player' || game.over) return { ok: false, reason: 'not your turn' };
  const you = game.you;
  const id = you.hand[index];
  if (!id) return { ok: false, reason: 'no such card' };
  const card = CARDS[id];
  if (card.cost > you.mana) return { ok: false, reason: 'not enough embers' };
  you.mana -= card.cost;
  discardCard(you.deck, you.hand, index);
  const result = card.apply(you, game.foe);
  game.stats.cardsPlayed++;
  game.stats.damageDealt += result.damage;
  logLine(game, describePlay('You', card, result, game.foe));
  checkEnd(game);
  return { ok: true, result, card };
}

// The Warden plays one card from its hand by id.
export function foePlayCard(game, id) {
  const foe = game.foe;
  const index = foe.hand.indexOf(id);
  if (index < 0) return { ok: false, reason: 'card not in hand' };
  const card = CARDS[id];
  if (card.cost > foe.mana) return { ok: false, reason: 'not enough embers' };
  foe.mana -= card.cost;
  discardCard(foe.deck, foe.hand, index);
  const result = card.apply(foe, game.you);
  game.stats.damageTaken += result.damage;
  logLine(game, describePlay('The Warden', card, result, game.you));
  checkEnd(game);
  return { ok: true, result, card };
}

// One sentence for the arena log describing what a played card did.
export function describePlay(who, card, result, target) {
  const bits = [];
  if (result.damage > 0) bits.push(`<b>${result.damage} damage</b>`);
  if (result.blocked > 0) bits.push(`${result.blocked} blocked`);
  if (result.healed > 0) bits.push(`restores <b>${result.healed} HP</b>`);
  if (result.drawn > 0) bits.push(`draws ${result.drawn}`);
  if (result.mana > 0) bits.push(`gains ${result.mana} ember`);
  if (card.type === 'guard') bits.push(`gains <b>${card.value} block</b>`);
  const tail = bits.length ? bits.join(', ') : 'nothing happens';
  return `${who} play${who === 'You' ? '' : 's'} <b>${card.name}</b> — ${tail}.`;
}

export function endPlayerTurn(game) {
  if (game.phase !== 'player' || game.over) return;
  discardHand(game.you.deck, game.you.hand);
  startFoeTurn(game);
}

export function endFoeTurn(game) {
  if (game.phase !== 'ai' || game.over) return;
  discardHand(game.foe.deck, game.foe.hand);
  game.turn++;
  startPlayerTurn(game);
}

// The duel ends the moment either fighter's HP hits zero.
export function checkEnd(game) {
  if (game.over) return;
  if (game.foe.hp <= 0) {
    game.over = true;
    game.phase = 'won';
    logLine(game, '<b>The Cinder Warden falls!</b> Your flame burns brightest.');
  } else if (game.you.hp <= 0) {
    game.over = true;
    game.phase = 'lost';
    logLine(game, '<b>Your flame gutters out…</b> The Warden stands over the embers.');
  }
}

export function canAfford(game, index) {
  const id = game.you.hand[index];
  return id ? CARDS[id].cost <= game.you.mana : false;
}
