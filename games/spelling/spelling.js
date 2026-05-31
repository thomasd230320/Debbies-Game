/* ===========================================================
   Spelling Bee — hear the word, type it, earn stars.
   Uses SpeechSynthesis; falls back to showing the word if the
   device has no speech support.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise, pickEncouragement, toast } from '../../js/shared/ui.js';
import { playCorrect, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, recordLearningPlay, reportGameResult } from '../../js/shared/store.js';
import { celebrateProgress } from '../../js/shared/celebrate.js';
import { speak, repeat, isSupported } from '../../js/shared/speech.js';
import { WORD_LISTS } from './words.js';

const ROUND = 8; // words per round
const STARS_PER_LEVEL = { easy: 1, medium: 2, hard: 3 };

const topbar = mountTopbar(document.getElementById('topbar'));

let level = 'easy';
let queue = [];
let index = 0;
let score = 0;
let attempts = 0;
let current = null;
const speechOK = isSupported();

const elNum = document.getElementById('num');
const elScore = document.getElementById('score');
const elReveal = document.getElementById('word-reveal');
const elHint = document.getElementById('hint');
const elInput = document.getElementById('spell-input');
const elLetters = document.getElementById('letters');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function start() {
  document.getElementById('setup').hidden = true;
  document.getElementById('play').hidden = false;
  queue = shuffle(WORD_LISTS[level]).slice(0, ROUND);
  index = 0; score = 0;
  elScore.textContent = '0';
  loadWord();
}

function loadWord() {
  current = queue[index];
  attempts = 0;
  elNum.textContent = (index + 1).toString();
  elInput.value = '';
  elLetters.innerHTML = '';
  elHint.textContent = '';
  elInput.focus();

  if (speechOK) {
    elReveal.textContent = '🔊 …';
    sayWord();
  } else {
    // no speech: show the word briefly then hide
    elReveal.textContent = current.word.toUpperCase();
    setTimeout(() => { if (current) elReveal.textContent = '✏️ spell it!'; }, 1800);
  }
}

function sayWord() {
  if (!speechOK) { elReveal.textContent = current.word.toUpperCase(); return; }
  elReveal.textContent = '🔊 listening…';
  speak(current.word).then(() => {
    elReveal.textContent = '✏️ spell it!';
  });
}

/** Show letter-by-letter feedback against the target word. */
function showLetterFeedback(typed) {
  const target = current.word.toLowerCase();
  const guess = typed.toLowerCase();
  elLetters.innerHTML = '';
  for (let i = 0; i < target.length; i++) {
    const g = guess[i];
    const correct = g === target[i];
    elLetters.append(el('span', { class: correct ? 'ok' : 'no' }, g ? g.toUpperCase() : '_'));
  }
}

function check() {
  const typed = elInput.value.trim();
  if (!typed) return;
  attempts++;

  if (typed.toLowerCase() === current.word.toLowerCase()) {
    const base = STARS_PER_LEVEL[level] + (attempts === 1 ? 1 : 0); // first-try bonus
    const earned = awardStars('spelling', base); // learning game → doubled
    score += earned;
    elScore.textContent = score;
    topbar.refreshStars();
    starBurstFrom(elInput, 8);
    playCorrect();
    toast(pickPraise());
    next();
  } else {
    playWrong();
    showLetterFeedback(typed);
    if (attempts >= 2) {
      // reveal the answer to teach, then move on
      elReveal.textContent = current.word.toUpperCase();
      toast(`It was “${current.word}” — let's keep going!`);
      setTimeout(next, 1600);
    } else {
      elInput.classList.add('wiggle');
      setTimeout(() => elInput.classList.remove('wiggle'), 400);
      toast(pickEncouragement());
    }
  }
}

function next() {
  index++;
  if (index >= queue.length) return finish();
  setTimeout(loadWord, 700);
}

function skip() {
  elReveal.textContent = current.word.toUpperCase();
  setTimeout(next, 900);
}

function finish() {
  const isBest = recordGameStat('spelling', 'highScore', score, { mode: 'max' });
  const best = getHighScore('spelling');
  celebrateProgress(reportGameResult('spelling', { score, won: true }), topbar);
  const streak = recordLearningPlay();
  if (streak.bonus > 0) {
    topbar.refreshStars();
    setTimeout(() => toast(`🔥 ${streak.streak}-day learning streak! +${streak.bonus} ⭐`), 1400);
  }
  setTimeout(() => {
    confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🐝 You earned ${score} stars this round!`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New best score!')
          : el('p', { class: 'subtle' }, `Best: ${best}`),
      ]),
      buttons: [
        { label: '🔄 Play again', primary: true, onClick: start },
        { label: '⚙️ Change level', onClick: () => {
            document.getElementById('play').hidden = true;
            document.getElementById('setup').hidden = false;
          } },
      ],
    });
  }, 600);
}

/* ---- wiring ---- */
document.getElementById('level-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('#level-row .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  level = btn.dataset.level;
});

document.getElementById('start-btn').addEventListener('click', start);
document.getElementById('say-btn').addEventListener('click', () => speechOK ? repeat() : sayWord());
document.getElementById('hint-btn').addEventListener('click', () => { elHint.textContent = '💡 ' + current.hint; });
document.getElementById('check-btn').addEventListener('click', check);
document.getElementById('skip-btn').addEventListener('click', skip);
elInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });

if (!speechOK) document.getElementById('speech-warn').hidden = false;
