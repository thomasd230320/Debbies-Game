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
  shop: {
    pet: null,        // current pet id, or null until adopted
    petName: '',
    ownedPets: [],
    ownedItems: [],
    equipped: {},     // { hat, face, neck, held }
    happiness: 50,
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
