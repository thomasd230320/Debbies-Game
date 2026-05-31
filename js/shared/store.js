/* ===========================================================
   store.js — progress + rewards saved in localStorage
   One namespaced key holds total stars and per-game stats.
   Degrades gracefully to in-memory if storage is unavailable.
   =========================================================== */

const KEY = 'debbie.v1';

import { GAMES } from './config.js';
import { TITLES, ACHIEVEMENTS, STICKERS, CHALLENGE_POOL, SPIN_WHEEL } from './progress-catalog.js';

const LEARNING_MULTIPLIER = 2; // learning games reward 2x to nudge her toward them

const DEFAULT_STATE = {
  totalStars: 0,
  xp: 0,              // lifetime stars earned — only ever goes up (drives levels)
  notifiedLevel: 1,   // highest level we've already celebrated
  muted: false,
  games: {}, // { [gameId]: { ...stats } }
  counts: { gamesPlayed: 0 },
  flags: {},          // one-off accomplishments, e.g. { wordmatchAllTen, memoryWin }
  stickers: [],       // owned sticker ids
  achievements: [],   // earned achievement ids
  shop: {
    pet: null,        // current pet id, or null until adopted
    petName: '',
    ownedPets: [],
    ownedItems: [],
    equipped: {},     // { hat, face, collar, neck, lead, held }
    happiness: 50,
    ownedThemes: ['default'],
    theme: 'default',
  },
  daily: {
    lastBonusDate: '',
    learnStreak: 0,
    lastLearnDate: '',
    playStreak: 0,
    bestStreak: 0,
    lastPlayDate: '',
    playDays: [],
    claimedStreakMilestones: [],
    lastSpinDate: '',
    challenge: null,
  },
};

let memoryFallback = null; // used if localStorage throws

function load() {
  if (memoryFallback) return memoryFallback;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const s = { ...structuredClone(DEFAULT_STATE), ...parsed };
    // deep-merge nested objects so older saves gain any new keys
    s.shop = { ...structuredClone(DEFAULT_STATE.shop), ...(parsed.shop || {}) };
    s.daily = { ...structuredClone(DEFAULT_STATE.daily), ...(parsed.daily || {}) };
    s.counts = { ...structuredClone(DEFAULT_STATE.counts), ...(parsed.counts || {}) };
    s.flags = { ...(parsed.flags || {}) };
    s.games = { ...(parsed.games || {}) };
    s.stickers = Array.isArray(parsed.stickers) ? parsed.stickers : [];
    s.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
    // Migration: saves made before XP existed have no `xp`. Backfill it from
    // stars already earned so past progress counts (and games she already had
    // don't get re-locked behind XP unlocks).
    if (parsed.xp === undefined) {
      s.xp = Math.max(s.totalStars || 0, s.xp || 0);
    }
    return s;
  } catch (e) {
    memoryFallback = structuredClone(DEFAULT_STATE);
    return memoryFallback;
  }
}

function save(state) {
  if (memoryFallback) { memoryFallback = state; return; }
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    memoryFallback = state; // switch to in-memory for the rest of the session
  }
}

export function getState() {
  return load();
}

export function getStars() {
  return load().totalStars;
}

export function addStars(n) {
  const s = load();
  s.totalStars = Math.max(0, (s.totalStars || 0) + n);
  if (n > 0) s.xp = (s.xp || 0) + n; // lifetime XP only counts stars gained
  save(s);
  return s.totalStars;
}

export function getGameStats(gameId) {
  return load().games[gameId] || {};
}

/**
 * Record a stat keeping the best value.
 * mode 'max' keeps the larger number (high score),
 * mode 'min' keeps the smaller number (fewest moves / fastest time).
 * Returns true if a new best was set.
 */
export function recordGameStat(gameId, key, value, { mode = 'max' } = {}) {
  const s = load();
  const g = s.games[gameId] || (s.games[gameId] = {});
  const prev = g[key];
  let isBest = false;
  if (prev === undefined) {
    isBest = true;
  } else if (mode === 'max') {
    isBest = value > prev;
  } else {
    isBest = value < prev;
  }
  if (isBest) {
    g[key] = value;
    save(s);
  }
  return isBest;
}

export function getHighScore(gameId, key = 'highScore') {
  return getGameStats(gameId)[key];
}

/* ---- mute preference ---- */
export function isMuted() { return !!load().muted; }
export function setMuted(v) {
  const s = load();
  s.muted = !!v;
  save(s);
  return s.muted;
}
export function toggleMuted() { return setMuted(!isMuted()); }

/* ---- spending + star shop ---- */

/**
 * Spend stars like coins. Only deducts if she can afford it.
 * Returns true on success, false if too few stars.
 */
export function spendStars(n) {
  const s = load();
  if ((s.totalStars || 0) < n) return false;
  s.totalStars -= n;
  save(s);
  return true;
}

