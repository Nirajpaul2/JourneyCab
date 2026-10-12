# JourneyCab client demo

An original, responsive Indian cab-booking experience built with React 19, TypeScript, Vite, and Tailwind CSS 4. JourneyCab is a temporary brand. All interactions and fare calculations run in the browser.

## Run locally

Requires Node.js 22+ and npm.

```sh
cd journeycab # when starting from the OneWayCab workspace
npm ci
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

```sh
npm test         # fare, date, route and passenger-validation tests
npm run build    # TypeScript checks and production bundle in dist/
npm run preview  # serve the production bundle locally
```

The production build is static and can be hosted by any static web host. `.openai/hosting.json` holds the private Sites deployment identity. No API keys or environment variables are needed.

## A short client walkthrough

1. Start on the homepage. Introduce the original ivory, navy and saffron visual design, the three trip modes, the destination cards, fleet, sample stories and FAQs. Mention that JourneyCab is a temporary brand.
2. Leave **Mumbai → Pune**, tomorrow at **09:00 IST**, and choose **Search Cabs**. Change price sorting, inspect the **Sedan**, and expand its fare breakdown. The one-way sedan estimate is **₹2,368**: base ₹1,950 + sample tax ₹98 + toll estimate ₹320.
3. Choose **Select Cab**. Enter sample details: **Alex Kumar**, **9876543210**, optional **alex@example.com**, pickup **12 Example Road, near Central Park**, drop **42 Sample Avenue, near City Museum**. Go back to cab options and select again to show that the details stay intact.
4. Choose **Confirm Demo Booking**. Point out the generated reference and the explicit message: **“Demo booking only. No cab has been reserved.”** Use **Start a New Booking** to clear the sample details.
5. Try **Round Trip** with a return date two days after departure. For the default route, the sedan estimate is **₹11,823**, based on three inclusive calendar days, the 250 km/day minimum, driver allowance, sample tax and return toll estimate.
6. Try **Local** in Mumbai, select **8 hours / 80 km**, and choose Sedan. The estimate is **₹2,728**. Only the pickup address is required for a local rental.
7. On a phone-sized window, demonstrate the compact menu, booking-first layout, route selection, FAQ accordion and the same complete booking journey.

## Edge cases for a demonstration

- Choose the same pickup/destination city: the form shows an inline validation message.
- Pick a past departure, or a return date before departure: the form blocks the search.
- Choose Mumbai → Jaipur: there is an intentional empty-results view, with a working action to try Mumbai → Pune. Only the six featured intercity pairs and their reverses have mock fares.
- Filter **Hatchback** and **6 passengers**: an empty filter state offers **Clear filters**.
- Open `/?scenario=error`, then search: a simulated error appears once. **Try again** recovers without losing the journey.
- Search loading is intentionally shown for 650 ms. There is no external search request.
- Open **Photography & image credits** in the footer to inspect local photo sources and licenses.

## Editing the demo

- `src/config.ts`: brand name/wordmark, cities, routes, fleet, rental packages, category rates, tax/driver/minimum-distance rules, FAQs, and draft policies.
- `src/booking.ts`: deterministic estimates and validation. Keep tax/policy labels aligned if changing the pricing model.
- `src/components/BookingForm.tsx`: trip modes and keyboard-accessible searchable city controls.
- `src/components/Home.tsx`: homepage sections and route-prefill actions.
- `src/components/Common.tsx`: shared branding, journey details, fare breakdown, stepper and footer.
- `src/App.tsx`: in-memory flow, results, review, confirmation, and dialogs.
- `src/styles.css`: responsive styling, focus states, motion preferences, and self-hosted Manrope.
- `public/images/credits.json` and `ASSET_CREDITS.md`: image attribution. Retain licenses and attribution when redistributing the photos.
- `index.html` and `public/favicon.svg`: browser metadata and brand mark.

## Limitations and privacy

- No cab inventory, reservations, payments, driver assignment, accounts, emails, SMS, analytics or external booking connections exist.
- Passenger details are held in React memory only. They are never put in URLs, localStorage, sessionStorage, cookies, or submitted to a service. Refreshing or starting a new booking clears them. Use fictional information for demonstrations.
- Only the six featured intercity routes and their reverses are supported; local rentals work in all 12 listed cities.
- All prices, distances, durations, capacities, sample tax and policies are illustrative, requiring client/provider validation. Daily minimums include both departure and return dates. Return pickup times would be agreed with a real provider.
- Local package limits apply to both time and distance. Parking, local tolls, extra stops, overtime and additional kilometres are excluded. Vehicle photos and models represent categories, not live availability.
- Sample stories are explicitly fictional; no verified ratings, customer counts or operational guarantees are claimed.
- All images and the font are bundled locally. Creative Commons images retain their stated licenses. The Manrope font license is in `public/fonts/OFL-Manrope.txt`.
- The reference site's business model and form structure were reviewed; its branding, copy, testimonials and statistics were not reused. No reference booking service is contacted.

## Verification

See `VERIFICATION.md` for the completed browser and calculation checks.
