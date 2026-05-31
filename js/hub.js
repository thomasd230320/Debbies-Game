/* ===========================================================
   hub.js — builds the home screen from the game registry.
   =========================================================== */

import { GAMES } from './shared/config.js';
import {
  getStars, isMuted, toggleMuted, claimDailyBonus, getDaily,
  getLevel, pollLevelUp, getStreak, canSpin, getDailyChallenge,
} from './shared/store.js';
import { el, toast, confetti } from './shared/ui.js';
import { playTap, playStar } from './shared/sound.js';
import { renderPet } from './shared/pet-render.js';
import { getShop } from './shared/store.js';
import { PET_BY_ID } from './shared/shop-catalog.js';

// daily welcome bonus (once per calendar day)
const dailyBonus = claimDailyBonus(10);

// total stars
const starTotalEl = document.getElementById('star-total');
starTotalEl.textContent = getStars().toString();

// level strip
const lv = getLevel();
document.getElementById('level-pill').textContent = 'Lv ' + lv.level;
document.getElementById('level-title-mini').textContent = lv.title;
document.getElementById('level-bar-fill').style.width = Math.round(lv.progress * 100) + '%';

// pet companion (her dressed-up pet, or an adopt prompt)
const shop = getShop();
const companion = document.getElementById('pet-companion');
companion.append(renderPet(shop, 92));
const petLabel = shop.pet
  ? (shop.petName || PET_BY_ID[shop.pet]?.name || 'My Pet')
  : 'Adopt a pet!';
companion.append(el('div', { class: 'pet-label' }, petLabel));

// header extras: streak chip + nudges
const controls = document.querySelector('.hub-controls');
const daily = getDaily();
const streak = getStreak();
if (streak.streak >= 2) {
  controls.append(el('div', { class: 'streak-chip' }, `🔥 ${streak.streak}-day streak!`));
}
if (canSpin()) {
  controls.append(el('a', { class: 'nudge-chip', href: 'rewards/index.html' }, '🎡 Daily spin ready!'));
}
const challenge = getDailyChallenge();
if (challenge && !challenge.done) {
  controls.append(el('a', { class: 'nudge-chip', href: 'rewards/index.html' }, `🎯 ${challenge.desc}`));
}
if (getStars() >= 30) {
  controls.append(el('a', { class: 'nudge-chip', href: 'pet/index.html' },
    `💰 ${getStars()} ⭐ to spend!`));
}

// celebrate any pending level-up + the daily bonus
setTimeout(() => {
  const newLevel = pollLevelUp();
  if (newLevel) {
    confetti(60);
    playStar();
    toast(`⬆️ Level ${newLevel} — ${getLevel().title}!`);
  }
  if (dailyBonus > 0) {
    setTimeout(() => { playStar(); confetti(40); toast(`🎁 Welcome back! Daily bonus +${dailyBonus} ⭐`); }, newLevel ? 1800 : 0);
  }
}, 400);

// pet companion (her dressed-up pet, or an adopt prompt)
const shop = getShop();
const companion = document.getElementById('pet-companion');
companion.append(renderPet(shop, 92));
const petLabel = shop.pet
  ? (shop.petName || PET_BY_ID[shop.pet]?.name || 'My Pet')
  : 'Adopt a pet!';
companion.append(el('div', { class: 'pet-label' }, petLabel));

// game cards (some fun games unlock once enough stars have been earned)
const lifetimeXp = lv.xp;
const grid = document.getElementById('game-grid');
for (const g of GAMES) {
  const locked = g.unlockAtXp && lifetimeXp < g.unlockAtXp;
  if (locked) {
    grid.append(el('div', { class: `game-card accent-${g.accent} locked` }, [
      el('div', { class: 'emoji' }, '🔒'),
      el('div', { class: 'name' }, g.title),
      el('div', { class: 'blurb' }, `Unlock at ${g.unlockAtXp} ⭐ earned`),
      el('div', { class: 'lock-progress' }, `${Math.min(lifetimeXp, g.unlockAtXp)} / ${g.unlockAtXp}`),
    ]));
    continue;
  }
  grid.append(el('a', {
    class: `game-card accent-${g.accent}`,
    href: g.path,
    onClick: () => playTap(),
  }, [
    el('div', { class: 'emoji' }, g.emoji),
    el('div', { class: 'name' }, g.title),
    el('div', { class: 'blurb' }, g.blurb),
    el('div', { class: 'tag ' + (g.learning ? 'learn' : 'fun') }, g.learning ? 'Learn' : 'Fun'),
  ]));
}

// mute toggle
const muteBtn = document.getElementById('mute-toggle');
function paintMute() {
  muteBtn.textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on';
}
paintMute();
muteBtn.addEventListener('click', () => { toggleMuted(); paintMute(); });
