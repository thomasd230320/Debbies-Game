/* ===========================================================
   Memory Pairs — flip cards, find matching pairs.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playCorrect, playWrong, playWin, playTap } from '../../js/shared/sound.js';
import { addStars, recordGameStat, getGameStats } from '../../js/shared/store.js';

const EMOJIS = ['🐶','🐱','🦊','🐼','🐰','🦄','🐸','🐧','🦋','🐢','🐝','🐙','🌸','🍓','⭐','🌈','🍩','🎈'];

const topbar = mountTopbar(document.getElementById('topbar'));
const boardEl = document.getElementById('board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');

let pairs = 6;
let deck = [];
let first = null;       // { card, value }
let lock = false;
let moves = 0;
let matched = 0;
let timer = null;
let seconds = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startTimer() {
  stopTimer();
  seconds = 0;
  timeEl.textContent = '0s';
  timer = setInterval(() => {
    seconds++;
    timeEl.textContent = seconds + 's';
  }, 1000);
}
function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

function columnsFor(n) {
  // n cards total -> pick a tidy column count
  if (n <= 12) return 4;
  if (n <= 16) return 4;
  return 5;
}

function build() {
  stopTimer();
  moves = 0; matched = 0; first = null; lock = false;
  movesEl.textContent = '0';

  const chosen = shuffle(EMOJIS.slice()).slice(0, pairs);
  deck = shuffle(chosen.flatMap(v => [v, v]));

  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${columnsFor(deck.length)}, 1fr)`;

  deck.forEach(value => {
    const card = el('div', { class: 'mem-card' }, [
      el('div', { class: 'mem-inner' }, [
        el('div', { class: 'mem-face mem-back' }, '❓'),
        el('div', { class: 'mem-face mem-front' }, value),
      ]),
    ]);
    card.addEventListener('click', () => onFlip(card, value));
    boardEl.append(card);
  });

  startTimer();
}

function onFlip(card, value) {
  if (lock) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  playTap();

  if (!first) {
    first = { card, value };
    return;
  }

  // second card flipped -> a move
  moves++;
  movesEl.textContent = moves.toString();

  if (first.value === value) {
    // match!
    const a = first.card, b = card;
    setTimeout(() => {
      a.classList.add('matched');
      b.classList.add('matched');
      starBurstFrom(b, 6);
      playCorrect();
    }, 250);
    first = null;
    matched++;
    if (matched === pairs) win();
  } else {
    // no match -> flip back
    lock = true;
    const a = first.card, b = card;
    first = null;
    playWrong();
    setTimeout(() => {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      lock = false;
    }, 850);
  }
}

function starsForResult() {
  // fewer moves = more stars. perfect = pairs moves.
  const extra = moves - pairs;
  if (extra <= 2) return 3;
  if (extra <= 6) return 2;
  return 1;
}

function win() {
  stopTimer();
  const stars = starsForResult();
  addStars(stars);
  topbar.refreshStars();

  const bestMoves = recordGameStat('memory', 'bestMoves', moves, { mode: 'min' });
  const bestTime = recordGameStat('memory', 'bestTime', seconds, { mode: 'min' });
  const stats = getGameStats('memory');

  setTimeout(() => {
    confetti();
    playWin();
    showModal({
      title: pickPraise(),
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.3rem', margin: '4px 0' } },
          '⭐'.repeat(stars) + ` You won ${stars} star${stars > 1 ? 's' : ''}!`),
        el('p', { class: 'subtle' }, `Moves: ${moves}  ·  Time: ${seconds}s`),
        (bestMoves || bestTime)
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New best!')
          : el('p', { class: 'subtle' }, `Best: ${stats.bestMoves} moves · ${stats.bestTime}s`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: build }],
    });
  }, 700);
}

// level picker
document.getElementById('level-row').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('#level-row .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  pairs = parseInt(btn.dataset.pairs, 10);
  build();
});

document.getElementById('restart').addEventListener('click', build);

build();
