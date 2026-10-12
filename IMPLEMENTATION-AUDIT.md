# JourneyCab implementation audit

Reviewed 12 October 2026 against the original pasted brief, source files, automated test results, and the deployed website.

**Verdict: The complete client-demo journey is implemented and working. Two minor requirements need cleanup before calling the implementation fully finished.**

## Requirement checklist

| Requirement | Status | Evidence / limits |
| --- | --- | --- |
| Original JourneyCab branding and premium visual design | Implemented | Warm ivory, navy, saffron actions, local Manrope font, original copy and layout. |
| Desktop and mobile hero with prominent booking panel | Implemented | Mobile prioritises headline and booking form before hero imagery. |
| Header navigation, mobile menu and booking action | Implemented | Links/buttons navigate to the relevant section or booking form. |
| One Way, Round Trip and Local modes | Implemented | All three completed end to end again on the live site. |
| Searchable city selectors, swap, date/time, return date and local packages | Implemented with minor keyboard issue | Fields and selection work; active keyboard option is not scrolled into view. |
| Four benefits, six popular routes and route prefilling | Implemented | Includes all six requested routes; estimates clearly labelled. |
| Four fleet categories with images, seats, bags, AC and representative models | Implemented | Licensed local assets and an image-credit dialog. |
| How booking works, sample testimonials, FAQs and footer | Implemented | Sample stories and draft policies are explicitly labelled. |
| Editable results, category/capacity filters and price sorting | Implemented | Includes supported-route and filter empty states. |
| Deterministic fare breakdown | Implemented | Base + tax + toll estimate + driver allowance equals total. Nine automated tests pass. |
| Inclusions, exclusions and cancellation preview | Implemented | Accessible dialog; provider confirmation still required for real policies. |
| Passenger information, addresses, validation and final review | Implemented | Local requires pickup only; email optional. |
| Generated demo reference, confirmation notice and restart | Implemented | Fresh live checks completed for each mode; reset clears details. |
| Preserve selections when using in-app Back/Edit | Implemented | Previously tested throughout review/results navigation. |
| Missing fields, identical cities, past departure, invalid return date | Implemented | Unit and browser checks cover these cases. |
| Loading, empty results and recoverable error | Implemented | Search delay and optional `?scenario=error` are deliberate demo scenarios. |
| Passenger data in memory only, no payments or messages | Implemented | Source contains no booking network calls or persistent storage; prior network test confirmed no outbound booking requests. |
| Reusable components and editable configuration | Mostly implemented | Config exists, but some brand/fare labels are duplicated in component strings. |
| Accessibility and reduced-motion support | Mostly implemented | Labels, focus states, native disclosure/dialog controls and contrast checks pass; keyboard city-list scrolling still needs improvement. |
| Responsive verification | Implemented | 375, 768, 1024 and 1440px checked; no overflow or broken images found in the recorded browser suite. |
| Working source, preview, README and presentation walkthrough | Delivered | See `journeycab/README.md`, `journeycab/VERIFICATION.md`, and `JourneyCab-source.zip`. |

## Remaining issues

1. **Keyboard city-list scrolling:** In `journeycab/src/components/BookingForm.tsx`, ArrowDown/ArrowUp updates the highlighted option but does not scroll the list. Reproduced on the live site: Pune was highlighted while outside the list's visible bounds, with list scroll position still zero. Add a ref/effect to keep the active option visible. Mouse selection and typing a city name work.
2. **Configuration consistency:** `journeycab/src/config.ts` holds brand and fare rules, but footer brand text, the “Sample tax (5%)” label, and some 250 km/₹300 explanatory text are hard-coded in `Common.tsx` and `App.tsx`. Current numbers are correct. Changing the config alone could make those labels inaccurate. Derive the labels from the config, and make brand changes propagate to metadata/footer too.

## Fresh verification results

- `npm test`: 9/9 passing.
- `npm run build`: passing TypeScript and production build.
- Live Mumbai → Pune Sedan one way: **₹2,368**, reached simulated confirmation.
- Live Mumbai → Pune Sedan round trip, three inclusive days: **₹11,823**, reached simulated confirmation.
- Live Mumbai local Sedan, 8 hours / 80 km: **₹2,728**, reached simulated confirmation.
- No live browser console errors recorded during this audit.
- Live JavaScript and stylesheet hashes match the current local production build: `index-CwAj8wHB.js`, `index-BBjKjLES.css`.
- Sample passenger details cleared; live preview returned to the homepage.

## Expected demo limitations

Six featured intercity pairs and their reverse routes have mock pricing; local rentals work in all 12 listed cities. Unsupported intercity pairs deliberately show an empty state. No actual bookings, fleet availability, payments, messages or driver assignment are included, as requested. Fares, capacities, durations and policies require client confirmation before real use. The hosted preview was created privately; client access is not automatically granted.

## Hosting management limitation

The published website works and was tested directly. However, both a follow-up source-cleanup publication and the Sites metadata lookup currently return `Sites project not found`. The final cleanup only moved the credits JSON from `public/` into `src/` to remove a development warning; compiled application JS/CSS are identical to the live version. The source bundle includes the cleanup. Hosting access must be resolved before relying on further publications or sharing changes.
