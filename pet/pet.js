/* ===========================================================
   Star Shop — adopt a pet, dress it up, feed it. Spend stars.
   =========================================================== */

import { mountTopbar } from '../js/shared/topbar.js';
import { el, showModal, starBurstFrom, toast, confetti, pickPraise } from '../js/shared/ui.js';
import { getStars, spendStars, getShop, saveShop } from '../js/shared/store.js';
import { playStar, playCoin, playCorrect, playWrong } from '../js/shared/sound.js';
import { renderPet } from '../js/shared/pet-render.js';
import { applyTheme } from '../js/shared/apply-theme.js';
import {
  PETS, ACCESSORIES, SLOTS, SLOT_LABELS, PET_BY_ID, ITEM_BY_ID, THEMES,
} from '../js/shared/shop-catalog.js';

const FEED_COST = 3;
const topbar = mountTopbar(document.getElementById('topbar'), '../index.html');

let shop = getShop();

const petDisplay = document.getElementById('pet-display');
const miniPet = document.getElementById('mini-pet');
const petNameEl = document.getElementById('pet-name');
const happyFill = document.getElementById('happy-fill');
const petHint = document.getElementById('pet-hint');
const adoptGrid = document.getElementById('adopt-grid');
const dressGroups = document.getElementById('dress-groups');

/* ---------- helpers ---------- */
function persist() { saveShop(shop); }

function canAfford(cost) { return getStars() >= cost; }

/** Confirm + charge stars, run onYes if bought. */
function buy(name, cost, btn, onYes) {
  if (!canAfford(cost)) {
    playWrong();
    toast(`You need ${cost - getStars()} more ⭐!`);
    return;
  }
  showModal({
    title: `Buy ${name}?`,
    body: `It costs ${cost} ⭐. You have ${getStars()} ⭐.`,
    buttons: [
      {
        label: `Buy for ${cost} ⭐`, primary: true, onClick: () => {
          if (spendStars(cost)) {
            onYes();
            persist();
            playCoin();
            if (btn) starBurstFrom(btn, 8);
            topbar.refreshStars();
            toast(pickPraise());
            refreshAll();
          }
        },
      },
      { label: 'Maybe later' },
    ],
  });
}

/* ---------- My Pet tab ---------- */
function drawPet() {
  petDisplay.innerHTML = '';
  petDisplay.append(renderPet(shop, 130));

  const pet = shop.pet ? PET_BY_ID[shop.pet] : null;
  petNameEl.textContent = pet ? (shop.petName || pet.name) : '';
  document.getElementById('rename-btn').style.display = pet ? '' : 'none';
  happyFill.style.width = (shop.happiness || 0) + '%';

  const feedBtn = document.getElementById('feed-btn');
  if (!pet) {
    petHint.textContent = 'Go to the 🏡 Adopt tab to choose your first pet (the chick is free!).';
    feedBtn.style.display = 'none';
  } else {
    petHint.textContent = '';
    feedBtn.style.display = '';
  }
}

function feed() {
  if (!shop.pet) return;
  if ((shop.happiness || 0) >= 100) {
    toast('Your pet is super happy! 😍');
    return;
  }
  if (!spendStars(FEED_COST)) {
    playWrong();
    toast(`You need ${FEED_COST - getStars()} more ⭐!`);
    return;
  }
  shop.happiness = Math.min(100, (shop.happiness || 0) + 12);
  persist();
  topbar.refreshStars();
  playCorrect();

  // floating food + happy wiggle
  const food = el('div', { class: 'food-float' }, '🍎');
  const r = petDisplay.getBoundingClientRect();
  food.style.left = (r.width / 2 - 16) + 'px';
  food.style.top = (r.height / 2) + 'px';
  petDisplay.style.position = 'relative';
  petDisplay.append(food);
  setTimeout(() => food.remove(), 1000);

  const stage = petDisplay.querySelector('.pet-stage');
  if (stage) { stage.classList.add('wiggle'); setTimeout(() => stage.classList.remove('wiggle'), 500); }

  happyFill.style.width = shop.happiness + '%';
  if (shop.happiness >= 100) { confetti(40); toast('Your pet is super happy! 😍'); }
}

