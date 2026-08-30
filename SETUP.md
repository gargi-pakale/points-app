# Which Card? — setup and handoff

Tells you which of your credit cards to use for a given purchase.
One HTML file, no build step, no framework, no CDN, no backend, no accounts.
Settings are stored locally in the browser. GitHub Pages uses one storage origin
per username, so other apps under `gargi-pakale.github.io` technically share
that origin. Never store card numbers, logins or account details here.

| File | Role |
|---|---|
| `index.html` | The whole app — markup, styles, logic, card data |
| `sw.js` | Service worker, offline cache. Bump `CACHE` on every release |
| `manifest.webmanifest` | Standalone display + icon |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | Home Screen and PWA icons |
| `tests/app.test.mjs` | Reward, search, migration and safety regressions |

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
2. Upload `index.html`, `sw.js`, `manifest.webmanifest` and all three `.png` icons
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
Venture X (primary, up to $75,000), Sapphire Preferred (primary, up to
$60,000) and Bilt Blue (primary MasterRental; check the current benefits guide
for limits) can let you decline the rental counter's collision waiver. The app
puts Venture X first and Sapphire second for a normal eligible rental. The same
logic can put United Explorer ahead on United flights when its checked-bag
benefit applies.

## Apple Pay vs swiping

Normally no difference. Rewards follow the merchant's category code and the
transaction data supplied by the merchant. The in-person / online toggle is
about where the transaction occurs, not whether the card is tapped or swiped.

## How the recommendation is calculated

For each category, every switched-on card is scored as:

    base or bonus multiplier  ×  relationship multiplier  ×  cents per point
                              −  processing and foreign transaction fees

That gives one comparable "percent back" number for every card, so points and
cash back can be ranked against each other. Ties are broken by the smaller
annual fee, and flagged in the app as ties rather than hidden.

Issuer-portal eligibility, card-network acceptance, the BofA quarterly cap and
travel-protection overrides are applied separately. Personal values and most
card fields are editable in **My cards**.

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

Every rate was taken from the issuer's own page or program terms and rechecked
on **29 August 2026**. Each card shows its source inside **My cards**. Rates
were not written from memory — an earlier version of this app was, and it was
wrong in several places.

Important distinctions:

- **United Explorer contributes 3x**, not 9x, on eligible United purchases.
  United's 9x headline includes 6x fare miles earned as a MileagePlus member
  regardless of which card pays; those 6x cannot influence the card choice.
- **Sapphire Preferred was refreshed in June 2026** and now earns 3x on gas and
  EV charging and 3x on vacation rentals (Airbnb, Vrbo), neither of which it had
  before. It also earns 5x on Lyft through 30 September 2027.
- **Issuer portals are separate categories.** Chase rates apply only through
  Chase Travel, Capital One rates only through Capital One Travel, and Bilt
  rates only through Bilt Travel.
- **Bilt Blue earns 4x at participating Bilt Dining restaurants, 3x on hotels
  through Bilt Travel, 2x on flights through Bilt Travel and 3x on linked Lyft.**
- **BofA's 3% choice category and 2% grocery/wholesale category share the first
  $2,500 of eligible purchases each quarter.** The app has a spend tracker and
  switches affected categories to the base rate when exhausted.

## Bilt Cash — what it actually is

The card has two mutually exclusive reward options, selected in the Bilt app:

- **Flexible:** everyday spend earns 1 Bilt Point plus 4% Bilt Cash. Bilt Cash
  can be manually redeemed at **$3 for 100 housing points**, up to 1 point per
  $1 of housing paid, or used for available partner redemptions. It never
  converts automatically.
- **Housing-only:** everyday spend earns the normal 1x and no 4% Bilt Cash.
  Housing earns 0.5x at a 25% everyday-spend ratio, 0.75x at 50%, 1x at 75%,
  and 1.25x at 100%. Below 25%, the account receives a 250-point floor.

Under Flexible, converting to housing points makes the marginal everyday-spend
rate 2.33x until the housing ceiling is full. With no housing amount entered,
the app correctly counts that conversion as zero and shows Bilt's normal 1x.

It is also capped by your rent, because you can only unlock up to 1x of the
housing payment. The arithmetic:

    Bilt Cash your rent can absorb  =  rent / 33.33
    Spending needed to earn it      =  that / 4%   =  0.75 x rent

So $2,000 of housing absorbs $60 of Bilt Cash, which $1,500 of everyday spending
earns. Past that point, additional spending earns the normal card rate unless
you value another available Bilt Cash redemption.

## Verification

Run `npm test` before publishing. The suite covers United, both Bilt options,
the BofA cap, Costco network acceptance, issuer portals, merchant search,
foreign fees, migrations, empty-card persistence, rental priorities and HTML
escaping.

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
