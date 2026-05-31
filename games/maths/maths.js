/* ===========================================================
   Maths Blaster — timed quick-fire add / subtract / times tables.
   Multiple-choice (touch friendly), streak multiplier, stars.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise, toast } from '../../js/shared/ui.js';
import { playCorrect, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, recordLearningPlay, reportGameResult } from '../../js/shared/store.js';
import { celebrateProgress } from '../../js/shared/celebrate.js';

const topbar = mountTopbar(document.getElementById('topbar'));

let mode = 'add';
let level = 1;
let roundTime = 60;

let score = 0;
let streak = 0;
let timeLeft = 0;
let timer = null;
let current = null;
let accepting = false;

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Generate a question { prompt, answer } for the mode + level. */
function makeQuestion(m) {
  if (m === 'mix') m = ['add', 'sub', 'times'][rnd(0, 2)];

  if (m === 'add') {
    const top = level === 1 ? 10 : level === 2 ? 20 : 100;
    const a = rnd(0, top), b = rnd(0, top);
    return { prompt: `${a} + ${b}`, answer: a + b };
  }
  if (m === 'sub') {
    const top = level === 1 ? 10 : level === 2 ? 20 : 100;
    let a = rnd(0, top), b = rnd(0, top);
    if (b > a) [a, b] = [b, a]; // never negative
    return { prompt: `${a} − ${b}`, answer: a - b };
  }
  // times
  const tables = level === 1 ? [2, 5, 10] : level === 2 ? [2, 3, 4, 5, 6, 10] : [2,3,4,5,6,7,8,9,10,11,12];
  const a = tables[rnd(0, tables.length - 1)];
  const b = rnd(1, 12);
  return { prompt: `${a} × ${b}`, answer: a * b };
}

/** Build 4 unique answer options including the correct one. */
function makeOptions(answer) {
  const opts = new Set([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) {
    const spread = Math.max(3, Math.round(answer * 0.3));
    let cand = answer + rnd(-spread - 2, spread + 2);
    if (cand < 0) cand = Math.abs(cand) + 1;
    if (cand !== answer) opts.add(cand);
  }
  while (opts.size < 4) opts.add(answer + opts.size); // fallback
  return [...opts].sort(() => Math.random() - 0.5);
}

const scoreEl = document.getElementById('score');
const timeLeftEl = document.getElementById('time-left');
const timerBar = document.getElementById('timer-bar');
const streakEl = document.getElementById('streak');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');

function nextQuestion() {
  current = makeQuestion(mode);
  questionEl.textContent = current.prompt;
  answersEl.innerHTML = '';
  makeOptions(current.answer).forEach(val => {
    const btn = el('button', { class: 'answer-btn', text: val });
    btn.addEventListener('click', () => onAnswer(btn, val));
    answersEl.append(btn);
  });
  accepting = true;
}

function onAnswer(btn, val) {
  if (!accepting) return;
  accepting = false;

  if (val === current.answer) {
    btn.classList.add('correct');
    streak++;
    const bonus = streak >= 3 ? 2 : 1; // streak multiplier
    score += bonus;
    scoreEl.textContent = score;
    streakEl.textContent = streak >= 3 ? `🔥 ${streak} in a row! (x2)` : (streak >= 2 ? `🔥 ${streak} in a row!` : '');
    starBurstFrom(btn, 4);
    playCorrect();
    setTimeout(nextQuestion, 350);
  } else {
    btn.classList.add('wrong');
    streak = 0;
    streakEl.textContent = '';
    playWrong();
    // show the correct one
    [...answersEl.children].forEach(b => {
      if (Number(b.textContent) === current.answer) b.classList.add('correct');
    });
    setTimeout(nextQuestion, 800);
  }
}

function tick() {
  timeLeft--;
  timeLeftEl.textContent = timeLeft;
  timerBar.style.width = (timeLeft / roundTime * 100) + '%';
  if (timeLeft <= 0) end();
}

function start() {
  document.getElementById('setup').hidden = true;
  document.getElementById('play').hidden = false;
  score = 0; streak = 0; timeLeft = roundTime;
  scoreEl.textContent = '0';
  streakEl.textContent = '';
  timeLeftEl.textContent = timeLeft;
  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';
  requestAnimationFrame(() => { timerBar.style.transition = 'width 1s linear'; });
  nextQuestion();
  timer = setInterval(tick, 1000);
}

function end() {
  clearInterval(timer);
  accepting = false;

  const base = Math.max(1, Math.floor(score / 5)); // 1 star per 5 correct, min 1
  const stars = awardStars('maths', base);         // learning game → doubled
  topbar.refreshStars();
  const isBest = recordGameStat('maths', 'highScore', score, { mode: 'max' });
  const best = getHighScore('maths');
  celebrateProgress(reportGameResult('maths', { score, won: true }), topbar);
  const streak = recordLearningPlay();
  if (streak.bonus > 0) {
    topbar.refreshStars();
    setTimeout(() => toast(`🔥 ${streak.streak}-day learning streak! +${streak.bonus} ⭐`), 1400);
  }

  setTimeout(() => {
    if (score >= 10) confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🎯 You got ${score} right!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New high score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [
        { label: '🔄 Play again', primary: true, onClick: start },
        { label: '⚙️ Change', onClick: () => {
            document.getElementById('play').hidden = true;
            document.getElementById('setup').hidden = false;
          } },
      ],
    });
  }, 500);
}

/* ---- setup pickers ---- */
function wirePicker(rowId, attr, set) {
  document.getElementById(rowId).addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll(`#${rowId} .chip`).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    set(btn.dataset[attr]);
  });
}
wirePicker('mode-row', 'mode', v => mode = v);
wirePicker('level-row', 'level', v => level = parseInt(v, 10));
wirePicker('time-row', 'time', v => roundTime = parseInt(v, 10));

document.getElementById('start-btn').addEventListener('click', start);
