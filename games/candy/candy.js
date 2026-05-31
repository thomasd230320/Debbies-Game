/* ===========================================================
   Candy Match-3 — swap adjacent candies to make rows/columns
   of 3+. Cleared candies pop, the rest slide down with gravity,
   and new ones fall in from the top. Smoothly animated via
   transform/translate. Tap-to-select OR swipe to swap.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurst, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playPop, playWrong, playWin, playStar } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, reportGameResult } from '../../js/shared/store.js';
import { celebrateProgress } from '../../js/shared/celebrate.js';

const SIZE = 8;
const TYPES = ['🍓', '🍬', '🍭', '🍇', '🍊', '🫐'];
const START_MOVES = 20;

// animation timings (kept a touch longer than the CSS transition)
const SWAP_MS = 320;
const CLEAR_MS = 270;
const FALL_MS = 360;

const topbar = mountTopbar(document.getElementById('topbar'));
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const movesEl = document.getElementById('moves');

let grid = [];        // grid[r][c] = candy object | null  ({ type, el, inner })
let score = 0;
let movesLeft = START_MOVES;
let selected = null;  // {r,c}
let busy = false;
let cell = 0;         // pixel size of one cell

const rndType = () => Math.floor(Math.random() * TYPES.length);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function measure() { cell = boardEl.clientWidth / SIZE; }

function makeCandy(type) {
  const inner = document.createElement('div');
  inner.className = 'candy-inner';
  inner.textContent = TYPES[type];
  const outer = document.createElement('div');
  outer.className = 'candy';
  outer.append(inner);
  boardEl.append(outer);
  return { type, el: outer, inner };
}

/** Position a candy at grid (r,c). instant = snap without animating. */
function place(candy, r, c, instant = false) {
  candy.el.style.width = cell + 'px';
  candy.el.style.height = cell + 'px';
  const tf = `translate(${c * cell}px, ${r * cell}px)`;
  if (instant) {
    candy.el.classList.add('no-anim');
    candy.el.style.transform = tf;
    void candy.el.offsetWidth; // force reflow so the next change animates
    candy.el.classList.remove('no-anim');
  } else {
    candy.el.style.transform = tf;
  }
}

/* ---- board setup with no starting matches ---- */
function newGame() {
  busy = false;
  selected = null;
  score = 0;
  movesLeft = START_MOVES;
  scoreEl.textContent = '0';
  movesEl.textContent = START_MOVES;
  boardEl.innerHTML = '';
  measure();

  grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < SIZE; c++) {
      let t;
      do {
        t = rndType();
      } while (
        (c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) ||
        (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t)
      );
      const candy = makeCandy(t);
      grid[r][c] = candy;
      place(candy, r, c, true);
    }
  }
}

/* ---- input (tap-to-select + swipe) via board coordinates ---- */
function cellFromEvent(e) {
  const rect = boardEl.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / cell);
  const r = Math.floor((e.clientY - rect.top) / cell);
  return inBounds(r, c) ? { r, c } : null;
}

let downCell = null, downX = 0, downY = 0;

boardEl.addEventListener('pointerdown', (e) => {
  if (busy) return;
  const p = cellFromEvent(e);
  if (!p) return;
  downCell = p; downX = e.clientX; downY = e.clientY;
});

boardEl.addEventListener('pointerup', (e) => {
  if (busy || !downCell) return;
  const start = downCell;
  downCell = null;
  const dx = e.clientX - downX, dy = e.clientY - downY;
  const threshold = cell * 0.3;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    onTap(start.r, start.c);
  } else {
    let tr = start.r, tc = start.c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    if (inBounds(tr, tc)) doSwap(start, { r: tr, c: tc });
  }
});

function setSelected(r, c, on) {
  if (grid[r][c]) grid[r][c].el.classList.toggle('selected', on);
}

function onTap(r, c) {
  if (busy) return;
  if (!selected) {
    selected = { r, c };
    setSelected(r, c, true);
    return;
  }
  if (selected.r === r && selected.c === c) {
    setSelected(r, c, false);
    selected = null;
    return;
  }
  if (adjacent(selected, { r, c })) {
    const from = selected;
    setSelected(from.r, from.c, false);
    selected = null;
    doSwap(from, { r, c });
  } else {
    setSelected(selected.r, selected.c, false);
    selected = { r, c };
    setSelected(r, c, true);
  }
}

