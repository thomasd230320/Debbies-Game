/* ===========================================================
   progress-catalog.js — data for the play-incentive systems:
   levels/titles, achievements, stickers, daily challenges, spin.
   Pure data + small pure check() functions (no DOM, no storage).
   =========================================================== */

/* ---- Levels & titles ---- */
// XP needed to REACH a level: xpForLevel(L) = 25 * L * (L-1)
// L1=0, L2=50, L3=150, L4=300, L5=500, L6=750, L7=1050, L8=1400, L9=1800, L10=2250
export const TITLES = [
  'Rookie',       // L1
  'Rookie',       // L2
  'Star Pupil',   // L3
  'Bright Spark', // L4
  'Quick Thinker',// L5
  'Whiz',         // L6
  'Brainbox',     // L7
  'Superstar',    // L8
  'Champion',     // L9
  'Legend',       // L10+
];

/* ---- Achievements ----
   Each: { id, name, emoji, desc, reward, check(s) }
   `s` is a flat snapshot built in store.js:
   { level, xp, totalStars, gamesPlayed, playStreak, bestStreak, learnStreak,
     pets, items, themes, stickers, stickersTotal, best:{gameId:highScore}, flags:{} } */
export const ACHIEVEMENTS = [
  { id: 'first-game', name: 'First Go!', emoji: '🎮', desc: 'Play your first game', reward: 5,
    check: s => s.gamesPlayed >= 1 },
  { id: 'word-wizard', name: 'Word Wizard', emoji: '🐝', desc: 'Earn 20+ in Spelling Bee', reward: 15,
    check: s => (s.best.spelling || 0) >= 20 },
  { id: 'maths-machine', name: 'Maths Machine', emoji: '➗', desc: 'Score 25+ in Maths Blaster', reward: 15,
    check: s => (s.best.maths || 0) >= 25 },
  { id: 'picture-perfect', name: 'Picture Perfect', emoji: '🔤', desc: 'Match all 10 in Word Match', reward: 20,
    check: s => !!s.flags.wordmatchAllTen },
  { id: 'memory-master', name: 'Memory Master', emoji: '🧠', desc: 'Win a game of Memory Pairs', reward: 10,
    check: s => !!s.flags.memoryWin },
  { id: 'snake-charmer', name: 'Snake Charmer', emoji: '🐍', desc: 'Eat 12+ fruit in Snake', reward: 15,
    check: s => (s.best.snake || 0) >= 12 },
  { id: 'sharp-eyes', name: 'Sharp Eyes', emoji: '⭐', desc: 'Catch 18+ in Catch the Stars', reward: 15,
    check: s => (s.best.stars || 0) >= 18 },
  { id: 'streak-star', name: 'Streak Star', emoji: '🔥', desc: 'Play 7 days in a row', reward: 30,
    check: s => s.bestStreak >= 7 },
  { id: 'high-flyer', name: 'High Flyer', emoji: '🚀', desc: 'Reach Level 5', reward: 25,
    check: s => s.level >= 5 },
  { id: 'pet-parent', name: 'Pet Parent', emoji: '🐾', desc: 'Own 3 pets', reward: 15,
    check: s => s.pets >= 3 },
  { id: 'fashionista', name: 'Fashionista', emoji: '👗', desc: 'Own 10 accessories', reward: 15,
    check: s => s.items >= 10 },
  { id: 'busy-bee', name: 'Busy Bee', emoji: '🏅', desc: 'Play 50 games', reward: 25,
    check: s => s.gamesPlayed >= 50 },
];

/* ---- Stickers (collectible, drop while playing + from spins) ---- */
export const STICKERS = [
  { id: 'st-cat', emoji: '🐱' }, { id: 'st-dog', emoji: '🐶' }, { id: 'st-fox', emoji: '🦊' },
  { id: 'st-uni', emoji: '🦄' }, { id: 'st-pand', emoji: '🐼' }, { id: 'st-bee', emoji: '🐝' },
  { id: 'st-frog', emoji: '🐸' }, { id: 'st-png', emoji: '🐧' }, { id: 'st-owl', emoji: '🦉' },
  { id: 'st-cake', emoji: '🎂' }, { id: 'st-ice', emoji: '🍦' }, { id: 'st-donut', emoji: '🍩' },
  { id: 'st-candy', emoji: '🍬' }, { id: 'st-straw', emoji: '🍓' }, { id: 'st-cherry', emoji: '🍒' },
  { id: 'st-star', emoji: '🌟' }, { id: 'st-rain', emoji: '🌈' }, { id: 'st-moon', emoji: '🌙' },
  { id: 'st-sun', emoji: '☀️' }, { id: 'st-flow', emoji: '🌸' }, { id: 'st-heart', emoji: '💖' },
  { id: 'st-rock', emoji: '🚀' }, { id: 'st-crown', emoji: '👑' }, { id: 'st-gift', emoji: '🎁' },
];
export const STICKER_BY_ID = Object.fromEntries(STICKERS.map(s => [s.id, s]));

/* ---- Daily challenges (one picked per day, seeded by date) ----
   metric: result.score >= target, OR won:true requires result.won */
export const CHALLENGE_POOL = [
  { gameId: 'wordmatch', target: 8, desc: 'Match 8+ words in Word Match' },
  { gameId: 'maths', target: 20, desc: 'Score 20+ in Maths Blaster' },
  { gameId: 'spelling', target: 16, desc: 'Earn 16+ in Spelling Bee' },
  { gameId: 'snake', target: 10, desc: 'Eat 10+ fruit in Snake' },
  { gameId: 'whack', target: 15, desc: 'Bop 15+ moles in Whack-a-Mole' },
  { gameId: 'stars', target: 16, desc: 'Catch 16+ in Catch the Stars' },
  { gameId: 'simon', target: 5, desc: 'Reach round 5 in Simon Says' },
  { gameId: 'memory', won: true, target: 1, desc: 'Win a game of Memory Pairs' },
];

/* ---- Lucky spin wheel: 8 equal segments ---- */
export const SPIN_WHEEL = [
  { type: 'stars', amount: 5, label: '5 ⭐' },
  { type: 'stars', amount: 10, label: '10 ⭐' },
  { type: 'sticker', label: 'Sticker 🌟' },
  { type: 'stars', amount: 5, label: '5 ⭐' },
  { type: 'stars', amount: 15, label: '15 ⭐' },
  { type: 'stars', amount: 10, label: '10 ⭐' },
  { type: 'sticker', label: 'Sticker 🎁' },
  { type: 'stars', amount: 50, label: 'JACKPOT 50 ⭐' },
];