/** Get the shop/pet state (filling defaults for older saves). */
export function getShop() {
  const s = load();
  if (!s.shop) {
    s.shop = structuredClone(DEFAULT_STATE.shop);
    save(s);
  }
  // ensure all keys exist even if an older save is missing some
  s.shop = { ...structuredClone(DEFAULT_STATE.shop), ...s.shop };
  return s.shop;
}

/** Persist the shop/pet state. */
export function saveShop(shop) {
  const s = load();
  s.shop = shop;
  save(s);
}

/* ===========================================================
   Progression engine — levels, play streak, daily challenge,
   lucky spin, stickers, achievements. One hook (reportGameResult)
   is called by every game at the end of a round.
   =========================================================== */

export function xpForLevel(L) { return 25 * L * (L - 1); }

export function getLevel() {
  const xp = load().xp || 0;
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - base;
  const needed = next - base;
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    xp, into, needed,
    progress: needed ? into / needed : 1,
  };
}

/** If a new level has been reached since we last celebrated, return it (once). */
export function pollLevelUp() {
  const s = load();
  const level = getLevel().level;
  if (level > (s.notifiedLevel || 1)) {
    s.notifiedLevel = level;
    save(s);
    return level;
  }
  return null;
}

/* ---- play streak (any game, daily) ---- */
const STREAK_MILESTONES = { 3: 10, 7: 25, 14: 50, 30: 100 };

export function getStreak() {
  const d = getDaily();
  return { streak: d.playStreak || 0, best: d.bestStreak || 0, days: d.playDays || [] };
}

// mutates s; returns {milestone, bonus}
function recordPlayDayInternal(s) {
  const d = s.daily;
  const t = today();
  if (d.lastPlayDate === t) return { milestone: 0, bonus: 0 };
  d.playStreak = d.lastPlayDate === yesterday() ? (d.playStreak || 0) + 1 : 1;
  d.lastPlayDate = t;
  d.bestStreak = Math.max(d.bestStreak || 0, d.playStreak);
  d.playDays = [...(d.playDays || []), t].slice(-30);
  let milestone = 0, bonus = 0;
  if (STREAK_MILESTONES[d.playStreak] && !(d.claimedStreakMilestones || []).includes(d.playStreak)) {
    milestone = d.playStreak;
    bonus = STREAK_MILESTONES[d.playStreak];
    d.claimedStreakMilestones = [...(d.claimedStreakMilestones || []), d.playStreak];
  }
  return { milestone, bonus };
}

/* ---- daily challenge ---- */
function dateSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getDailyChallenge() {
  const s = load();
  const t = today();
  if (!s.daily.challenge || s.daily.challenge.date !== t) {
    const pick = CHALLENGE_POOL[dateSeed(t) % CHALLENGE_POOL.length];
    s.daily.challenge = { date: t, done: false, ...pick };
    save(s);
  }
  return s.daily.challenge;
}

/* ---- lucky spin ---- */
export function canSpin() { return getDaily().lastSpinDate !== today(); }

/** Perform the daily spin. Returns { segment, prize, stickerId } or null if already spun. */
export function doSpin() {
  const s = load();
  if (s.daily.lastSpinDate === today()) return null;
  const segment = Math.floor(Math.random() * SPIN_WHEEL.length);
  const prize = SPIN_WHEEL[segment];
  s.daily.lastSpinDate = today();
  let stickerId = null;
  if (prize.type === 'stars') {
    s.totalStars = (s.totalStars || 0) + prize.amount;
    s.xp = (s.xp || 0) + prize.amount;
  } else if (prize.type === 'sticker') {
    stickerId = grantRandomStickerInternal(s);
  }
  save(s);
  return { segment, prize, stickerId };
}

/* ---- stickers ---- */
export function getStickers() { return load().stickers || []; }

// mutates s; returns a newly-granted sticker id (or null if all owned)
function grantRandomStickerInternal(s) {
  const owned = new Set(s.stickers || []);
  const pool = STICKERS.filter(st => !owned.has(st.id));
  if (!pool.length) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  s.stickers = [...(s.stickers || []), pick.id];
  return pick.id;
}

/* ---- achievements ---- */
function buildSnapshot(s) {
  const g = s.games || {};
  return {
    level: getLevel().level,
    xp: s.xp || 0,
    totalStars: s.totalStars || 0,
    gamesPlayed: (s.counts && s.counts.gamesPlayed) || 0,
    playStreak: (s.daily && s.daily.playStreak) || 0,
    bestStreak: (s.daily && s.daily.bestStreak) || 0,
    learnStreak: (s.daily && s.daily.learnStreak) || 0,
    pets: (s.shop && s.shop.ownedPets ? s.shop.ownedPets.length : 0),
    items: (s.shop && s.shop.ownedItems ? s.shop.ownedItems.length : 0),
    themes: (s.shop && s.shop.ownedThemes ? s.shop.ownedThemes.length : 0),
    stickers: (s.stickers || []).length,
    stickersTotal: STICKERS.length,
    best: Object.fromEntries(Object.entries(g).map(([id, v]) => [id, v.highScore || 0])),
    flags: s.flags || {},
  };
}