function rename() {
  const pet = shop.pet ? PET_BY_ID[shop.pet] : null;
  if (!pet) return;
  const input = el('input', {
    type: 'text', maxlength: '14',
    value: shop.petName || pet.name,
    style: {
      fontFamily: "'Fredoka', sans-serif", fontSize: '1.4rem', textAlign: 'center',
      width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
      border: '3px solid var(--lilac)', outline: 'none',
    },
  });
  showModal({
    title: 'Name your pet',
    body: input,
    buttons: [
      {
        label: 'Save', primary: true, onClick: () => {
          const v = input.value.trim().slice(0, 14);
          shop.petName = v || pet.name;
          persist();
          drawPet();
          drawHubMini();
          toast('Lovely name! 💖');
        },
      },
      { label: 'Cancel' },
    ],
  });
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

/* ---------- Adopt tab ---------- */
function drawAdopt() {
  adoptGrid.innerHTML = '';
  for (const pet of PETS) {
    const isOwned = shop.ownedPets.includes(pet.id);
    const isCurrent = shop.pet === pet.id;

    let action;
    if (isCurrent) {
      action = el('div', { class: 'item-action is-current' }, '✔ Wearing');
    } else if (isOwned) {
      action = el('button', {
        class: 'item-action is-choose',
        onClick: () => { shop.pet = pet.id; persist(); toast(`${shop.petName || pet.name} chosen!`); refreshAll(); switchTab('pet'); },
      }, 'Choose');
    } else if (pet.cost === 0) {
      action = el('button', {
        class: 'item-action is-choose',
        onClick: (e) => {
          shop.ownedPets.push(pet.id);
          shop.pet = pet.id;
          if (!shop.petName) shop.petName = pet.name;
          persist();
          starBurstFrom(e.currentTarget, 8);
          playStar();
          toast(`You adopted ${pet.name}! 💖`);
          refreshAll();
          switchTab('pet');
        },
      }, 'Adopt FREE');
    } else {
      action = el('button', {
        class: 'item-action is-cost' + (canAfford(pet.cost) ? '' : ' cant'),
        onClick: (e) => buy(pet.name, pet.cost, e.currentTarget, () => {
          shop.ownedPets.push(pet.id);
          shop.pet = pet.id;
          if (!shop.petName) shop.petName = pet.name;
        }),
      }, `${pet.cost} ⭐`);
    }

    adoptGrid.append(el('div', { class: 'shop-item' + (isCurrent ? ' equipped' : isOwned ? ' owned' : '') }, [
      el('div', { class: 'item-emoji' }, pet.emoji),
      el('div', { class: 'item-name' }, pet.name),
      action,
    ]));
  }
}

/* ---------- Dress Up tab ---------- */
function drawDress() {
  miniPet.innerHTML = '';
  miniPet.append(renderPet(shop, 90));

  dressGroups.innerHTML = '';
  if (!shop.pet) {
    dressGroups.append(el('p', { class: 'subtle' }, 'Adopt a pet first, then come back to dress it up! 🐾'));
    return;
  }

  for (const slot of SLOTS) {
    const items = ACCESSORIES.filter(a => a.slot === slot);
    const grid = el('div', { class: 'shop-grid' });
    for (const item of items) {
      const isOwned = shop.ownedItems.includes(item.id);
      const isEquipped = shop.equipped[slot] === item.id;

      let action;
      if (isEquipped) {
        action = el('button', {
          class: 'item-action is-equipped',
          onClick: () => { delete shop.equipped[slot]; persist(); refreshAll(); },
        }, '✔ On — tap to remove');
      } else if (isOwned) {
        action = el('button', {
          class: 'item-action is-equip',
          onClick: () => { shop.equipped[slot] = item.id; persist(); playStar(); refreshAll(); },
        }, 'Wear it');
      } else {
        action = el('button', {
          class: 'item-action is-cost' + (canAfford(item.cost) ? '' : ' cant'),
          onClick: (e) => buy(item.name, item.cost, e.currentTarget, () => {
            shop.ownedItems.push(item.id);
            shop.equipped[slot] = item.id; // auto-wear on purchase
          }),
        }, `${item.cost} ⭐`);
      }

      const preview = item.css
        ? (() => { const s = el('div', { class: 'item-swatch' }); s.style.background = item.color; return s; })()
        : el('div', { class: 'item-emoji' }, item.emoji);

      grid.append(el('div', { class: 'shop-item' + (isEquipped ? ' equipped' : isOwned ? ' owned' : '') }, [
        preview,
        el('div', { class: 'item-name' }, item.name),
        action,
      ]));
    }
    dressGroups.append(el('div', { class: 'dress-group' }, [
      el('h3', {}, SLOT_LABELS[slot]),
      grid,
    ]));
  }
}

/* keep the hub mini pet (if this were embedded) — no-op placeholder for rename reuse */
function drawHubMini() { /* hub re-reads on its own load */ }

/* ---------- Themes tab ---------- */
const themeGrid = document.getElementById('theme-grid');
function drawThemes() {
  themeGrid.innerHTML = '';
  for (const theme of THEMES) {
    const isOwned = shop.ownedThemes.includes(theme.id);
    const isCurrent = shop.theme === theme.id;

    const swatch = el('div', { class: 'item-swatch theme-swatch' });
    swatch.style.background = theme.vars['--grad-soft'];
    swatch.style.borderColor = theme.vars['--pink-deep'];

    let action;
    if (isCurrent) {
      action = el('div', { class: 'item-action is-current' }, '✔ Using');
    } else if (isOwned) {
      action = el('button', {
        class: 'item-action is-choose',
        onClick: () => { shop.theme = theme.id; persist(); applyTheme(theme.id); refreshAll(); },
      }, 'Use it');
    } else {
      action = el('button', {
        class: 'item-action is-cost' + (canAfford(theme.cost) ? '' : ' cant'),
        onClick: (e) => buy(theme.name + ' theme', theme.cost, e.currentTarget, () => {
          shop.ownedThemes.push(theme.id);
          shop.theme = theme.id;
          applyTheme(theme.id);
        }),
      }, `${theme.cost} ⭐`);
    }

    themeGrid.append(el('div', { class: 'shop-item' + (isCurrent ? ' equipped' : isOwned ? ' owned' : '') }, [
      el('div', { class: 'item-emoji' }, theme.emoji),
      swatch,
      el('div', { class: 'item-name' }, theme.name),
      action,
    ]));
  }
}

function refreshAll() {
  shop = getShop();         // re-read to stay in sync
  drawPet();
  drawAdopt();
  drawDress();
  drawThemes();
}

/* ---------- tabs ---------- */
function switchTab(name) {
  document.querySelectorAll('#tabs .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.tab === name));
  document.getElementById('tab-pet').hidden = name !== 'pet';
  document.getElementById('tab-adopt').hidden = name !== 'adopt';
  document.getElementById('tab-dress').hidden = name !== 'dress';
  document.getElementById('tab-theme').hidden = name !== 'theme';
}
document.getElementById('tabs').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) switchTab(chip.dataset.tab);
});

document.getElementById('feed-btn').addEventListener('click', feed);
document.getElementById('rename-btn').addEventListener('click', rename);

refreshAll();
