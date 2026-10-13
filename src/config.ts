export const brand = {
  name: "JourneyCab",
  wordmark: ["journey", "cab"],
  tagline: "Enjoy the journey.",
  requestNotice: "Your request is pending team confirmation.",
};
export type TripMode = "oneway" | "roundtrip" | "local";
export type Category = "hatchback" | "sedan" | "suv" | "premium-suv";
export interface Journey {
  mode: TripMode;
  from: string;
  to: string;
  date: string;
  time: string;
  returnDate: string;
  package: string;
}
export interface Passenger {
  name: string;
  phone: string;
  email: string;
  pickup: string;
  drop: string;
}
export const serviceArea = {
  state: "Bihar",
  country: "India",
  notice: "Service available within Bihar only.",
  heroImage: "hero-bihar",
  heroAlt: "Vishwa Shanti Stupa in Rajgir, Bihar, beneath a blue sky",
  heroLocation: "RAJGIR, BIHAR",
};
// Starter demo coverage. All route endpoints must belong to this Bihar catalog.
export const cities = [
  {
    name: "Patna",
    state: "Bihar",
  },
  {
    name: "Gaya",
    state: "Bihar",
  },
  {
    name: "Bodh Gaya",
    state: "Bihar",
  },
  {
    name: "Rajgir",
    state: "Bihar",
  },
  {
    name: "Nalanda",
    state: "Bihar",
  },
  {
    name: "Muzaffarpur",
    state: "Bihar",
  },
  {
    name: "Darbhanga",
    state: "Bihar",
  },
  {
    name: "Bhagalpur",
    state: "Bihar",
  },
  {
    name: "Purnia",
    state: "Bihar",
  },
  {
    name: "Begusarai",
    state: "Bihar",
  },
  {
    name: "Hajipur",
    state: "Bihar",
  },
  {
    name: "Arrah",
    state: "Bihar",
  },
];
// Distances, times and tolls are illustrative demo inputs, not live routing data.
export const routes = [
  {
    from: "Patna",
    to: "Gaya",
    km: 100,
    hours: 3,
    toll: 100,
    image: "route-gaya",
    mood: "A journey through living heritage",
    tag: "ROOTED IN TRADITION",
  },
  {
    from: "Patna",
    to: "Bodh Gaya",
    km: 125,
    hours: 3.5,
    toll: 120,
    image: "route-bodh-gaya",
    mood: "Make room for a quieter day",
    tag: "A MOMENT OF CALM",
  },
  {
    from: "Patna",
    to: "Rajgir",
    km: 105,
    hours: 3,
    toll: 0,
    image: "route-rajgir",
    mood: "A little escape to the hills",
    tag: "THE WEEKEND RESET",
  },
  {
    from: "Patna",
    to: "Muzaffarpur",
    km: 80,
    hours: 2.5,
    toll: 90,
    image: "route-muzaffarpur",
    mood: "For work, family and everything between",
    tag: "CLOSER TO YOUR PEOPLE",
  },
  {
    from: "Patna",
    to: "Darbhanga",
    km: 145,
    hours: 4,
    toll: 160,
    image: "route-darbhanga",
    mood: "Follow the road into Mithila",
    tag: "CULTURE CALLING",
  },
  {
    from: "Patna",
    to: "Bhagalpur",
    km: 240,
    hours: 6,
    toll: 180,
    image: "route-bhagalpur",
    mood: "A new day in the Silk City",
    tag: "A LITTLE FURTHER EAST",
  },
];
export const defaultRoute = routes[0];
export const serviceAreaLines = Array.from(
  { length: Math.ceil(cities.length / 3) },
  (_, index) =>
    cities
      .slice(index * 3, index * 3 + 3)
      .map((city) => city.name)
      .join(" · "),
);
export const packages = [
  { id: "4h40", label: "4 hours / 40 km", hours: 4, km: 40 },
  { id: "8h80", label: "8 hours / 80 km", hours: 8, km: 80 },
];
export const fleet: {
  id: Category;
  title: string;
  models: string;
  seats: number;
  bags: number;
  rate: number;
  localBase: number;
  description: string;
  image: string;
}[] = [
  {
    id: "hatchback",
    title: "Hatchback",
    models: "Swift, Tiago or similar",
    seats: 4,
    bags: 1,
    rate: 11,
    localBase: 1099,
    description: "Small plans. Plenty of possibility.",
    image: "car-hatchback",
  },
  {
    id: "sedan",
    title: "Sedan",
    models: "Dzire, Aura or similar",
    seats: 4,
    bags: 2,
    rate: 13,
    localBase: 1299,
    description: "A little more room to unwind.",
    image: "car-sedan",
  },
  {
    id: "suv",
    title: "SUV",
    models: "Toyota Innova or similar",
    seats: 6,
    bags: 3,
    rate: 17,
    localBase: 1799,
    description: "Bring your favourite people.",
    image: "car-suv",
  },
  {
    id: "premium-suv",
    title: "Premium SUV",
    models: "Toyota Fortuner or similar",
    seats: 6,
    bags: 4,
    rate: 22,
    localBase: 2299,
    description: "Make the journey an occasion.",
    image: "car-premium-suv",
  },
];
export const policies = {
  label: "Draft demo policy · subject to client confirmation",
  cancellation:
    "Contact the booking team to request a cancellation. Applicable cancellation terms must be agreed with you when the team confirms your fare; submitting a request does not reserve a vehicle.",
  inclusions:
    "AC cab, the displayed distance or rental package, a sample tax amount, and the listed toll estimate and driver allowance.",
  exclusions:
    "Parking, extra stops, extra kilometres, overtime, and changes to actual tolls are not included. Real charges require a confirmed provider quote.",
};
export const faqs = [
  {
    q: "When is my booking confirmed?",
    a: "After you submit a ride request, our team checks availability with local driver partners and agrees the final fare with you. We then assign a driver and confirm your booking. Follow your private status link for updates; a submitted request alone does not reserve a cab.",
  },
  {
    q: "Where is JourneyCab available?",
    a: `Our service area is Bihar only. Our current city list includes ${cities.map((city) => city.name).join(", ")}. Intercity estimates cover ${routes.length} featured routes and their reverse journeys; local rentals work in each listed Bihar city. Trips outside Bihar are not available.`,
  },
  {
    q: "How is my fare calculated?",
    a: "Initial estimates use the route distance, vehicle category, a sample 5% tax, a toll estimate and any driver allowance. Round trips use a 250 km per day minimum. All figures are illustrative, and the final fare is agreed with you by our team.",
  },
  {
    q: "Are tolls and parking included?",
    a: "The displayed total includes a clearly itemised toll estimate for intercity trips. Actual tolls may differ. Parking, extra stops and local-rental tolls are excluded and would need confirmation.",
  },
  {
    q: "How much luggage can I bring?",
    a: "Each vehicle card shows a sample suitcase capacity, from one bag in a hatchback to four in a premium SUV. Oversized items and full passenger loads may affect space; confirm those with the provider.",
  },
  { q: "What if I need to cancel?", a: policies.cancellation },
  {
    q: "Can I change my pickup details?",
    a: "Yes. Use Edit journey or the back button before confirming, and your current selections will be retained. In a real service, changes would be subject to availability and a revised fare.",
  },
  {
    q: "How do round trips work?",
    a: "Choose your outward date and return date. The initial estimate covers both directions and applies a 250 km daily minimum plus a daily driver allowance. The return pickup time would be agreed with the provider.",
  },
  {
    q: "What is included in a local rental?",
    a: "Choose 4 hours / 40 km or 8 hours / 80 km in any listed Bihar city. Both limits apply. Additional distance, overtime, parking and tolls are excluded from the sample package and need a provider quote.",
  },
];

export const fareRules = {
  taxRate: 0.05,
  roundTripMinimumKmPerDay: 250,
  driverAllowancePerDay: 300,
};