export function getAchievementsState() {
  const s = load();
  const earned = new Set(s.achievements || []);
  const snap = buildSnapshot(s);
  return ACHIEVEMENTS.map(a => ({ ...a, earned: earned.has(a.id) }));
}

// mutates s; returns array of newly-earned achievement objects (grants reward stars)
function evaluateAchievementsInternal(s) {
  const earned = new Set(s.achievements || []);
  const snap = buildSnapshot(s);
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!earned.has(a.id) && a.check(snap)) {
      earned.add(a.id);
      fresh.push(a);
      if (a.reward) { s.totalStars = (s.totalStars || 0) + a.reward; s.xp = (s.xp || 0) + a.reward; }
    }
  }
  if (fresh.length) s.achievements = [...earned];
  return fresh;
}

/* ---- the one hook every game calls at the end of a round ----
   result: { score (number), won (bool) }. Returns notifications. */
export function reportGameResult(gameId, { score = 0, won = false } = {}) {
  const s = load();
  s.counts = s.counts || { gamesPlayed: 0 };
  s.counts.gamesPlayed = (s.counts.gamesPlayed || 0) + 1;

  s.flags = s.flags || {};
  if (gameId === 'wordmatch' && score >= 10) s.flags.wordmatchAllTen = true;
  if (gameId === 'memory' && won) s.flags.memoryWin = true;

  const streak = recordPlayDayInternal(s);

  // daily challenge
  let challengeDone = false;
  const ch = s.daily.challenge;
  if (ch && ch.date === today() && !ch.done && ch.gameId === gameId) {
    const met = ch.won ? won : score >= ch.target;
    if (met) {
      ch.done = true;
      challengeDone = true;
      s.totalStars = (s.totalStars || 0) + 25;
      s.xp = (s.xp || 0) + 25;
    }
  }

  // sticker drop (~25%)
  let newSticker = null;
  if (Math.random() < 0.25) newSticker = grantRandomStickerInternal(s);

  const newAchievements = evaluateAchievementsInternal(s);

  save(s);

  return {
    streakBonus: streak.bonus,
    streakMilestone: streak.milestone,
    playStreak: s.daily.playStreak,
    challengeDone,
    challengeReward: challengeDone ? 25 : 0,
    newSticker,
    newAchievements,
    leveledUp: pollLevelUp(),
  };
}

/* ---- earning: central award helper (learning games pay more) ---- */

const LEARNING_IDS = new Set(GAMES.filter(g => g.learning).map(g => g.id));

/**
 * Award stars for a game result. Learning games get the multiplier.
 * Returns the number of stars actually given (for display).
 */
export function awardStars(gameId, base) {
  const mult = LEARNING_IDS.has(gameId) ? LEARNING_MULTIPLIER : 1;
  const earned = Math.max(0, Math.round(base * mult));
  addStars(earned);
  return earned;
}

/* ---- daily bonus + learning streak ---- */

function today() { return new Date().toISOString().slice(0, 10); }
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getDaily() {
  const s = load();
  if (!s.daily) s.daily = structuredClone(DEFAULT_STATE.daily);
  s.daily = { ...structuredClone(DEFAULT_STATE.daily), ...s.daily };
  return s.daily;
}

/** Give a once-per-day welcome bonus. Returns stars granted (0 if already claimed today). */
export function claimDailyBonus(amount = 10) {
  const s = load();
  const daily = { ...structuredClone(DEFAULT_STATE.daily), ...(s.daily || {}) };
  if (daily.lastBonusDate === today()) return 0;
  daily.lastBonusDate = today();
  s.daily = daily;
  s.totalStars = (s.totalStars || 0) + amount;
  s.xp = (s.xp || 0) + amount;
  save(s);
  return amount;
}

/**
 * Record that she played a learning game today; updates the day streak.
 * Once per day grants a streak bonus (when streak >= 2). Returns {streak, bonus}.
 */
export function recordLearningPlay() {
  const s = load();
  const daily = { ...structuredClone(DEFAULT_STATE.daily), ...(s.daily || {}) };
  if (daily.lastLearnDate === today()) {
    return { streak: daily.learnStreak, bonus: 0 }; // already counted today
  }
  daily.learnStreak = daily.lastLearnDate === yesterday() ? daily.learnStreak + 1 : 1;
  daily.lastLearnDate = today();
  const bonus = daily.learnStreak >= 2 ? Math.min(daily.learnStreak * 2, 20) : 0;
  s.daily = daily;
  if (bonus > 0) s.totalStars = (s.totalStars || 0) + bonus;
  save(s);
  return { streak: daily.learnStreak, bonus };
}
