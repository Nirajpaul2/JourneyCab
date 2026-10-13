# JourneyCab implementation audit

Reviewed 12 October 2026 against the original pasted brief and updated for the Bihar-only request. Current Bihar behavior was verified locally; the earlier baseline audit also inspected the deployed website.

**Verdict: The complete client-demo journey works with Bihar-only coverage. The keyboard selector issue is resolved. Some configurable fare labels still need cleanup, and the Bihar update cannot yet be published because Sites access is unavailable.**

## Requirement checklist

| Requirement | Status | Evidence / limits |
| --- | --- | --- |
| Original JourneyCab branding and premium visual design | Implemented | Warm ivory, navy, saffron actions, local Manrope font, original copy and layout. |
| Desktop and mobile hero with prominent booking panel | Implemented | Mobile prioritises headline and booking form before hero imagery. |
| Header navigation, mobile menu and booking action | Implemented | Links/buttons navigate to the relevant section or booking form. |
| One Way, Round Trip and Local modes | Implemented | All three completed end to end on the local Bihar build. |
| Searchable city selectors, swap, date/time, return date and local packages | Implemented | Fields and selection work; active keyboard option now scrolls into view. |
| Four benefits, six popular routes and route prefilling | Implemented | Six Bihar routes from Patna, their reverses, and clearly labelled estimates. |
| Four fleet categories with images, seats, bags, AC and representative models | Implemented | Licensed local assets and an image-credit dialog. |
| How booking works, sample testimonials, FAQs and footer | Implemented | Sample stories and draft policies are explicitly labelled. |
| Editable results, category/capacity filters and price sorting | Implemented | Includes supported-route and filter empty states. |
| Deterministic fare breakdown | Implemented | Base + tax + toll estimate + driver allowance equals total. Thirteen automated tests pass, including Bihar coverage and out-of-state rejection. |
| Inclusions, exclusions and cancellation preview | Implemented | Accessible dialog; provider confirmation still required for real policies. |
| Passenger information, addresses, validation and final review | Implemented | Local requires pickup only; email optional. |
| Generated demo reference, confirmation notice and restart | Implemented | Fresh local Bihar checks completed for each mode; reset clears details. |
| Preserve selections when using in-app Back/Edit | Implemented | Previously tested throughout review/results navigation. |
| Missing fields, identical cities, past departure, invalid return date | Implemented | Unit and browser checks cover these cases. |
| Loading, empty results and recoverable error | Implemented | Search delay and optional `?scenario=error` are deliberate demo scenarios. |
| Passenger data in memory only, no payments or messages | Implemented | Source contains no booking network calls or persistent storage; prior network test confirmed no outbound booking requests. |
| Reusable components and editable configuration | Mostly implemented | Config exists, but some fare labels and metadata remain separate from configuration; footer branding now uses config. |
| Accessibility and reduced-motion support | Mostly implemented | Labels, focus states, native disclosure/dialog controls and contrast checks pass; keyboard city-list scrolling is now fixed and verified. |
| Responsive verification | Implemented | 375, 768, 1024 and 1440px checked; no overflow or broken images found in the recorded browser suite. |
| Working source, preview, README and presentation walkthrough | Delivered | See `journeycab/README.md`, `journeycab/VERIFICATION.md`, and `JourneyCab-source.zip`. |

## Remaining issue

**Configuration consistency:** `src/config.ts` holds fare rules, but the “Sample tax (5%)” label and some 250 km/₹300 explanatory text remain hard-coded in `Common.tsx` and `App.tsx`. Current numbers are correct. If the pricing configuration changes, align these labels too. Brand metadata in `index.html` is also maintained separately. Footer branding, default route and footer service cities now derive from configuration.

## Bihar verification results

- `npm test`: 13/13 passing; `npm run build`: TypeScript and production build passing.
- Local Patna → Gaya Sedan one way: **₹1,465**, reached simulated confirmation.
- Local Patna → Gaya Sedan round trip, three inclusive days: **₹11,383**, reached simulated confirmation.
- Local Patna Sedan rental, 8 hours / 80 km: **₹2,728**, reached simulated confirmation.
- Out-of-state cities are absent from selectors and rejected by validation and fare calculation.
- Keyboard navigation keeps Arrah, the final option, visible inside the dropdown.
- Route prefilling, unsupported-route recovery, Bihar image loading, and responsive widths 375/768/1440px were checked.
- See `VERIFICATION.md` for the distinction between current checks and the earlier baseline suite.

## Expected demo limitations

Six featured intercity pairs and their reverse routes have mock pricing; local rentals work in all 12 listed Bihar cities. Interstate journeys are unavailable. Unsupported intercity pairs deliberately show an empty state. No actual bookings, fleet availability, payments, messages or driver assignment are included, as requested. Fares, capacities, durations and policies require client confirmation before real use. The hosted preview was created privately; client access is not automatically granted.

## Hosting management limitation

The existing hosted website remains the earlier nationwide demo. The Sites metadata lookup still returns `Sites project not found`, preventing publication of the Bihar update. The current Bihar source and GitHub repository are the authoritative implementation. Hosting access must be restored before the existing preview can be updated; no duplicate Site was created and the project identity was preserved.
