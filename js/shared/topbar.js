/* ===========================================================
   topbar.js — builds the shared top bar used on every game page:
   🏠 Home button | star counter | 🔊/🔇 mute toggle.
   =========================================================== */

import { el } from './ui.js';
import { getStars, isMuted, toggleMuted } from './store.js';

/**
 * Mount a topbar into `container`.
 * @param {HTMLElement} container
 * @param {string} homeHref relative path back to the hub
 * @returns {{ refreshStars: () => void }}
 */
export function mountTopbar(container, homeHref = '../../index.html') {
  const starEl = el('span', {}, getStars().toString());
  const counter = el('div', { class: 'star-counter' }, ['⭐', starEl]);

  const muteBtn = el('button', {
    class: 'icon-btn',
    'aria-label': 'Sound on or off',
    onClick: () => {
      const muted = toggleMuted();
      muteBtn.textContent = muted ? '🔇' : '🔊';
    },
  }, isMuted() ? '🔇' : '🔊');

  const home = el('a', { class: 'home-btn', href: homeHref }, ['🏠', ' Home']);

  const bar = el('div', { class: 'topbar' }, [
    home,
    el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } }, [counter, muteBtn]),
  ]);

  container.append(bar);

  return {
    refreshStars() { starEl.textContent = getStars().toString(); },
  };
}
