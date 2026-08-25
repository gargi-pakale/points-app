# Which Card? — setup and handoff

Tells you which of your credit cards to use for a given purchase.
One HTML file, no build step, no framework, no CDN, no backend, no accounts.
Everything is stored in the browser on your own phone.

| File | Role |
|---|---|
| `index.html` | The whole app — markup, styles, logic, card data |
| `sw.js` | Service worker, offline cache. Bump `CACHE` on every release |
| `manifest.webmanifest` | Standalone display + icon |
| `icon-180.png`, `icon-512.png` | Home Screen icon |
| `artifact.html` | The same app with the page wrapper stripped, for previewing as a Claude Artifact. Not part of the deploy — regenerate it from `index.html` if the app changes |

Bump `APP_VERSION` in `index.html` and `CACHE` in `sw.js` together, or the phone
keeps serving the stale cached build. (Same trap as Ted Tracker.)

## Is a public repo safe here?

Yes, with one rule: **no personal numbers in the source.**

What is in these files is a list of card products and their published reward
rates — all of it already public on the issuers' own websites. There are no
account numbers, no card numbers, no logins, no API keys, no email addresses.
Nothing here could be used against you.

What must NOT go in is anything specific to you. Your rent was briefly
hardcoded as a default and has been removed — `rent` now ships as `0` and you
enter it on your phone, where it stays in that phone's local storage and is
never uploaded anywhere. Keep it that way. If you later add anything personal —
a real balance, a statement date, a credit limit — take it out before pushing,
or move the repo to private.

The one mild consideration left is that a public repo shows which six cards you
hold. That is not sensitive on its own, but if it bothers you the alternative is
a private repo, and GitHub Pages on a private repo needs a paid plan.

## Putting it on your phone

1. Create a **public** repo on github.com — suggested name `which-card`.
   See the section above for why public is fine here.
2. Upload `index.html`, `sw.js`, `manifest.webmanifest` and both `.png` icons
   to the repo root (drag and drop on github.com works).
3. Repo **Settings → Pages → Source: Deploy from a branch → main → / (root)**.
4. Wait about a minute, then open `https://<your-username>.github.io/which-card/`
   in Safari on your iPhone.
5. Share button → **Add to Home Screen**.

To release a change: replace the file on GitHub, bump the two version strings,
and Pages picks it up in about a minute.

## Reading the numbers

The big number is the rate the card itself quotes: **3x** for a points card,
**4.5%** for a cash-back card. The smaller grey number under it is what that is
worth in cash terms once points are valued, and that smaller number is what the
ranking actually sorts on. Bilt shows as **1x +4%** because it earns points and
Bilt Cash at the same time.

## Benefits that beat points

Some cards carry protections worth far more than any rewards difference, so the
app shows them as their own panel and marks one "worth more than the points"
when it should override the winner. Rental cars are the clearest case: both
Venture X (primary, up to $75,000) and Sapphire Preferred (primary, up to
$60,000) let you decline the rental counter's own waiver, which runs $15-30 a
day. No points rate comes close to that. Same logic puts the United Explorer
ahead on United flights for the free checked bag.

## Apple Pay vs swiping

No difference. Rewards follow the merchant's category code, which is a property
of the shop, not of how you paid. The one known oddity is that mobile-wallet
purchases at some drugstores have been seen coding as general merchandise
instead of drugstore. The in-person / online toggle in the app is about the
merchant, not the terminal.

## How the recommendation is calculated

For each category, every switched-on card is scored as:

    base or bonus multiplier  ×  relationship multiplier  ×  cents per point
                              −  any category processing fee

That gives one comparable "percent back" number for every card, so points and
cash back can be ranked against each other. Ties are broken by the smaller
annual fee, and flagged in the app as ties rather than hidden.

Everything in that formula is editable in the **My cards** tab.

## Decisions already made — don't relitigate without asking

- **Local only, on purpose.** No accounts, no server, no sync. The plan was
  always to live with it first and add logins later only if other people want
  it. Adding a backend later is additive, the same way it was for Ted Tracker.
