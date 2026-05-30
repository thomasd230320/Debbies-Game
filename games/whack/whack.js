/* ===========================================================
   Whack-a-Mole — tap moles for points, avoid bombs. Timed.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playWrong, playWin, playPop } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore } from '../../js/shared/store.js';

const ROUND = 30;
const HOLES = 9;

const topbar = mountTopbar(document.getElementById('topbar'));
const holesEl = document.getElementById('holes');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-btn');

let holes = [];
let score = 0;
let timeLeft = ROUND;
let running = false;
let timer = null;
let spawnTimer = null;

function build() {
  holesEl.innerHTML = '';
  holes = [];
  for (let i = 0; i < HOLES; i++) {
    const mole = el('div', { class: 'mole' });
    const hole = el('div', { class: 'hole' }, [mole]);
    mole.addEventListener('click', () => whack(i));
    holesEl.append(hole);
    holes.push({ mole, active: false, kind: 'mole', t: null });
  }
}

function elapsed() { return ROUND - timeLeft; }

function scheduleSpawn() {
  if (!running) return;
  const delay = Math.max(420, 1000 - elapsed() * 20); // speeds up over time
  spawnTimer = setTimeout(() => { spawn(); scheduleSpawn(); }, delay);
}

function spawn() {
  const free = holes.filter(h => !h.active);
  if (!free.length) return;
  const h = free[Math.floor(Math.random() * free.length)];
  h.active = true;
  h.kind = Math.random() < 0.18 ? 'bomb' : 'mole';
  h.mole.textContent = h.kind === 'bomb' ? '💣' : '🐹';
  h.mole.classList.add('up');
  const upTime = Math.max(650, 1050 - elapsed() * 12);
  h.t = setTimeout(() => down(h), upTime);
}

function down(h) {
  h.mole.classList.remove('up');
  h.active = false;
  if (h.t) { clearTimeout(h.t); h.t = null; }
}

function whack(i) {
  const h = holes[i];
  if (!running || !h.active) return;
  if (h.kind === 'bomb') {
    playWrong();
    score = Math.max(0, score - 2);
    h.mole.classList.add('boom');
    setTimeout(() => h.mole.classList.remove('boom'), 300);
  } else {
    playPop();
    score++;
    starBurstFrom(h.mole, 4);
  }
  scoreEl.textContent = score;
  down(h);
}

function start() {
  build();
  score = 0; timeLeft = ROUND; running = true;
  scoreEl.textContent = '0';
  timeEl.textContent = ROUND;
  startBtn.hidden = true;
  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) end();
  }, 1000);
  scheduleSpawn();
}

function end() {
  running = false;
  clearInterval(timer);
  clearTimeout(spawnTimer);
  holes.forEach(down);
  startBtn.hidden = false;

  const stars = Math.max(1, Math.floor(score / 8));
  awardStars('whack', stars);
  topbar.refreshStars();
  const isBest = recordGameStat('whack', 'highScore', score, { mode: 'max' });
  const best = getHighScore('whack');

  setTimeout(() => {
    confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🔨 You bopped ${score} moles!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New high score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: start }],
    });
  }, 400);
}

startBtn.addEventListener('click', start);
build();
