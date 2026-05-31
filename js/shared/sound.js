/* ===========================================================
   sound.js — tiny WebAudio sound manager (no audio files)
   Lazily creates the AudioContext on first user gesture so it
   works under mobile/tablet autoplay rules. Honors mute.
   =========================================================== */

import { isMuted } from './store.js';

let ctx = null;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

// Resume the context after a user gesture (needed on iOS/Safari).
function unlock() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}
window.addEventListener('pointerdown', unlock, { once: false });
window.addEventListener('keydown', unlock, { once: false });

/**
 * Play a single tone.
 * @param {number} freq  frequency in Hz
 * @param {number} start when to start (seconds, relative)
 * @param {number} dur   duration in seconds
 * @param {string} type  oscillator type
 * @param {number} vol   peak volume 0..1
 */
function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(notes) {
  if (isMuted()) return;
  ensureCtx();
  notes.forEach(n => tone(n.f, n.t, n.d, n.type, n.v));
}

// Friendly rising arpeggio
export function playCorrect() {
  play([
    { f: 523, t: 0,    d: 0.14, type: 'triangle', v: 0.2 },
    { f: 659, t: 0.1,  d: 0.14, type: 'triangle', v: 0.2 },
    { f: 784, t: 0.2,  d: 0.2,  type: 'triangle', v: 0.2 },
  ]);
}

// Gentle low "try again" blip — soft, never harsh for a child
export function playWrong() {
  play([
    { f: 300, t: 0,    d: 0.16, type: 'sine', v: 0.16 },
    { f: 240, t: 0.12, d: 0.2,  type: 'sine', v: 0.16 },
  ]);
}

// Sparkle for a star
export function playStar() {
  play([
    { f: 880,  t: 0,    d: 0.08, type: 'triangle', v: 0.16 },
    { f: 1320, t: 0.06, d: 0.12, type: 'triangle', v: 0.14 },
  ]);
}

// Little win fanfare
export function playWin() {
  play([
    { f: 523, t: 0,    d: 0.16, type: 'triangle', v: 0.2 },
    { f: 659, t: 0.14, d: 0.16, type: 'triangle', v: 0.2 },
    { f: 784, t: 0.28, d: 0.16, type: 'triangle', v: 0.2 },
    { f: 1047, t: 0.42, d: 0.3, type: 'triangle', v: 0.22 },
  ]);
}

// Candy clear pop
export function playPop() {
  play([{ f: 660, t: 0, d: 0.09, type: 'square', v: 0.12 }]);
}

// Soft tap/click
export function playTap() {
  play([{ f: 520, t: 0, d: 0.05, type: 'sine', v: 0.1 }]);
}

// Generic single note (used by Simon Says pads)
export function playFreq(freq, dur = 0.35) {
  play([{ f: freq, t: 0, d: dur, type: 'sine', v: 0.2 }]);
}

// Cha-ching! coin sound for purchases
export function playCoin() {
  play([
    { f: 988,  t: 0,    d: 0.09, type: 'square', v: 0.14 },
    { f: 1319, t: 0.07, d: 0.16, type: 'square', v: 0.14 },
    { f: 1760, t: 0.15, d: 0.18, type: 'triangle', v: 0.12 },
  ]);
}
