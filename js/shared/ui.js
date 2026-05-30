/* ===========================================================
   ui.js — DOM helpers and shared feedback widgets.
   star burst, confetti, toast, modal, encouragement.
   =========================================================== */

import { playStar } from './sound.js';

/** Tiny DOM factory: el('div', {class:'x'}, [childNodes|strings]) */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign(node.style, v);
    } else if (v !== null && v !== undefined && v !== false) {
      node.setAttribute(k, v);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const PRAISE = [
  'Great job, Debbie!', 'Amazing!', 'You did it!', 'Brilliant!',
  'Superstar!', 'Wow, so clever!', 'Yay! Keep going!', 'Fantastic!',
  'You’re on fire!', 'Wonderful!',
];
const ENCOURAGE = [
  'So close — try again!', 'Almost! You’ve got this.',
  'Good try! Have another go.', 'Don’t give up!', 'Nearly there!',
];

export function pickEncouragement() {
  return ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
}
export function pickPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

/** Spawn animated ⭐ particles bursting from a screen point. */
export function starBurst(x, y, count = 8, withSound = true) {
  if (withSound) playStar();
  for (let i = 0; i < count; i++) {
    const s = el('span', { class: 'star-particle', text: '⭐' });
    const dx = (Math.random() - 0.5) * 160;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', dx + 'px');
    s.style.animationDelay = (Math.random() * 0.15) + 's';
    document.body.append(s);
    setTimeout(() => s.remove(), 1100);
  }
}

/** Burst stars from the centre of a given element. */
export function starBurstFrom(target, count = 8) {
  const r = target.getBoundingClientRect();
  starBurst(r.left + r.width / 2, r.top + r.height / 2, count);
}

const CONFETTI_COLORS = ['#AEDFF7', '#FFD1E8', '#FFA8D2', '#7FC6EE', '#E6D7FF', '#FFD86B'];

/** Light pastel confetti shower. */
export function confetti(amount = 80) {
  for (let i = 0; i < amount; i++) {
    const p = el('div', { class: 'confetti-piece' });
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const dur = 2.2 + Math.random() * 1.8;
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.append(p);
    setTimeout(() => p.remove(), (dur + 1) * 1000);
  }
}

/** Brief encouraging message at the bottom of the screen. */
export function toast(message) {
  const t = el('div', { class: 'toast', text: message });
  document.body.append(t);
  setTimeout(() => t.remove(), 2000);
}

/**
 * Show a modal dialog.
 * buttons: [{ label, primary, onClick }] — onClick runs then closes.
 * Returns a close() function.
 */
export function showModal({ title, body, buttons = [] }) {
  const backdrop = el('div', { class: 'modal-backdrop' });
  const close = () => backdrop.remove();

  const btnEls = buttons.map(b =>
    el('button', {
      class: 'btn ' + (b.primary ? 'btn-primary btn-lg' : ''),
      onClick: () => { close(); b.onClick && b.onClick(); },
    }, b.label)
  );

  const bodyNode = typeof body === 'string'
    ? el('p', { class: 'subtle', style: { fontSize: '1.15rem' } }, body)
    : body;

  const modal = el('div', { class: 'modal' }, [
    title ? el('h2', { class: 'title-gradient' }, title) : null,
    bodyNode,
    btnEls.length ? el('div', { class: 'modal-buttons' }, btnEls) : null,
  ]);

  backdrop.append(modal);
  document.body.append(backdrop);
  return close;
}
