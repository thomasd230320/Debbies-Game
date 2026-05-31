/* ===========================================================
   Word Match — read the word, tap the matching picture.
   Reads the word aloud too (reuses the shared speech wrapper).
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise, toast, pickEncouragement } from '../../js/shared/ui.js';
import { playCorrect, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, recordLearningPlay, reportGameResult } from '../../js/shared/store.js';
import { celebrateProgress } from '../../js/shared/celebrate.js';
import { speak } from '../../js/shared/speech.js';

const PAIRS = [
  { word: 'apple', emoji: '🍎' }, { word: 'dog', emoji: '🐶' }, { word: 'cat', emoji: '🐱' },
  { word: 'sun', emoji: '☀️' }, { word: 'star', emoji: '⭐' }, { word: 'fish', emoji: '🐟' },
  { word: 'tree', emoji: '🌳' }, { word: 'car', emoji: '🚗' }, { word: 'cake', emoji: '🎂' },
  { word: 'flower', emoji: '🌸' }, { word: 'moon', emoji: '🌙' }, { word: 'rainbow', emoji: '🌈' },
  { word: 'heart', emoji: '❤️' }, { word: 'book', emoji: '📚' }, { word: 'train', emoji: '🚂' },
  { word: 'frog', emoji: '🐸' }, { word: 'bear', emoji: '🐻' }, { word: 'rabbit', emoji: '🐰' },
  { word: 'butterfly', emoji: '🦋' }, { word: 'banana', emoji: '🍌' }, { word: 'strawberry', emoji: '🍓' },
  { word: 'rocket', emoji: '🚀' }, { word: 'balloon', emoji: '🎈' }, { word: 'umbrella', emoji: '☂️' },
  { word: 'ice cream', emoji: '🍦' }, { word: 'crown', emoji: '👑' }, { word: 'unicorn', emoji: '🦄' },
  { word: 'penguin', emoji: '🐧' }, { word: 'duck', emoji: '🦆' }, { word: 'pizza', emoji: '🍕' },
];

const TOTAL = 10;
const topbar = mountTopbar(document.getElementById('topbar'));
const wordEl = document.getElementById('word');
const choicesEl = document.getElementById('choices');
const numEl = document.getElementById('num');
const scoreEl = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');
const timeLeftEl = document.getElementById('time-left');

let queue = [];
let index = 0;
let score = 0;    // number of correct matches
let earned = 0;   // stars actually awarded (doubled for this learning game)
let answered = false;
let totalTime = 45;  // seconds to match all 10 (set by difficulty)
let roundOver = false;

// one round-long countdown driven by requestAnimationFrame
let qStart = 0;
let qRaf = null;

document.getElementById('total').textContent = TOTAL;

function startTimer() {
  stopTimer();
  qStart = performance.now();
  timerBar.classList.remove('low');
  timerBar.style.width = '100%';
  const tick = (now) => {
    const remaining = 1 - (now - qStart) / 1000 / totalTime;
    if (remaining <= 0) {
      timerBar.style.width = '0%';
      timeLeftEl.textContent = '0';
      qRaf = null;
      onTimeUp();
      return;
    }
    timerBar.style.width = (remaining * 100) + '%';
    timerBar.classList.toggle('low', remaining < 0.25);
    timeLeftEl.textContent = Math.ceil(remaining * totalTime);
    qRaf = requestAnimationFrame(tick);
  };
  qRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  if (qRaf) { cancelAnimationFrame(qRaf); qRaf = null; }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function start() {
  queue = shuffle(PAIRS).slice(0, TOTAL);
  index = 0; score = 0; earned = 0;
  roundOver = false;
  scoreEl.textContent = '0';
  timeLeftEl.textContent = totalTime;
  loadQuestion();
  startTimer(); // one clock for the whole round of 10
}

function loadQuestion() {
  answered = false;
  const item = queue[index];
  numEl.textContent = index + 1;
  wordEl.textContent = item.word;
  speak(item.word);

  // 3 wrong picture options + the correct one
  const wrongs = shuffle(PAIRS.filter(p => p.emoji !== item.emoji)).slice(0, 3);
  const options = shuffle([item, ...wrongs]);

  choicesEl.innerHTML = '';
  options.forEach(opt => {
    const btn = el('button', { class: 'choice', text: opt.emoji });
    btn.addEventListener('click', () => onChoose(btn, opt, item));
    choicesEl.append(btn);
  });
}

function onChoose(btn, opt, item) {
  if (answered || roundOver) return;
  if (opt.emoji === item.emoji) {
    answered = true;
    btn.classList.add('correct');
    score++;
    scoreEl.textContent = score;
    earned += awardStars('wordmatch', 1); // learning game → doubled
    topbar.refreshStars();
    starBurstFrom(btn, 6);
    playCorrect();
    toast(pickPraise());
    setTimeout(next, 700);
  } else {
    // wrong guess — clock keeps ticking!
    btn.classList.add('wrong');
    playWrong();
    toast(pickEncouragement());
    setTimeout(() => btn.classList.remove('wrong'), 600);
  }
}

function onTimeUp() {
  if (roundOver) return;
  playWrong();
  toast("⏰ Time's up!");
  finish(true);
}

function next() {
  if (roundOver) return;
  index++;
  if (index >= queue.length) return finish(false);
  loadQuestion();
}

function finish(timedOut = false) {
  if (roundOver) return;
  roundOver = true;
  stopTimer();
  const allDone = score === TOTAL;
  const isBest = recordGameStat('wordmatch', 'highScore', score, { mode: 'max' });
  const best = getHighScore('wordmatch');
  celebrateProgress(reportGameResult('wordmatch', { score, won: score === TOTAL }), topbar);
  const streak = recordLearningPlay();
  if (streak.bonus > 0) {
    topbar.refreshStars();
    setTimeout(() => toast(`🔥 ${streak.streak}-day learning streak! +${streak.bonus} ⭐`), 1400);
  }
  setTimeout(() => {
    if (allDone) confetti();
    playWin();
    showModal({
      title: allDone ? '🏆 All 10! Amazing!' : (timedOut ? "⏰ Time's up!" : pickPraise()),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🔤 You matched ${score} of ${TOTAL}!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐ +' + earned + ' stars'),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New best!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: start }],
    });
  }, 600);
}

document.getElementById('say-btn').addEventListener('click', () => speak(queue[index].word));

// difficulty: changes how long she has per word, then restarts the round
document.getElementById('speed-row').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#speed-row .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  totalTime = parseInt(chip.dataset.time, 10);
  start();
});

start();
