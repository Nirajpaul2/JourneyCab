# Verification — 12 October 2026

## Bihar-only refactor: current checks

`npm test`: 13 passing tests. Coverage includes exact one-way estimates, inclusive round-trip days and daily minimums, both local packages, every featured route/category/mode total, reverse-route symmetry, unsupported pairs, invalid journey/passenger data, and India-time date boundaries. New coverage verifies that all catalog cities and route endpoints are in Bihar, rejects out-of-state pickup/destination values, and checks both local packages in all 12 Bihar cities.

`npm run build`: TypeScript strict checks and Vite production build pass.

Real browser checks against the local Bihar build:

- Complete Patna → Gaya Sedan one-way journey at 1440px: results, review and simulated confirmation — **₹1,465**.
- Complete Patna → Gaya Sedan round trip, three inclusive days, at 768px — **₹11,383**.
- Complete Patna Sedan 8-hour local rental at 375px — **₹2,728**. No drop address is required.
- Each review shows the expected base, tax, toll and driver components; totals stay consistent through confirmation. Starting a new booking clears the passenger fields.
- Typing Ranchi produces no matching city options and blocks search with a Bihar-specific validation message.
- Keyboard navigation to the last city, Arrah, scrolls the active option into view (list scrollTop 350; option bounds within list bounds).
- Patna → Bhagalpur route card prefills the form correctly.
- Patna → Nalanda shows the intentional unsupported-route state; its Patna → Gaya recovery action restores valid results.
- Homepage widths 375, 768 and 1440px have no horizontal overflow. Mobile and desktop layouts were visually inspected.
- The Rajgir hero and all six Bihar destination images load successfully. Attribution was updated for all seven photos.

Screenshots are retained in the ignored local `qa/` directory. These checks validate the demonstration, not operational service availability or real prices.

## Earlier baseline checks

Before the Bihar refactor, the broader Chromium suite checked sorting, category/capacity filtering, passenger validation, Back/Edit data retention, identical cities, past departure, loading/empty/recoverable error states, mobile navigation, expandable FAQs, credits-dialog keyboard dismissal, and fare disclosures. That run also checked 1024px layout, recorded no console/page errors, and confirmed no non-GET booking requests, third-party requests, or local/session storage entries. Those checks are historical baseline evidence and were not all rerun during the data refactor.

## Accessibility

The earlier baseline homepage, results and review screens had no violations in an axe-core 4.10.3 audit covering WCAG 2 A/AA and WCAG 2.1 AA rules. The city-list keyboard scrolling issue found in the later implementation audit has now been fixed and verified in the browser. A full axe audit was not repeated for the Bihar copy changes.

## Publication status

The Bihar update is verified locally. The existing Sites management API still returns `Sites project not found`, so the hosted preview has not received these changes. Its existing project identity was preserved. See the GitHub repository and local source for the current Bihar implementation.
