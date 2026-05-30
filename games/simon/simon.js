/* ===========================================================
   Simon Says — repeat the growing colour + tone sequence.
   =========================================================== */

import { mountTopbar } from '../../js/shared/topbar.js';
import { el, starBurstFrom, confetti, showModal, pickPraise } from '../../js/shared/ui.js';
import { playFreq, playWrong, playWin } from '../../js/shared/sound.js';
import { awardStars, recordGameStat, getHighScore } from '../../js/shared/store.js';

const FREQS = [330, 415, 494, 587]; // pleasant 4-note chord
const topbar = mountTopbar(document.getElementById('topbar'));
const pads = [...document.querySelectorAll('.pad')];
const roundEl = document.getElementById('round');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start-btn');

let sequence = [];
let step = 0;        // player progress through current sequence
let accepting = false;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function flash(i, ms = 380) {
  pads[i].classList.add('lit');
  playFreq(FREQS[i], ms / 1000);
  return wait(ms).then(() => { pads[i].classList.remove('lit'); return wait(120); });
}

async function playSequence() {
  accepting = false;
  statusEl.textContent = '👀 Watch…';
  await wait(500);
  const speed = Math.max(220, 460 - sequence.length * 14);
  for (const i of sequence) {
    await flash(i, speed);
  }
  statusEl.textContent = '✨ Your turn!';
  step = 0;
  accepting = true;
}

function nextRound() {
  sequence.push(Math.floor(Math.random() * 4));
  roundEl.textContent = sequence.length;
  playSequence();
}

function onPad(i) {
  if (!accepting) return;
  flash(i, 240);
  if (i === sequence[step]) {
    step++;
    if (step === sequence.length) {
      accepting = false;
      starBurstFrom(pads[i], 4);
      setTimeout(nextRound, 700);
    }
  } else {
    gameOver();
  }
}

function gameOver() {
  accepting = false;
  playWrong();
  const reached = sequence.length - 1; // completed rounds
  const stars = Math.max(1, Math.floor(reached / 2));
  awardStars('simon', stars);
  topbar.refreshStars();
  const isBest = recordGameStat('simon', 'highScore', reached, { mode: 'max' });
  const best = getHighScore('simon');
  startBtn.hidden = false;
  statusEl.textContent = '';

  setTimeout(() => {
    if (reached >= 5) confetti();
    playWin();
    showModal({
      title: reached >= 3 ? pickPraise() : 'Good try!',
      body: el('div', {}, [
        el('p', { style: { fontSize: '1.4rem', margin: '6px 0' } }, `🎵 You reached round ${reached}!`),
        el('p', { style: { fontSize: '1.2rem' } }, '⭐'.repeat(Math.min(stars, 5)) + ` +${stars} stars`),
        isBest
          ? el('p', { style: { color: 'var(--pink-deep)', fontWeight: '700' } }, '🏆 New best!')
          : el('p', { class: 'subtle' }, `Best round: ${best}`),
      ]),
      buttons: [{ label: '🔄 Play again', primary: true, onClick: start }],
    });
  }, 500);
}

function start() {
  sequence = [];
  step = 0;
  startBtn.hidden = true;
  nextRound();
}

pads.forEach((p, i) => p.addEventListener('click', () => onPad(i)));
startBtn.addEventListener('click', start);
