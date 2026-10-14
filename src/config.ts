export const brand = {
  name: "Aryan Tour and Travel",
  tagline: "आपकी यात्रा, हमारी जिम्मेदारी।",
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
  state: "Bihar & selected Uttar Pradesh routes",
  country: "India",
  notice: "Bihar routes · Selected trips to Uttar Pradesh",
  heroImage: "hero-bihar",
  heroAlt: "Vishwa Shanti Stupa in Rajgir, Bihar, beneath a blue sky",
  heroLocation: "RAJGIR, BIHAR",
};
// Transcribed from the client-supplied Aryan Tour and Travel banner (13 Oct 2026).
// Directional prices for a five-seater AC vehicle. Tolls and parking are extra.
// No reverse fares, journey distances, travel times or additional taxes were supplied.
export const routes = [
  { from: "Siwan", to: "Patna", fare: 2299 },
  { from: "Siwan", to: "Chhapra", fare: 1699 },
  { from: "Siwan", to: "Varanasi", fare: 5399 },
  { from: "Siwan", to: "Rajgir", fare: 4999 },
  { from: "Maharajganj", to: "Patna", fare: 2199 },
  { from: "Chhapra", to: "Patna", fare: 1599 },
  { from: "Rasulpur", to: "Patna", fare: 2399 },
  { from: "Chainpur", to: "Patna", fare: 2399 },
  { from: "Ekma", to: "Patna", fare: 2099 },
  { from: "Siwan", to: "Muzaffarpur", fare: 2699 },
  { from: "Maharajganj", to: "Muzaffarpur", fare: 2699 },
  { from: "Siwan", to: "Raxaul", fare: 2799 },
  { from: "Maharajganj", to: "Raxaul", fare: 2799 },
  { from: "Gopalganj", to: "Patna", fare: 2599 },
  { from: "Mirganj", to: "Patna", fare: 2599 },
  { from: "Barhiya", to: "Patna", fare: 2499 },
  { from: "Siwan", to: "Gorakhpur", fare: 2799 },
  { from: "Maharajganj", to: "Gorakhpur", fare: 2899 },
  { from: "Siwan", to: "Darbhanga", fare: 4299 },
];
export const cities = [...new Set(routes.flatMap((r) => [r.from, r.to]))].map(
  (name) => ({
    name,
    state: ["Varanasi", "Gorakhpur"].includes(name) ? "Uttar Pradesh" : "Bihar",
  }),
);
// Five seats includes the driver; show four passenger seats until the operator
// confirms otherwise. Larger vehicles have no published price in the banner.
export const advertisedCategories: Category[] = ["hatchback", "sedan"];
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
  description: string;
  image: string;
}[] = [
  {
    id: "hatchback",
    title: "Hatchback",
    models: "Swift, Tiago or similar",
    seats: 4,
    bags: 1,
    description: "Small plans. Plenty of possibility.",
    image: "car-hatchback",
  },
  {
    id: "sedan",
    title: "Sedan",
    models: "Dzire, Aura or similar",
    seats: 4,
    bags: 2,
    description: "A little more room to unwind.",
    image: "car-sedan",
  },
  {
    id: "suv",
    title: "SUV",
    models: "Toyota Innova or similar",
    seats: 6,
    bags: 3,
    description: "Bring your favourite people.",
    image: "car-suv",
  },
  {
    id: "premium-suv",
    title: "Premium SUV",
    models: "Toyota Fortuner or similar",
    seats: 6,
    bags: 4,
    description: "Make the journey an occasion.",
    image: "car-premium-suv",
  },
];
export const policies = {
  label: "Published route fares · Team confirmation required",
  cancellation:
    "Contact the booking team to request a cancellation. Applicable cancellation terms must be agreed with you when the team confirms your fare; submitting a request does not reserve a vehicle.",
  inclusions:
    "The advertised one-way route fare for a five-seater AC vehicle and driver. The team confirms the vehicle, passenger capacity, availability and final fare before reserving a cab.",
  exclusions:
    "Toll tax and parking are payable separately, as stated in the client banner. Extra stops and other changes require a revised quote. The banner does not specify tax treatment; the team must clarify it before confirmation.",
};
export const faqs = [
  {
    q: "When is my booking confirmed?",
    a: "After you submit a ride request, our team checks availability with local driver partners and agrees the final fare with you. We then assign a driver and confirm your booking. Follow your private status link for updates; a submitted request alone does not reserve a cab.",
  },
  {
    q: "Where is Aryan Tour and Travel available?",
    a: `We list ${routes.length} advertised one-way routes across Bihar and selected routes from Siwan and Maharajganj to Uttar Pradesh. Varanasi and Gorakhpur are supported only on the published routes. Prices apply in the direction shown; reverse trips and other city pairs need a separate quote.`,
  },
  {
    q: "How is my fare calculated?",
    a: "One-way fares are taken directly from the client’s route banner for a five-seater AC car. No per-kilometre multiplier or sample tax is added. The team agrees the final fare and tax treatment with you before confirmation. SUV, round-trip and local-rental prices have not been supplied and cannot be booked online yet.",
  },
  {
    q: "Are tolls and parking included?",
    a: "No. Toll tax and parking are payable separately. The displayed route fare excludes both, as stated in the banner.",
  },
  {
    q: "How many passengers can travel?",
    a: "The banner advertises a five-seater AC vehicle. We currently allow up to four passengers, leaving one seat for the driver. Vehicle model, luggage space and passenger capacity must be confirmed by the team.",
  },
  { q: "What if I need to cancel?", a: policies.cancellation },
  {
    q: "Can I change my pickup details?",
    a: "Use Edit journey or the back button before submitting. After submission, contact the team; changes are subject to availability and a revised fare.",
  },
  {
    q: "Can I book a return trip or local rental?",
    a: "The banner only supplies one-way prices. Round trips, reverse journeys, local rentals and larger vehicles require a separate quote and are not currently priced for online booking.",
  },
];
