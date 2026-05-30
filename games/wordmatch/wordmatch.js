/* ===========================================================
   Word Match — read the word, tap the matching picture.
   Reads the word aloud too (reuses the shared speech wrapper).
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise, toast, pickEncouragement } from '../../js/shared/ui.js';
import { playCorrect, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore, recordLearningPlay } from '../../js/shared/store.js';
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

let queue = [];
let index = 0;
let score = 0;    // number of correct matches
let earned = 0;   // stars actually awarded (doubled for this learning game)
let answered = false;

document.getElementById('total').textContent = TOTAL;

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
  scoreEl.textContent = '0';
  loadQuestion();
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
  if (answered) return;
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
    setTimeout(next, 800);
  } else {
    btn.classList.add('wrong');
    playWrong();
    toast(pickEncouragement());
    setTimeout(() => btn.classList.remove('wrong'), 600);
  }
}

function next() {
  index++;
  if (index >= queue.length) return finish();
  loadQuestion();
}

function finish() {
  const isBest = recordGameStat('wordmatch', 'highScore', score, { mode: 'max' });
  const best = getHighScore('wordmatch');
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

start();
