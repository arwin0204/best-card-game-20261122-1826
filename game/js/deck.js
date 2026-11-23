// Deck building, shuffling, drawing and discarding for Ember Duel.
import { shuffle } from './rng.js';

// The starting deck: 24 cards, a mix that rewards both attack and defence.
// Both fighters start from this same list; the seeded shuffle deals them
// different hands, so no two duels open the same way.
export const STARTER_DECK = [
  'spark', 'spark', 'spark', 'spark', 'spark',
  'flameLash', 'flameLash', 'flameLash',
  'inferno',
  'doubleStrike', 'doubleStrike',
  'guard', 'guard', 'guard', 'guard',
  'stonewall', 'stonewall',
  'mend', 'mend',
  'emberDraw', 'emberDraw', 'emberDraw',
  'cinderTrick', 'cinderTrick',
  'rally',
];

export function makeDeck(rng) {
  return {
    drawPile: shuffle(STARTER_DECK, rng),
    discardPile: [],
  };
}

// Draw n cards from the deck into the hand. When the draw pile runs out,
// the discard pile is shuffled back in; when both are empty, drawing stops.
// Returns how many cards were actually drawn. The rng is threaded through
// so reshuffles stay deterministic for a seeded game.
export function drawFrom(deck, hand, n, rng) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (deck.drawPile.length === 0) {
      if (deck.discardPile.length === 0) break;
      deck.drawPile = shuffle(deck.discardPile, rng);
      deck.discardPile = [];
    }
    hand.push(deck.drawPile.pop());
    drawn++;
  }
  return drawn;
}

// Play a card out of the hand and into the discard pile.
export function discardCard(deck, hand, index) {
  const [id] = hand.splice(index, 1);
  if (id) deck.discardPile.push(id);
  return id;
}

// Throw the whole hand away at end of turn, in hand order, so the
// reshuffle stays fair and deterministic for a seeded game.
export function discardHand(deck, hand) {
  while (hand.length > 0) deck.discardPile.push(hand.pop());
}
