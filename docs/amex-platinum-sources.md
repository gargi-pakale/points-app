# U.S. Consumer Platinum implementation review

Checked November 1, 2026. Applies to the paid Additional Platinum and Primary Platinum, not Companion, Business, Corporate or co-branded cards.

## Official sources

- [Detailed travel earning terms](https://www.americanexpress.com/en-us/travel/platinum-card-hotel-programs/) — “5X Membership Rewards Points for Platinum Card” includes both the 5x and 2x rules. The implementation uses this detailed eligibility text.
- [Airbnb](https://www.americanexpress.com/en-us/travel/airbnb/) — confirms prepaid Airbnb through the Amex website/app.
- [Consumer Platinum](https://www.americanexpress.com/us/credit-cards/card/platinum/) — fees, foreign fees, travel and purchase protections.
- [Additional Platinum guide](https://www.americanexpress.com/en-us/account/get-started/additional-card-member/platinum) — paid Additional benefits, lounge eligibility and purchase protections.
- [Membership Rewards terms](https://www.americanexpress.com/us/rewards/membership-rewards/terms/) — October 2026 edition, account ownership and 90-day Additional Card linking condition.
- [Benefit details](https://global.americanexpress.com/card-benefits/view-all/platinum) — travel, baggage and shopping protection descriptions; follow the linked benefit guides for full eligibility.

## Source discrepancy and implementation limits

The product-page FAQ summarizes “1x on all other purchases” without listing the 2x travel categories. The detailed travel earning terms explicitly list them; this implementation follows those specific terms. The requested cardmember-travel-benefits URL could not be fetched; the official hotel-program page supplies the relevant full earning terms instead.

Portal search results identify qualifying prepaid categories; their displayed warnings state the actual booking requirements. Explicit non-prepaid searches fall back to travel-agency earning. The app cannot verify a booking, merchant coding, payment method, insurance eligibility or redemption access.

The flight cap is a manual, calendar-year-tagged checkbox for the entire Card Account. It changes all eligible flight categories to 1x once marked, but does not track spending or split a purchase crossing the cap. Next year the old marker is inactive. Both roles share one valuation. Role changes preserve each role’s edited fee; the existing annual-fee tie-break uses the Primary fee in either role so a role-only change cannot alter rankings. Annual fees are never deducted from rewards.

Amex rental coverage remains secondary in the app even when international is selected. Optional paid rental insurance is not assumed. Benefit information is conditional and does not force any rewards override. No localStorage schema migration, new account system or points-tracker program was added.
