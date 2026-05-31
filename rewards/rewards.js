/* ===========================================================
   Rewards page — level/XP, play-streak calendar, daily challenge,
   lucky spin, achievements, sticker album.
   =========================================================== */

import { mountTopbar } from '../js/shared/topbar.js';
import { el, confetti, toast, showModal } from '../js/shared/ui.js';
import { playCoin, playWin, playStar } from '../js/shared/sound.js';
import {
  getLevel, getStreak, getDailyChallenge, canSpin, doSpin,
  getStickers, getAchievementsState,
} from '../js/shared/store.js';
import { STICKERS, STICKER_BY_ID, SPIN_WHEEL } from '../js/shared/progress-catalog.js';
import { GAMES } from '../js/shared/config.js';

const topbar = mountTopbar(document.getElementById('topbar'), '../index.html');
const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

/* ---------- Me: level + streak ---------- */
function drawMe() {
  const lv = getLevel();
  document.getElementById('lvl-num').textContent = lv.level;
  document.getElementById('lvl-title').textContent = lv.title;
  document.getElementById('xp-fill').style.width = Math.round(lv.progress * 100) + '%';
  document.getElementById('xp-text').textContent =
    lv.needed ? `${lv.into} / ${lv.needed} XP to Level ${lv.level + 1}` : 'Max level!';

  const st = getStreak();
  document.getElementById('streak-line').textContent =
    st.streak > 0 ? `${st.streak} day${st.streak > 1 ? 's' : ''} in a row! (best: ${st.best})`
                  : 'Play today to start a streak!';

  // last 14 days calendar
  const cal = document.getElementById('calendar');
  cal.innerHTML = '';
  const played = new Set(st.days);
  const todayStr = new Date().toISOString().slice(0, 10);
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const cell = el('div', { class: 'cal-cell' + (played.has(iso) ? ' played' : '') + (iso === todayStr ? ' today' : '') },
      played.has(iso) ? '⭐' : d.getDate().toString());
    cal.append(cell);
  }
}

/* ---------- Daily: challenge + spin ---------- */
function drawChallenge() {
  const ch = getDailyChallenge();
  const game = GAME_BY_ID[ch.gameId];
  const card = document.getElementById('challenge-card');
  card.innerHTML = '';
  card.append(
    el('div', { class: 'challenge-emoji' }, game ? game.emoji : '🎯'),
    el('div', { class: 'challenge-desc' }, ch.desc),
    ch.done
      ? el('div', { class: 'challenge-done' }, '✅ Done! +25 ⭐')
      : el('a', { class: 'btn btn-primary', href: game ? '../' + game.path : '#' }, '▶ Play now'),
  );
}

let wheelRotation = 0;
function buildWheel() {
  const wheel = document.getElementById('wheel');
  // place each prize label at the centre of its segment, measured CLOCKWISE
  // from the TOP (12 o'clock) — the same reference the pointer + landing math
  // use, so the label under the pointer always matches the prize awarded.
  SPIN_WHEEL.forEach((seg, i) => {
    const angle = i * 45 + 22.5;
    const text = seg.type === 'sticker' ? '🌟' : (seg.amount >= 50 ? '50⭐' : seg.amount + '⭐');
    const label = el('div', { class: 'wheel-seg' }, [el('span', {}, text)]);
    label.style.transform = `rotate(${angle}deg) translate(0, -82px) rotate(${-angle}deg)`;
    wheel.append(label);
  });
}

function drawSpin() {
  const btn = document.getElementById('spin-btn');
  const note = document.getElementById('spin-note');
  if (canSpin()) {
    btn.disabled = false;
    btn.textContent = 'Spin!';
    note.textContent = 'One free spin a day ✨';
  } else {
    btn.disabled = true;
    btn.textContent = 'Spun today ✓';
    note.textContent = 'Come back tomorrow for another spin!';
  }
}

function spin() {
  if (!canSpin()) return;
  const result = doSpin();
  if (!result) return;
  const btn = document.getElementById('spin-btn');
  btn.disabled = true;

  const wheel = document.getElementById('wheel');
  // land the chosen segment under the top pointer, after a few turns
  const targetWithin = 360 - (result.segment * 45 + 22.5);
  wheelRotation += 360 * 5 + (targetWithin - (wheelRotation % 360));
  wheel.style.transform = `rotate(${wheelRotation}deg)`;

  setTimeout(() => {
    playCoin();
    confetti(60);
    topbar.refreshStars();
    const prize = result.prize;
    let msg;
    if (prize.type === 'sticker') {
      msg = result.stickerId ? 'A new sticker for your album! 🌟' : 'A sticker (you had them all!) 🌟';
    } else {
      msg = `You won ${prize.amount} ⭐!`;
    }
    showModal({
      title: prize.amount >= 50 ? '🎉 JACKPOT!' : '🎁 You won!',
      body: msg,
      buttons: [{ label: 'Yay!', primary: true }],
    });
    drawSpin();
    drawStickers();
  }, 3500);
}

/* ---------- Trophies ---------- */
function drawTrophies() {
  const list = getAchievementsState();
  const earned = list.filter(a => a.earned).length;
  document.getElementById('ach-progress').textContent = `🏆 ${earned} of ${list.length} trophies earned`;
  const grid = document.getElementById('ach-grid');
  grid.innerHTML = '';
  for (const a of list) {
    grid.append(el('div', { class: 'ach-item ' + (a.earned ? 'earned' : 'locked') }, [
      el('div', { class: 'ach-emoji' }, a.earned ? a.emoji : '🔒'),
      el('div', { class: 'ach-name' }, a.name),
      el('div', { class: 'ach-desc' }, a.desc),
    ]));
  }
}

/* ---------- Stickers ---------- */
function drawStickers() {
  const owned = new Set(getStickers());
  document.getElementById('sticker-progress').textContent =
    `🌟 ${owned.size} of ${STICKERS.length} stickers collected`;
  const grid = document.getElementById('sticker-grid');
  grid.innerHTML = '';
  for (const st of STICKERS) {
    const has = owned.has(st.id);
    grid.append(el('div', { class: 'sticker-cell' + (has ? '' : ' missing') }, has ? st.emoji : '❓'));
  }
}

/* ---------- tabs ---------- */
function switchTab(name) {
  document.querySelectorAll('#tabs .chip').forEach(c => c.classList.toggle('active', c.dataset.tab === name));
  ['me', 'daily', 'trophies', 'stickers'].forEach(t => {
    document.getElementById('tab-' + t).hidden = t !== name;
  });
}
document.getElementById('tabs').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) switchTab(chip.dataset.tab);
});
document.getElementById('spin-btn').addEventListener('click', spin);

buildWheel();
drawMe();
drawChallenge();
drawSpin();
drawTrophies();
drawStickers();
