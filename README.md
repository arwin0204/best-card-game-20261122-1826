# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/arwin0204/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/arwin0204/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Duel is an original turn-based card battler: outlast the Cinder Warden with strikes, guards, mends and ember tricks, spending refillable ember crystals each turn. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 and click **BEGIN THE DUEL**. No build step, no network: `game/` is plain static files.

## How to play

- **Goal:** reduce the Cinder Warden (36 HP) to 0 before your own flame goes out (30 HP).
- **Your turn:** your ember crystals refill (1 on turn 1, +1 each turn, up to 10) and you draw cards. Click a card — or press **1–7** — to play it if you can afford it.
- **Cards:** five kinds, told apart by colour and shape — Attack ▲ red, Guard ▣ blue, Heal ✚ green, Ember ● orange, Trick ◆ purple. Block absorbs damage until your next turn.
- **End turn:** press **Space** or the END TURN button. The Warden telegraphs its mood, then plays its own cards.
- **Win / lose:** the end screen shows your turns, damage dealt and cards played. Press **R** to duel again, **M** to mute.
- **Sound:** all effects are synthesized with WebAudio — no audio files, so the game never fetches anything.

## Layout

- `game/` — the game itself: `index.html`, `style.css`, and `js/` split by job (`rng.js` seeded randomness, `cards.js` catalogue, `deck.js` draw/discard, `ai.js` the Warden's brain, `state.js` rules, `audio.js` synth sfx, `render.js` DOM + animation, `main.js` boot/input).
- `screenshots/` — four real renders of the game: title, mid-game table, victory and defeat.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier builder, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xb74cr38&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
