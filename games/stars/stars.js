/* ===========================================================
   Catch the Stars — slide the basket to catch falling stars,
   avoid bombs. Timed round. requestAnimationFrame loop.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurst, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playStar, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, reportGameResult } from '../../js/shared/store.js';
import { celebrateProgress } from '../../js/shared/celebrate.js';

const ROUND = 40;
const topbar = mountTopbar(document.getElementById('topbar'));
const arena = document.getElementById('arena');
const basket = document.getElementById('basket');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-btn');

let fallers = [];     // { node, x, y, vy, kind }
let basketX = 0.5;    // 0..1 fraction of width
let score = 0;
let timeLeft = ROUND;
let running = false;
let rafId = null;
let lastSpawn = 0;
let lastTick = 0;
let secTimer = null;

function arenaSize() {
  return { w: arena.clientWidth, h: arena.clientHeight };
}

function positionBasket() {
  const { w } = arenaSize();
  basket.style.left = (basketX * w) + 'px';
}

function spawn() {
  const isBomb = Math.random() < 0.22;
  const node = el('div', { class: 'faller', text: isBomb ? '💣' : (Math.random() < 0.15 ? '🌈' : '⭐') });
  const x = 0.08 + Math.random() * 0.84;
  node.style.left = (x * arenaSize().w) + 'px';
  node.style.top = '-40px';
  arena.append(node);
  fallers.push({ node, x, y: -40, vy: 120 + Math.random() * 90, kind: node.textContent });
}

function loop(ts) {
  if (!running) return;
  if (!lastTick) lastTick = ts;
  const dt = Math.min(0.05, (ts - lastTick) / 1000);
  lastTick = ts;

  const { w, h } = arenaSize();
  const catchY = h - 56;            // basket top zone
  const basketPx = basketX * w;

  if (ts - lastSpawn > Math.max(450, 900 - (ROUND - timeLeft) * 12)) {
    spawn();
    lastSpawn = ts;
  }

  for (const f of fallers) {
    f.y += f.vy * dt;
    f.node.style.top = f.y + 'px';
    const fx = f.x * w;
    if (f.y >= catchY && f.y <= h && Math.abs(fx - basketPx) < 46) {
      // caught / hit
      if (f.kind === '💣') {
        playWrong();
        score = Math.max(0, score - 3);
        basket.classList.add('wiggle');
        setTimeout(() => basket.classList.remove('wiggle'), 400);
      } else {
        const pts = f.kind === '🌈' ? 3 : 1;
        score += pts;
        playStar();
        const r = f.node.getBoundingClientRect();
        starBurst(r.left + r.width / 2, r.top, 4, false);
      }
      scoreEl.textContent = score;
      f.remove = true;
    } else if (f.y > h + 40) {
      f.remove = true;
    }
  }
  fallers = fallers.filter(f => { if (f.remove) { f.node.remove(); return false; } return true; });

  rafId = requestAnimationFrame(loop);
}

function start() {
  fallers.forEach(f => f.node.remove());
  fallers = [];
  score = 0; timeLeft = ROUND; running = true;
  scoreEl.textContent = '0';
  timeEl.textContent = ROUND;
  startBtn.hidden = true;
  lastSpawn = 0; lastTick = 0;
  positionBasket();
  secTimer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) end();
  }, 1000);
  rafId = requestAnimationFrame(loop);
}

function end() {
  running = false;
  cancelAnimationFrame(rafId);
  clearInterval(secTimer);
  fallers.forEach(f => f.node.remove());
  fallers = [];
  startBtn.hidden = false;

  const stars = Math.max(1, Math.floor(score / 6));
  awardStars('stars', stars);
  topbar.refreshStars();
  const isBest = recordGameStat('stars', 'highScore', score, { mode: 'max' });
  const best = getHighScore('stars');
  celebrateProgress(reportGameResult('stars', { score }), topbar);

  setTimeout(() => {
    confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `⭐ You caught ${score}!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New high score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: start }],
    });
  }, 400);
}

/* ---- move the basket: drag/point, or arrow keys ---- */
function moveTo(clientX) {
  const rect = arena.getBoundingClientRect();
  basketX = Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width));
  positionBasket();
}
arena.addEventListener('pointermove', (e) => { if (running) moveTo(e.clientX); });
arena.addEventListener('pointerdown', (e) => { if (running) moveTo(e.clientX); });
window.addEventListener('keydown', (e) => {
  if (!running) return;
  if (e.key === 'ArrowLeft') { basketX = Math.max(0.04, basketX - 0.06); positionBasket(); }
  if (e.key === 'ArrowRight') { basketX = Math.min(0.96, basketX + 0.06); positionBasket(); }
});
window.addEventListener('resize', positionBasket);

startBtn.addEventListener('click', start);
positionBasket();
