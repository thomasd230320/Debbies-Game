/* ===========================================================
   Snake — classic. Canvas grid, keyboard + swipe + d-pad.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playPop, playWrong, playWin } from '../../js/shared/sound.js';
import { addStars, recordGameStat, getHighScore } from '../../js/shared/store.js';

const GRID = 15;            // cells per side
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const cell = canvas.width / GRID;

const topbar = mountTopbar(document.getElementById('topbar'));
const scoreEl = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

const COLORS = { head: '#7FC6EE', body: '#AEDFF7', food: '#FFA8D2' };

let snake, dir, nextDir, food, score, timer, running = false;

function reset() {
  snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  scoreEl.textContent = '0';
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // food
  ctx.font = `${cell * 0.9}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍎', food.x * cell + cell / 2, food.y * cell + cell / 2 + 1);
  // snake
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? COLORS.head : COLORS.body;
    roundRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2, 6);
  });
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // wall or self collision
  if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    playPop();
    placeFood();
    // speed up slightly as it grows
    clearInterval(timer);
    timer = setInterval(step, Math.max(80, 180 - score * 5));
  } else {
    snake.pop();
  }
  draw();
}

function setDir(name) {
  const map = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };
  const d = map[name];
  if (!d) return;
  // can't reverse directly
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
}

function start() {
  reset();
  running = true;
  startBtn.hidden = true;
  clearInterval(timer);
  timer = setInterval(step, 180);
}

function gameOver() {
  running = false;
  clearInterval(timer);
  playWrong();
  startBtn.hidden = false;

  const stars = Math.max(1, Math.floor(score / 4));
  addStars(stars);
  topbar.refreshStars();
  const isBest = recordGameStat('snake', 'highScore', score, { mode: 'max' });
  const best = getHighScore('snake');

  setTimeout(() => {
    if (score >= 8) confetti();
    playWin();
    showModal({
      title: score >= 5 ? pickPraise() : 'Good try!',
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🍎 You ate ${score} fruit!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New high score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: start }],
    });
  }, 400);
}

/* ---- controls ---- */
window.addEventListener('keydown', (e) => {
  const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
              w: 'up', s: 'down', a: 'left', d: 'right' }[e.key];
  if (k) { e.preventDefault(); setDir(k); }
});

document.querySelectorAll('.dpad button').forEach(b =>
  b.addEventListener('click', () => setDir(b.dataset.dir)));

// swipe on the canvas
let sx = 0, sy = 0;
canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
canvas.addEventListener('pointerup', (e) => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
  else setDir(dy > 0 ? 'down' : 'up');
});

startBtn.addEventListener('click', start);
reset();
