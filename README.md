# Which Card?

Tells me which of my credit cards to use for a given purchase.

One HTML file. No build step, no framework, no CDN, no backend, no accounts,
no tracking. Settings stay in this browser's local storage and are not sent to
a server. Do not enter card numbers or account credentials.

Live at **https://gargi-pakale.github.io/points-app/** — open it in Safari and
Add to Home Screen to use it like an app.

## What's here

| File | Role |
|---|---|
| `index.html` | The whole app |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest` | Home Screen icon and standalone display |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | Icons |
| `tests/app.test.mjs` | Regression tests (`npm test`) |
| `SETUP.md` | How it works, where the rates came from, and what to re-check |

Reward rates were taken from each issuer's own page and are dated in
`SETUP.md`. They go stale — every rate is editable inside the app.

**Add a card** opens a searchable, phone-friendly library. Citi Strata Premier,
Chase Sapphire Reserve and Chase Freedom Unlimited are included as sourced
templates; typing a card's name (or “Citi Strata Primer”) filters to it and
one tap fills its rewards, fee, network and benefits. Cards without a sourced
template can still be added blank and edited in place.

The **Points** tab is a manual loyalty-wallet tracker inspired by dedicated
points apps, without connecting any accounts. Add a popular card, airline or
hotel program, enter its points and optional expiration date, and separately
track airline flight-credit dollars and their expiration. All balances start
empty and remain only in that browser's local storage.
