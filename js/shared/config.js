/* ===========================================================
   config.js — the game registry.
   To add a new game: create games/<id>/index.html and add one
   entry here. The hub renders a card for each entry automatically.
   `path` is relative to the repo root (the hub page).
   =========================================================== */

export const PLAYER_NAME = 'Debbie';

export const GAMES = [
  {
    id: 'spelling',
    title: 'Spelling Bee',
    emoji: '🐝',
    blurb: 'Listen and spell the word!',
    path: 'games/spelling/index.html',
    accent: 'blue',
    learning: true,
  },
  {
    id: 'maths',
    title: 'Maths Blaster',
    emoji: '➕',
    blurb: 'Quick sums and times tables!',
    path: 'games/maths/index.html',
    accent: 'pink',
    learning: true,
  },
  {
    id: 'candy',
    title: 'Candy Match',
    emoji: '🍬',
    blurb: 'Swap and match 3 sweets!',
    path: 'games/candy/index.html',
    accent: 'pink',
    learning: false,
  },
  {
    id: 'memory',
    title: 'Memory Pairs',
    emoji: '🧠',
    blurb: 'Find the matching pairs!',
    path: 'games/memory/index.html',
    accent: 'blue',
    learning: false,
  },
  {
    id: 'whack',
    title: 'Whack-a-Mole',
    emoji: '🔨',
    blurb: 'Bop the moles, dodge bombs!',
    path: 'games/whack/index.html',
    accent: 'pink',
    learning: false,
  },
  {
    id: 'simon',
    title: 'Simon Says',
    emoji: '🎵',
    blurb: 'Repeat the colour tune!',
    path: 'games/simon/index.html',
    accent: 'blue',
    learning: false,
  },
  {
    id: 'snake',
    title: 'Snake',
    emoji: '🐍',
    blurb: 'Eat the fruit and grow!',
    path: 'games/snake/index.html',
    accent: 'blue',
    learning: false,
  },
  {
    id: 'stars',
    title: 'Catch the Stars',
    emoji: '⭐',
    blurb: 'Catch stars, dodge bombs!',
    path: 'games/stars/index.html',
    accent: 'pink',
    learning: false,
  },
  {
    id: 'wordmatch',
    title: 'Word Match',
    emoji: '🔤',
    blurb: 'Match the word to the picture!',
    path: 'games/wordmatch/index.html',
    accent: 'blue',
    learning: true,
  },
];
