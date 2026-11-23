// Boot, input and pacing for Ember Duel.
// Query params: ?shot=title|table|win|loss&seed=N renders a fixed scene
// for the entry's screenshots — real renders of this same code, driven
// by the seeded rng so the same seed always shows the same scene.
// Keys: 1–7 play a card, Space ends the turn, M mutes, R restarts.
import {
  createGame, beginDuel, playCard, foePlayCard, endPlayerTurn, endFoeTurn, checkEnd,
} from './state.js';
import { choosePlays } from './ai.js';
import { CARDS } from './cards.js';
import {
  render, floatNumber, shakeTable, showEndScreen, hideEndScreen,
  showTitleScreen, hideTitleScreen,
} from './render.js';
import { sfx, playForCard, toggleMute, isMuted } from './audio.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || 7);

let game = createGame(SEED);
let aiTimer = null;

function refresh() {
  render(game, { onPlayCard });
  if (game.over) {
    showEndScreen(game);
    if (game.phase === 'won') sfx.win(); else sfx.lose();
  }
}

// A card was clicked (or a number key was pressed). Play it, animate the
// result, then redraw — twice, so the played card's flight is visible
// before the hand settles.
function onPlayCard(index, el) {
  if (game.phase !== 'player' || game.over) return;
  const res = playCard(game, index);
  if (!res.ok) { sfx.click(); return; }
  if (el) el.classList.add('played');
  playForCard(res.card);
  if (res.result.damage > 0) {
    floatNumber('foe', `-${res.result.damage}`, 'dmg');
    if (res.result.damage >= 5) shakeTable();
  }
  if (res.result.healed > 0) floatNumber('you', `+${res.result.healed}`, 'heal');
  if (res.card.type === 'guard') floatNumber('you', `+${res.card.value} ▣`, 'block');
  setTimeout(refresh, 120);
  if (!game.over) setTimeout(refresh, 350);
}

function endTurn() {
  if (game.phase !== 'player' || game.over) return;
  sfx.turn();
  endPlayerTurn(game);
  refresh();
  runFoeTurn();
}

// The Warden plays its chosen cards one at a time, 750 ms apart, so the
// player can follow each one — then hands the turn back.
function runFoeTurn() {
  const plays = choosePlays(game.foe, game.you);
  let step = 0;
  const stepFn = () => {
    if (game.over) { refresh(); return; }
    if (step >= plays.length) {
      setTimeout(() => {
        if (game.over) { refresh(); return; }
        endFoeTurn(game);
        sfx.turn();
        refresh();
      }, 500);
      return;
    }
    const id = plays[step++];
    const res = foePlayCard(game, id);
    if (res.ok) {
      playForCard(res.card);
      if (res.result.damage > 0) {
        floatNumber('you', `-${res.result.damage}`, 'dmg');
        if (res.result.damage >= 5) shakeTable();
      }
      if (res.result.healed > 0) floatNumber('foe', `+${res.result.healed}`, 'heal');
      if (res.card.type === 'guard') floatNumber('foe', `+${res.card.value} ▣`, 'block');
    }
    refresh();
    aiTimer = setTimeout(stepFn, 750);
  };
  aiTimer = setTimeout(stepFn, 650);
}

function startDuel() {
  clearTimeout(aiTimer);
  game = createGame(SEED);
  hideEndScreen();
  hideTitleScreen();
  beginDuel(game);
  sfx.draw();
  refresh();
}

function restart() {
  startDuel();
}

// ---- screenshot scenes: deterministic, driven by the seeded rng ----
// moves: card names to play in order, while it is still the player's turn.
function playScripted(moves) {
  for (const name of moves) {
    const idx = game.you.hand.findIndex((id) => CARDS[id].name === name);
    if (idx >= 0 && game.phase === 'player') {
      const res = playCard(game, idx);
      if (res.ok && res.result.damage > 0) floatNumber('foe', `-${res.result.damage}`, 'dmg');
    }
  }
}

function applyShot() {
  if (SHOT === 'title') {
    showTitleScreen();
    render(game, { onPlayCard });
    return;
  }
  hideTitleScreen();
  if (SHOT === 'table') game.turn = 4; // mid-game: 4 embers a turn
  beginDuel(game);
  if (SHOT === 'table') {
    // A lively mid-game: turn 4, a full hand, both fighters bloodied.
    game.foe.hp = 21; game.you.hp = 24;
    game.you.block = 6;
    game.you.drawCards(3);
    playScripted(['Spark', 'Stonewall', 'Ember Draw']);
    render(game, { onPlayCard });
    return;
  }
  if (SHOT === 'win') {
    game.foe.hp = 0;
    game.stats.damageDealt = 36;
    game.stats.cardsPlayed = 9;
    game.stats.turns = 5;
    game.turn = 5;
    checkEnd(game);
    render(game, { onPlayCard });
    showEndScreen(game);
    return;
  }
  if (SHOT === 'loss') {
    game.you.hp = 0;
    game.stats.damageDealt = 18;
    game.stats.damageTaken = 30;
    game.stats.cardsPlayed = 7;
    game.stats.turns = 6;
    game.turn = 6;
    checkEnd(game);
    render(game, { onPlayCard });
    showEndScreen(game);
    return;
  }
  // No shot: the normal title screen.
  showTitleScreen();
  render(game, { onPlayCard });
}

// ---- wiring: buttons and keys ----
document.getElementById('start-btn').addEventListener('click', () => { sfx.click(); startDuel(); });
document.getElementById('again-btn').addEventListener('click', () => { sfx.click(); restart(); });
document.getElementById('end-turn').addEventListener('click', endTurn);

document.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }
  if (e.key === 'r' || e.key === 'R') {
    if (game.phase !== 'title') { sfx.click(); restart(); }
    return;
  }
  if (game.phase === 'title' && (e.key === 'Enter' || e.key === ' ')) { startDuel(); return; }
  if (game.over && e.key === 'Enter') { restart(); return; }
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endTurn(); return; }
  const n = Number(e.key);
  if (n >= 1 && n <= 7) {
    const el = document.querySelectorAll('#you-hand .card')[n - 1];
    if (el) onPlayCard(n - 1, el);
  }
});

applyShot();