function swapCells(a, b) {
  const t = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = t;
}

async function doSwap(a, b) {
  if (busy || !adjacent(a, b) || movesLeft <= 0) return;
  busy = true;

  swapCells(a, b);
  place(grid[a.r][a.c], a.r, a.c);
  place(grid[b.r][b.c], b.r, b.c);
  await wait(SWAP_MS);

  if (findMatches().size === 0) {
    // illegal — slide back
    playWrong();
    swapCells(a, b);
    place(grid[a.r][a.c], a.r, a.c);
    place(grid[b.r][b.c], b.r, b.c);
    await wait(SWAP_MS);
    busy = false;
    return;
  }

  movesLeft--;
  movesEl.textContent = movesLeft;
  await resolveCascades();
  busy = false;
  if (movesLeft <= 0) endGame();
}

/* ---- match detection ---- */
function findMatches() {
  const matched = new Set();
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      if (c < SIZE && grid[r][c] && grid[r][c - 1] && grid[r][c].type === grid[r][c - 1].type) {
        run++;
      } else {
        if (run >= 3) for (let k = c - run; k < c; k++) matched.add(r + ',' + k);
        run = 1;
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      if (r < SIZE && grid[r][c] && grid[r - 1][c] && grid[r][c].type === grid[r - 1][c].type) {
        run++;
      } else {
        if (run >= 3) for (let k = r - run; k < r; k++) matched.add(k + ',' + c);
        run = 1;
      }
    }
  }
  return matched;
}

/* ---- clear -> gravity -> refill, repeated for cascades ---- */
async function resolveCascades() {
  let chain = 0;
  while (true) {
    const matches = findMatches();
    if (matches.size === 0) break;
    chain++;

    score += matches.size * 10 * chain; // bigger groups + chains score more
    scoreEl.textContent = score;
    chain >= 2 ? playStar() : playPop();

    // pop animation + a little star burst at the first cleared candy
    let first = true;
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const candy = grid[r][c];
      candy.inner.classList.add('pop');
      if (first) {
        const rect = candy.el.getBoundingClientRect();
        starBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 4, false);
        first = false;
      }
    });
    await wait(CLEAR_MS);

    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      grid[r][c].el.remove();
      grid[r][c] = null;
    });

    gravityAndRefill();
    await wait(FALL_MS);
  }
}

/** Slide remaining candies down per column, then drop new ones in from above. */
function gravityAndRefill() {
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    // compact existing candies toward the bottom
    for (let r = SIZE - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (write !== r) {
          grid[write][c] = grid[r][c];
          grid[r][c] = null;
          place(grid[write][c], write, c); // animated slide down
        }
        write--;
      }
    }
    // fill the gap (rows 0..write) with new candies stacked above the board
    let spawnRow = -1;
    for (let r = write; r >= 0; r--) {
      const candy = makeCandy(rndType());
      grid[r][c] = candy;
      place(candy, spawnRow, c, true);              // start off-screen above
      requestAnimationFrame(() => place(candy, r, c)); // then fall to target
      spawnRow--;
    }
  }
}

function endGame() {
  const stars = Math.max(1, Math.floor(score / 300));
  awardStars('candy', stars);
  topbar.refreshStars();
  const isBest = recordGameStat('candy', 'highScore', score, { mode: 'max' });
  const best = getHighScore('candy');
  celebrateProgress(reportGameResult('candy', { score }), topbar);

  setTimeout(() => {
    confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🍬 Score: ${score}`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New high score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: newGame }],
    });
  }, 500);
}

/* keep candies positioned correctly if the screen size changes */
function relayout() {
  measure();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) place(grid[r][c], r, c, true);
    }
  }
}
window.addEventListener('resize', relayout);
window.addEventListener('load', relayout); // in case CSS sizing settled late

document.getElementById('restart').addEventListener('click', newGame);

newGame();
