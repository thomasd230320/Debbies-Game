/* ===========================================================
   speech.js — SpeechSynthesis wrapper for the Spelling Bee.
   Handles the "voices not loaded yet" race and picks a clear
   English voice. Slightly slowed for a young child.
   =========================================================== */

let voicesReady = null;
let lastText = '';

function loadVoices() {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise(resolve => {
    if (!('speechSynthesis' in window)) { resolve([]); return; }
    const existing = speechSynthesis.getVoices();
    if (existing && existing.length) { resolve(existing); return; }
    const onChange = () => {
      const v = speechSynthesis.getVoices();
      if (v && v.length) {
        speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve(v);
      }
    };
    speechSynthesis.addEventListener('voiceschanged', onChange);
    // Safety timeout in case the event never fires
    setTimeout(() => resolve(speechSynthesis.getVoices() || []), 1200);
  });
  return voicesReady;
}

function pickVoice(voices) {
  if (!voices.length) return null;
  // Prefer a clear English voice; en-GB then en-US then any en.
  const byLang = (pred) => voices.find(pred);
  return (
    byLang(v => /en-GB/i.test(v.lang)) ||
    byLang(v => /en-US/i.test(v.lang)) ||
    byLang(v => /^en/i.test(v.lang)) ||
    voices[0]
  );
}

export function isSupported() {
  return 'speechSynthesis' in window;
}

/**
 * Speak text aloud. Returns a promise that resolves when done.
 */
export async function speak(text, { rate = 0.9, pitch = 1.05 } = {}) {
  if (!isSupported()) return;
  lastText = text;
  const voices = await loadVoices();
  return new Promise(resolve => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voices);
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-GB';
      u.rate = rate;
      u.pitch = pitch;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    } catch (e) {
      resolve();
    }
  });
}

/** Spell a word out letter by letter (e.g. for a hint). */
export async function spellOut(text, opts = {}) {
  const letters = text.toUpperCase().split('').join(', ');
  return speak(letters, { rate: 0.8, ...opts });
}

/** Re-speak the last word. */
export function repeat(opts) {
  if (lastText) return speak(lastText, opts);
}
