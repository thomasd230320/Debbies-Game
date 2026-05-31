/* ===========================================================
   pet-render.js — draws the current pet wearing its accessories.
   Shared so the hub and the shop page look identical.
   Layered emoji: pet in the middle, accessories positioned by slot.
   =========================================================== */

import { el } from './ui.js';
import { PET_BY_ID, ITEM_BY_ID, SLOTS } from './shop-catalog.js';
import { getLevel } from './store.js';

// pet grows with player level: bigger + a sparkle aura at higher stages
function petStage() {
  const lvl = getLevel().level;
  if (lvl >= 8) return 3;
  if (lvl >= 4) return 2;
  return 1;
}

/**
 * Build a pet display element.
 * @param {object} shop   the shop state from getShop()
 * @param {number} size   pet emoji size in px
 * @returns {HTMLElement}
 */
export function renderPet(shop, size = 120) {
  const stageNum = petStage();
  const grow = stageNum === 3 ? 1.25 : stageNum === 2 ? 1.12 : 1;
  const stage = el('div', { class: 'pet-stage pet-grow-' + stageNum });
  stage.style.setProperty('--pet-size', Math.round(size * grow) + 'px');

  const pet = shop && shop.pet ? PET_BY_ID[shop.pet] : null;
  if (!pet) {
    stage.append(el('div', { class: 'pet-empty' }, '➕'));
    stage.classList.add('is-empty');
    return stage;
  }

  stage.append(el('div', { class: 'pet-base' }, pet.emoji));

  const eq = shop.equipped || {};
  for (const slot of SLOTS) {
    const item = eq[slot] ? ITEM_BY_ID[eq[slot]] : null;
    if (!item) continue;
    if (item.css) {
      // CSS-drawn accessory (collar / lead) — no emoji, colour via variable
      const acc = el('div', { class: `pet-acc ${slot}` });
      acc.style.setProperty('--acc-color', item.color);
      stage.append(acc);
    } else {
      stage.append(el('div', { class: `pet-acc ${slot}` }, item.emoji));
    }
  }
  return stage;
}
