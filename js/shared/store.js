/* ===========================================================
   store.js — progress + rewards saved in localStorage
   One namespaced key holds total stars and per-game stats.
   Degrades gracefully to in-memory if storage is unavailable.
   =========================================================== */

const KEY = 'debbie.v1';

const DEFAULT_STATE = {
  totalStars: 0,
  muted: false,
  games: {}, // { [gameId]: { ...stats } }
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
