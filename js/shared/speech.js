/* ===========================================================
   speech.js — SpeechSynthesis wrapper for the Spelling Bee.

   Browsers make text-to-speech surprisingly fiddly, so this
   handles the common gotchas:
   - voices often aren't ready on first call -> we load eagerly
     and refresh on the 'voiceschanged' event.
   - Chrome silently drops an utterance if speak() is called
     right after cancel() -> we add a tiny delay.
   - Chrome pauses long speech after ~15s -> we 'resume' on a
     timer while speaking.
   - first speech may need a user gesture -> we warm up on the
     first tap/keypress.
   =========================================================== */

const supported = 'speechSynthesis' in window;
let cachedVoices = [];
let lastText = '';
let resumeTimer = null;

function refreshVoices() {
  if (!supported) return;
  const v = speechSynthesis.getVoices();
  if (v && v.length) cachedVoices = v;
}

if (supported) {
  refreshVoices();
  speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  // Some browsers populate voices a moment late — nudge a few times.
  setTimeout(refreshVoices, 200);
  setTimeout(refreshVoices, 800);

  // Warm up the engine on the very first user gesture so the first
  // real word reliably plays (mobile autoplay policies).
  const warmUp = () => {
    refreshVoices();
    try { speechSynthesis.resume(); } catch (e) {}
    window.removeEventListener('pointerdown', warmUp);
    window.removeEventListener('keydown', warmUp);
  };
  window.addEventListener('pointerdown', warmUp);
  window.addEventListener('keydown', warmUp);
}

export function isSupported() { return supported; }

// Prefer a calm, natural, friendly English voice. Many platforms ship
// a nicer-sounding female/neural voice — pick those by name first.
const NICE_VOICES = [
  /google uk english female/i,
  /\bsamantha\b/i,        // macOS/iOS
  /\bkaren\b/i, /\bserena\b/i, /\bsonia\b/i, /\blibby\b/i, /\bsophie\b/i,
  /\baria\b/i, /\bjenny\b/i, /natural/i,   // Microsoft neural voices
  /google us english/i,
  /female/i,
];

function pickVoice() {
  const v = cachedVoices;
  if (!v.length) return null;
  const en = v.filter(x => /^en/i.test(x.lang));
  const pool = en.length ? en : v;
  for (const re of NICE_VOICES) {
    const match = pool.find(x => re.test(x.name));
    if (match) return match;
  }
  return (
    pool.find(x => /en-GB/i.test(x.lang)) ||
    pool.find(x => /en-US/i.test(x.lang)) ||
    pool[0]
  );
}

function stopKeepAlive() {
  if (resumeTimer) { clearInterval(resumeTimer); resumeTimer = null; }
}
function startKeepAlive() {
  stopKeepAlive();
  resumeTimer = setInterval(() => {
    if (!speechSynthesis.speaking) { stopKeepAlive(); return; }
    try { speechSynthesis.resume(); } catch (e) {}
  }, 4000);
}

/**
 * Speak text aloud. Returns a promise that resolves when finished
 * (or immediately if speech isn't supported).
 */
export function speak(text, { rate = 0.78, pitch = 0.95 } = {}) {
  return new Promise(resolve => {
    if (!supported) { resolve(); return; }
    lastText = text;

    try { speechSynthesis.cancel(); } catch (e) {}

    const fire = () => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) u.voice = voice;
        u.lang = (voice && voice.lang) || 'en-GB';
        u.rate = rate;
        u.pitch = pitch;
        u.onend = () => { stopKeepAlive(); resolve(); };
        u.onerror = () => { stopKeepAlive(); resolve(); };
        try { speechSynthesis.resume(); } catch (e) {}
        speechSynthesis.speak(u);
        startKeepAlive();
      } catch (e) {
        resolve();
      }
    };

    // Small delay sidesteps the Chrome cancel()+speak() race.
    setTimeout(fire, 70);
  });
}

/** Spell a word out letter by letter (e.g. for a hint). */
export function spellOut(text, opts = {}) {
  const letters = text.toUpperCase().split('').join(', ');
  return speak(letters, { rate: 0.7, ...opts });
}

/** Re-speak the last word. */
export function repeat(opts) {
  if (lastText) return speak(lastText, opts);
  return Promise.resolve();
}
