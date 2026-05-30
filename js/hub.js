/* ===========================================================
   hub.js — builds the home screen from the game registry.
   =========================================================== */

import { GAMES } from './shared/config.js';
import { getStars, isMuted, toggleMuted } from './shared/store.js';
import { el } from './shared/ui.js';
import { playTap } from './shared/sound.js';

// total stars
document.getElementById('star-total').textContent = getStars().toString();

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
