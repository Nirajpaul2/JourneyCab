# Verification — 12 October 2026

## Automated calculation and validation checks

`npm test`: 9 passing tests covering exact one-way estimates, inclusive round-trip days and daily minimums, both local packages, every featured route/category/mode total, reverse-route symmetry, unsupported pairs, invalid journey/passenger data, and India-time date boundaries.

`npm run build`: TypeScript strict checks and Vite production build pass.

## Real browser checks

Headless Chromium, against the locally running app:

- Complete one-way journey at 1440px: search, sorting, sedan selection, passenger validation, going back and retaining data, fare review, and simulated confirmation — **₹2,368**.
- Complete round trip at 768px — **₹11,823**.
- Complete 8-hour local rental at 375px — **₹2,728**.
- Confirmed that each fare's base + tax + toll + driver allowance equals the displayed total, which stays the same across results, review and confirmation.
- Verified generated demo references and the explicit no-reservation notice.
- Start a New Booking clears passenger details.
- Tested searchable cities, identical cities, past departure, unsupported routes, category/capacity filtering, empty results, and recoverable simulated errors.
- Tested mobile navigation, route/form navigation, expandable FAQs, image credits dialog, Escape to close, and fare disclosures.
- Homepage layouts checked at 375, 768, 1024 and 1440px. Flow screenshots visually inspected on desktop, tablet and mobile. No horizontal overflow or broken images found.
- No console errors or page errors during the complete test suite.
- No non-GET requests, third-party requests, or local/session storage entries during booking. Images and font are self-hosted.

These checks validate the demonstration, not real service availability or operational policies. Browser screenshots and test-run scripts are retained in the ignored local `qa/` directory.

## Accessibility

After correcting muted-text contrast, the homepage, results, and review screens have no violations in an axe-core 4.10.3 audit covering WCAG 2 A/AA and WCAG 2.1 AA rules. This automated audit complements the keyboard and layout checks; it is not a full accessibility certification.
