// Ember Duel — hand-in program for the make.fun "Make the best card game" bounty.
// The game itself is plain static files under game/, with screenshots/ beside it.
// This program copies both folders into the output directory and writes
// dossier.json with the vendored make.fun dossier builder (vendor/makefun-game.ts).
// Node 22, standard library only. It runs twice and must produce identical
// bytes on both runs, so there are no timestamps or random choices here:
// plain copies plus one deterministic dossier build.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps mirror the gate in the kit's RULES.txt: at most 4 screenshots of
// 256 KiB each, game/ within 993 files and 48 MiB, dossier text at 160 KiB.
// The builder reads the copied folders, never this repository directly,
// so the dossier always matches exactly what the grader will see.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
