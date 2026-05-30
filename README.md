# Debbie's Game 🎮💖

A bright, cute collection of web games made for Debbie — a mix of **learning**
and **just-for-fun** games, wrapped in a baby-blue + baby-pink pastel arcade
with a star reward system. Works great on a tablet.

## 🎲 The games

| Game | Type | What you do |
|------|------|-------------|
| 🐝 **Spelling Bee** | Learn | Listen to a word (spoken aloud) and type how it's spelled. |
| ➕ **Maths Blaster** | Learn | Quick-fire add / take-away / times-tables against the clock. |
| 🍬 **Candy Match** | Fun | Swap sweets to match 3+ in a row, Candy-Crush style. |
| 🧠 **Memory Pairs** | Fun | Flip cards and find the matching pairs. |

Every game gives ⭐ stars that are saved between visits, plus happy sounds,
star bursts and confetti.

## ▶️ How to play it on your computer

The games use modern browser features, so they need to be opened through a
little local web server (just double-clicking `index.html` won't load the
games). The easiest way:

1. Open a terminal in this folder.
2. Run:
   ```
   python3 -m http.server 8000
   ```
3. Open your web browser and go to: **http://localhost:8000/**

That's it — pick a game and play!

> Tip: If you use VS Code, the free **Live Server** extension also works:
> right-click `index.html` → "Open with Live Server".

## ☁️ Putting it online (so Debbie can play anywhere)

It's a plain static website, so it's easy to host for free:

- **Netlify** (recommended): drag-and-drop this folder onto
  [app.netlify.com/drop](https://app.netlify.com/drop), or connect the repo.
  A `netlify.toml` is already included (no build step needed). You get an
  `https://` link, which is best for the talking Spelling Bee.
- **GitHub Pages**: enable Pages on the `main` branch (root). All links are
  relative, so it works under the `/Debbies-Game/` path.

## 🧩 Adding more games later

The structure makes new games easy:

1. Create a folder `games/<your-game>/` with its own `index.html` + script.
2. Reuse the shared helpers in `js/shared/` (stars, sounds, speech, popups).
3. Add one entry to the list in `js/shared/config.js` — the home screen will
   show a new card automatically.

Ideas for next time: Times-Tables Race, Word Match, Whack-a-Mole, Simon Says,
Snake, Bubble Pop.

## 📁 Project layout

```
index.html            Home screen (the hub)
css/                  Shared theme + hub styles
js/shared/            Reusable bits: store, sound, speech, ui, topbar, config
js/hub.js             Builds the home screen
games/                One folder per game
```

Made with 💖 for Debbie.