- **No AI at runtime.** "Which card for groceries" is a table lookup with one
  right answer. A model in that path would add latency, cost and the occasional
  wrong answer at a checkout counter, and buy nothing.
- **Points are compared at transfer value by default**, not at 1¢. The button
  at the bottom of the cheat sheet flips the whole app to the conservative 1¢
  view, and any category where the winner changes between the two says so.
- **Rent carries a 3% processing fee** for every card except Bilt. Without that
  the app happily recommended Venture X for rent, which loses money.

## Where the rates came from

Every rate was taken from the issuer's own page (or the program terms) on
**25 August 2026**, and each card shows its source inside **My cards**. Rates
were not written from memory — an earlier version of this app was, and it was
wrong in several places.

Corrections that research turned up:

- **United Explorer earns 9x on United flights, not 2x**, since April 2026, and
  the annual fee went from $95 to $150 ($0 the first year). This makes it your
  best card by far for anything on United.
- **Sapphire Preferred was refreshed in June 2026** and now earns 3x on gas and
  EV charging and 3x on vacation rentals (Airbnb, Vrbo), neither of which it had
  before. It also earns 5x on Lyft through 30 September 2027.
- **Bilt Blue earns 1x on everyday spend.** It has no dining or travel bonus.
  It earns 3x on Lyft, but only if your Lyft account is linked with Bilt set as
  the active loyalty partner.

## Bilt Cash — what it actually is

Three passes to get this right, so it is worth writing down.

**Bilt Cash is not a statement credit and cannot be cashed out at face value.**
It is a book of monthly partner credits — GrubHub, Gopuff, Lyft, hotels,
Priority Pass, parking, Walgreens, SoulCycle and similar — each separately
capped, none rolling over month to month. Plus a conversion to rent points at
$30 per 1,000, capped at 1x your rent.

So a dollar of Bilt Cash is worth a full dollar only on spending you were going
to do at one of those partners anyway. The rent conversion is the dependable
floor at roughly 60 cents on the dollar, so **that is the default**, giving a
flat 2.33x up to `0.75 x rent` of monthly spending. The toggle in **My cards**
switches to the optimistic partner-credit view.

**Redeeming is manual either way.** Bilt Cash never converts itself. The whole
balance expires every 31 December with only $100 rolling over.

**Still unconfirmed:** whether the 4% earn rate is permanent or promotional.
Bilt's own terms pages are PDFs that neither render nor state it, and no
secondary source says either way. It would be in the cardholder agreement.

## The old Bilt Cash trap (superseded)

Bilt Cash is not cash back, which is the single most misleading thing about the
card. Its only use is unlocking points on rent or mortgage, at **$30 of Bilt
Cash per 1,000 points**. So a dollar of Bilt Cash is worth about 33 Bilt Points
— roughly 60 cents, not a dollar. That is why the app scores "4% Bilt Cash" as
about 2.4%, giving Bilt 4.2% on everyday spend rather than 5.8%.

It is also capped by your rent, because you can only unlock up to 1x of the
housing payment. The arithmetic:

    Bilt Cash your rent can absorb  =  rent / 33.33
    Spending needed to earn it      =  that / 4%   =  0.75 x rent

So $2,000 of rent absorbs $60 of Bilt Cash, which $1,500 of everyday spending
earns. **Past $1,500 in a month, Bilt is a plain 1x card and Venture X takes
over.** Enter your rent in **My cards** and the app works this out for you and
says the number out loud. There's a switch there for when you've used the
month's Bilt Cash up.

## Things to check on, with dates

- **Point values are still estimates.** The earn rates are sourced; what a point
  is *worth* is a judgement call. Chase, Bilt and Capital One are set to 1.8c
  and United to 1.3c, which assumes you transfer to partners. Amazon points are
  fixed at 1c by Amazon, so that one is exact. Tune them in **My cards**.
- **BofA relationship multiplier is 1.5, and is temporary.** Expected to drop to
  1.25 around **November 2026**. Change the one field and everything recalculates.
  Online shopping goes 4.5% -> 3.75%.
- **Sapphire Preferred's 5x on Lyft ends 30 September 2027.**
- **Rates go stale.** Nothing here phones home. Worth a look once or twice a year.
