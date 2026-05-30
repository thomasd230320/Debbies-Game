/* ===========================================================
   hub.js — builds the home screen from the game registry.
   =========================================================== */

import { GAMES } from './shared/config.js';
import { getStars, isMuted, toggleMuted, getShop, claimDailyBonus, getDaily } from './shared/store.js';
import { el, toast, confetti } from './shared/ui.js';
import { playTap, playStar } from './shared/sound.js';
import { renderPet } from './shared/pet-render.js';
import { PET_BY_ID } from './shared/shop-catalog.js';

// daily welcome bonus (once per calendar day)
const dailyBonus = claimDailyBonus(10);

// total stars
const starTotalEl = document.getElementById('star-total');
starTotalEl.textContent = getStars().toString();

// header extras: streak chip + spend nudge, injected after the controls row
const controls = document.querySelector('.hub-controls');
const daily = getDaily();
if (daily.learnStreak >= 2) {
  controls.append(el('div', { class: 'streak-chip' }, `🔥 ${daily.learnStreak}-day learning streak!`));
}
if (getStars() >= 30) {
  controls.append(el('a', { class: 'nudge-chip', href: 'pet/index.html' },
    `💰 You've got ${getStars()} ⭐ — go spend them!`));
}

// show the daily bonus once the page is up
if (dailyBonus > 0) {
  setTimeout(() => {
    playStar();
    confetti(40);
    toast(`🎁 Welcome back! Daily bonus +${dailyBonus} ⭐`);
  }, 400);
}

// pet companion (her dressed-up pet, or an adopt prompt)
const shop = getShop();
const companion = document.getElementById('pet-companion');
companion.append(renderPet(shop, 92));
const petLabel = shop.pet
  ? (shop.petName || PET_BY_ID[shop.pet]?.name || 'My Pet')
  : 'Adopt a pet!';
companion.append(el('div', { class: 'pet-label' }, petLabel));

// game cards
const grid = document.getElementById('game-grid');
for (const g of GAMES) {
  const card = el('a', {
    class: `game-card accent-${g.accent}`,
    href: g.path,
    onClick: () => playTap(),
  }, [
    el('div', { class: 'emoji' }, g.emoji),
    el('div', { class: 'name' }, g.title),
    el('div', { class: 'blurb' }, g.blurb),
    el('div', { class: 'tag ' + (g.learning ? 'learn' : 'fun') }, g.learning ? 'Learn' : 'Fun'),
  ]);
  grid.append(card);
}

// mute toggle
const muteBtn = document.getElementById('mute-toggle');
function paintMute() {
  muteBtn.textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on';
}
paintMute();
muteBtn.addEventListener('click', () => { toggleMuted(); paintMute(); });
