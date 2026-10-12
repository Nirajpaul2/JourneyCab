export const brand = {
  name: "JourneyCab",
  wordmark: ["journey", "cab"],
  tagline: "Enjoy the journey.",
  demoNotice: "Demo booking only. No cab has been reserved.",
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
export const cities = [
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Delhi", state: "Delhi NCR" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Mysuru", state: "Karnataka" },
  { name: "Puducherry", state: "Puducherry" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Vadodara", state: "Gujarat" },
  { name: "Vijayawada", state: "Andhra Pradesh" },
];
export const routes = [
  {
    from: "Mumbai",
    to: "Pune",
    km: 150,
    hours: 3.5,
    toll: 320,
    image: "route-pune",
    mood: "A little change of scenery",
    tag: "THE WEEKEND RESET",
  },
  {
    from: "Delhi",
    to: "Jaipur",
    km: 280,
    hours: 5,
    toll: 420,
    image: "route-jaipur",
    mood: "A date with the Pink City",
    tag: "CULTURE CALLING",
  },
  {
    from: "Ahmedabad",
    to: "Vadodara",
    km: 115,
    hours: 2.5,
    toll: 160,
    image: "route-vadodara",
    mood: "Palaces, parks & possibility",
    tag: "A SHORT ESCAPE",
  },
  {
    from: "Bengaluru",
    to: "Mysuru",
    km: 145,
    hours: 3,
    toll: 260,
    image: "route-mysuru",
    mood: "Take the royal route",
    tag: "SOMETHING TIMELESS",
  },
  {
    from: "Chennai",
    to: "Puducherry",
    km: 155,
    hours: 3.5,
    toll: 150,
    image: "route-puducherry",
    mood: "Slow mornings by the sea",
    tag: "COASTAL STATE OF MIND",
  },
  {
    from: "Hyderabad",
    to: "Vijayawada",
    km: 275,
    hours: 5,
    toll: 350,
    image: "route-vijayawada",
    mood: "Follow the river east",
    tag: "THE SCENIC WAY",
  },
];
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
    "No cancellation fee applies in this simulation. Real cancellation terms and any cut-off times must be confirmed by the service provider before launch.",
  inclusions:
    "AC cab, the displayed distance or rental package, a sample tax amount, and the listed toll estimate and driver allowance.",
  exclusions:
    "Parking, extra stops, extra kilometres, overtime, and changes to actual tolls are not included. Real charges require a confirmed provider quote.",
};
export const faqs = [
  {
    q: "How is my fare calculated?",
    a: "This demo uses the route distance, vehicle category, a sample 5% tax, a toll estimate and any driver allowance. Round trips use a 250 km per day minimum. All figures are illustrative, and a live quote would need provider confirmation.",
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
    a: "Choose your outward date and return date. This demo estimates both directions and applies a 250 km daily minimum plus a daily driver allowance. The return pickup time would be agreed with the provider.",
  },
  {
    q: "What is included in a local rental?",
    a: "Choose 4 hours / 40 km or 8 hours / 80 km in any listed city. Both limits apply. Additional distance, overtime, parking and tolls are excluded from the sample package and need a provider quote.",
  },
];

export const fareRules = {
  taxRate: 0.05,
  roundTripMinimumKmPerDay: 250,
  driverAllowancePerDay: 300,
};
