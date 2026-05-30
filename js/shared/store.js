/* ===========================================================
   store.js — progress + rewards saved in localStorage
   One namespaced key holds total stars and per-game stats.
   Degrades gracefully to in-memory if storage is unavailable.
   =========================================================== */

const KEY = 'debbie.v1';

import { GAMES } from './config.js';

const LEARNING_MULTIPLIER = 2; // learning games reward 2x to nudge her toward them

const DEFAULT_STATE = {
  totalStars: 0,
  muted: false,
  games: {}, // { [gameId]: { ...stats } }
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
  },
};

let memoryFallback = null; // used if localStorage throws

function load() {
  if (memoryFallback) return memoryFallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
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
