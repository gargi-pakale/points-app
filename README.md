# Which Card?

Tells me which of my credit cards to use for a given purchase.

One HTML file. No build step, no framework, no CDN, no backend, no accounts,
no tracking. Everything you enter stays in your own browser's local storage.

Live at **https://gargi-pakale.github.io/points-app/** — open it in Safari and
Add to Home Screen to use it like an app.

## What's here

| File | Role |
|---|---|
| `index.html` | The whole app |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest` | Home Screen icon and standalone display |
| `icon-180.png`, `icon-512.png` | Icons |
| `SETUP.md` | How it works, where the rates came from, and what to re-check |

Adding a card pulls it from a built-in catalog of about thirty common US cards,
so it arrives knowing what it earns instead of as a blank 1x.

Reward rates for the cards it ships with were taken from each issuer's own page
and are dated in `SETUP.md`. They go stale — every rate is editable inside the
app.

Sharing the link is fine: everything lives in whichever browser opens it, so a
friend gets their own private copy and their own cards.
