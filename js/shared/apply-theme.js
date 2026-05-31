/* ===========================================================
   apply-theme.js — applies the saved colour theme to :root.
   Imported by ui.js (which every page loads), so the chosen
   theme recolours the whole app automatically on every page.
   =========================================================== */

import { getShop } from './store.js';
import { THEME_BY_ID } from './shop-catalog.js';

/** Apply a theme's palette variables to the document root. */
export function applyTheme(id) {
  const theme = THEME_BY_ID[id] || THEME_BY_ID.default;
  if (!theme) return;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) {
    root.style.setProperty(k, v);
  }
}

/** Apply whatever theme is saved in the shop state. */
export function applySavedTheme() {
  try {
    applyTheme(getShop().theme || 'default');
  } catch (e) { /* ignore — fall back to CSS defaults */ }
}

// Side effect: apply on import so colours are right before paint.
applySavedTheme();
