/* ===========================================================
   Candy Match-3 — swap adjacent candies to make rows/columns
   of 3+. Cleared candies fall, new ones drop in, cascades chain.
   Tap-to-select OR swipe to swap. Move-limited rounds.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playPop, playWrong, playWin, playStar } from '../../js/shared/sound.js';
import { addStars, recordGameStat, getHighScore } from '../../js/shared/store.js';

const SIZE = 8;
const TYPES = ['🍓', '🍬', '🍭', '🍇', '🍊', '🫐'];
const START_MOVES = 20;

const topbar = mountTopbar(document.getElementById('topbar'));
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const movesEl = document.getElementById('moves');

let grid = [];        // grid[r][c] = type index
let cells = [];       // cells[r][c] = DOM node
let score = 0;
let movesLeft = START_MOVES;
let selected = null;  // {r,c}
let busy = false;     // block input during animations

boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

const rndType = () => Math.floor(Math.random() * TYPES.length);

/* ---- board setup with no starting matches ---- */
function makeGrid() {
  grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < SIZE; c++) {
      let t;
      do {
        t = rndType();
      } while (
        (c >= 2 && grid[r][c - 1] === t && grid[r][c - 2] === t) ||
        (r >= 2 && grid[r - 1][c] === t && grid[r - 2][c] === t)
      );
      grid[r][c] = t;
    }
  }
}

function render() {
  boardEl.innerHTML = '';
  cells = [];
  for (let r = 0; r < SIZE; r++) {
    cells[r] = [];
    for (let c = 0; c < SIZE; c++) {
      const cell = el('div', { class: 'candy', text: TYPES[grid[r][c]] });
      cell.dataset.r = r;
      cell.dataset.c = c;
      bindInput(cell, r, c);
      boardEl.append(cell);
      cells[r][c] = cell;
    }
  }
}

function paint(r, c) {
  cells[r][c].textContent = TYPES[grid[r][c]];
}

/* ---- input: tap-to-select and swipe ---- */
function bindInput(cell, r, c) {
  cell.addEventListener('click', () => onTap(r, c));

  let sx = 0, sy = 0;
  cell.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  cell.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return; // treat as tap (handled by click)
    let tr = r, tc = c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    if (inBounds(tr, tc)) trySwap({ r, c }, { r: tr, c: tc });
  });
}

const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

function clearSelection() {
  if (selected) cells[selected.r][selected.c].classList.remove('selected');
  selected = null;
}

function onTap(r, c) {
  if (busy) return;
  if (!selected) {
    selected = { r, c };
    cells[r][c].classList.add('selected');
    return;
  }
  if (selected.r === r && selected.c === c) { clearSelection(); return; }
  if (adjacent(selected, { r, c })) {
    const from = selected;
    clearSelection();
    trySwap(from, { r, c });
  } else {
    clearSelection();
    selected = { r, c };
    cells[r][c].classList.add('selected');
  }
}

function swapData(a, b) {
  const t = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = t;
}

async function trySwap(a, b) {
  if (busy || !adjacent(a, b) || movesLeft <= 0) return;
  busy = true;
  clearSelection();

  swapData(a, b);
  paint(a.r, a.c); paint(b.r, b.c);

  const matches = findMatches();
  if (matches.size === 0) {
    // illegal — swap back with a wobble
    playWrong();
    cells[a.r][a.c].classList.add('bad-swap');
    cells[b.r][b.c].classList.add('bad-swap');
    await wait(220);
    swapData(a, b);
    paint(a.r, a.c); paint(b.r, b.c);
    cells[a.r][a.c].classList.remove('bad-swap');
    cells[b.r][b.c].classList.remove('bad-swap');
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
  // horizontal runs
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      if (c < SIZE && grid[r][c] === grid[r][c - 1]) {
        run++;
      } else {
        if (run >= 3) for (let k = c - run; k < c; k++) matched.add(r * SIZE + k);
        run = 1;
      }
    }
  }
  // vertical runs
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      if (r < SIZE && grid[r][c] === grid[r - 1][c]) {
        run++;
      } else {
        if (run >= 3) for (let k = r - run; k < r; k++) matched.add(k * SIZE + c);
        run = 1;
      }
    }
  }
  return matched;
}

/* ---- the clear -> gravity -> refill loop ---- */
async function resolveCascades() {
  let chain = 0;
  while (true) {
    const matches = findMatches();
    if (matches.size === 0) break;
    chain++;

    // score: base 10 per candy, bonus for bigger groups, x chain multiplier
    const gained = matches.size * 10 * chain;
    score += gained;
    scoreEl.textContent = score;

    // animate clearing
    matches.forEach(idx => {
      const r = Math.floor(idx / SIZE), c = idx % SIZE;
      cells[r][c].classList.add('clearing');
    });
    if (chain >= 2) playStar(); else playPop();

    // star burst at the first cleared candy for delight
    const firstIdx = matches.values().next().value;
    starBurstFrom(cells[Math.floor(firstIdx / SIZE)][firstIdx % SIZE], 4);

    await wait(240);

    // remove from data (mark -1)
    matches.forEach(idx => { grid[Math.floor(idx / SIZE)][idx % SIZE] = -1; });

    collapse();
    refill();
    repaintAll();

    // mark fresh drops for a little fall animation
    cells.flat().forEach(cell => cell.classList.remove('clearing'));
    await wait(180);
  }
}

/** Drop existing candies down into empty (-1) spots, per column. */
function collapse() {
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (grid[r][c] !== -1) {
        grid[write][c] = grid[r][c];
        if (write !== r) grid[r][c] = -1;
        write--;
      }
    }
  }
}

/** Fill remaining empty cells (top of columns) with new candies. */
function refill() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === -1) grid[r][c] = rndType();
    }
  }
}

function repaintAll() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      paint(r, c);
      cells[r][c].classList.add('dropping');
      // remove the class after the animation so it can replay later
      const cell = cells[r][c];
      setTimeout(() => cell.classList.remove('dropping'), 280);
    }
  }
}

const wait = (ms) => new Promise(res => setTimeout(res, ms));

function endGame() {
  const stars = Math.max(1, Math.floor(score / 300)); // ~1 star per 300 points
  addStars(stars);
  topbar.refreshStars();
  const isBest = recordGameStat('candy', 'highScore', score, { mode: 'max' });
  const best = getHighScore('candy');

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

function newGame() {
  score = 0; movesLeft = START_MOVES; busy = false; selected = null;
  scoreEl.textContent = '0';
  movesEl.textContent = START_MOVES;
  makeGrid();
  render();
}

document.getElementById('restart').addEventListener('click', newGame);

newGame();
