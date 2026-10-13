import {
  cities,
  defaultRoute,
  fareRules,
  fleet,
  packages,
  routes,
  serviceArea,
} from "./config";
import type { Category, Journey, Passenger } from "./config";
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export function indiaDate(offset = 0, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const day = new Date(`${today}T12:00:00+05:30`);
  day.setTime(day.getTime() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(day);
}
export const initialJourney = (): Journey => ({
  mode: "oneway",
  from: defaultRoute.from,
  to: defaultRoute.to,
  date: indiaDate(1),
  time: "09:00",
  returnDate: indiaDate(3),
  package: "4h40",
});
export const emptyPassenger = (): Passenger => ({
  name: "",
  phone: "",
  email: "",
  pickup: "",
  drop: "",
});
export function validateJourney(j: Journey, now = new Date()) {
  const errors: Record<string, string> = {};
  if (!cities.some((c) => c.name === j.from))
    errors.from = `Choose a pickup city in ${serviceArea.state} from the list.`;
  if (j.mode !== "local") {
    if (!cities.some((c) => c.name === j.to))
      errors.to = `Choose a destination in ${serviceArea.state} from the list.`;
    else if (j.from === j.to)
      errors.to = "Choose a different destination city.";
  }
  const departure = new Date(`${j.date}T${j.time}:00+05:30`);
  if (!j.date) errors.date = "Choose a pickup date.";
  if (!j.time) errors.time = "Choose a pickup time.";
  if (
    j.date &&
    j.time &&
    (!Number.isFinite(departure.getTime()) || departure <= now)
  )
    errors.date = "Choose a future departure date and time (IST).";
  if (j.mode === "roundtrip" && (!j.returnDate || j.returnDate < j.date))
    errors.returnDate = "Return date must be on or after pickup date.";
  if (j.mode === "local" && !packages.some((p) => p.id === j.package))
    errors.package = "Choose a rental package.";
  return errors;
}
export function validatePassenger(p: Passenger, mode: Journey["mode"]) {
  const errors: Record<string, string> = {};
  if (p.name.trim().length < 2)
    errors.name = "Enter the passenger’s full name.";
  if (!/^(?:\+91[ -]?)?[6-9]\d{9}$/.test(p.phone.replace(/\s/g, "")))
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    errors.email = "Enter a valid email, or leave it blank.";
  if (p.pickup.trim().length < 5)
    errors.pickup = "Add a pickup address with a nearby landmark.";
  if (mode !== "local" && p.drop.trim().length < 5)
    errors.drop = "Add a drop address with a nearby landmark.";
  return errors;
}
export const findRoute = (j: Journey) =>
  routes.find(
    (r) =>
      (r.from === j.from && r.to === j.to) ||
      (r.to === j.from && r.from === j.to),
  );
export const tripDays = (j: Journey) =>
  j.mode === "roundtrip"
    ? Math.max(
        1,
        Math.round(
          (new Date(j.returnDate).getTime() - new Date(j.date).getTime()) /
            86400000,
        ) + 1,
      )
    : 1;
export function calculateFare(j: Journey, category: Category) {
  // Enforce coverage in the estimator as well as in the form.
  if (!cities.some((city) => city.name === j.from)) return null;
  if (
    j.mode !== "local" &&
    (!cities.some((city) => city.name === j.to) || j.from === j.to)
  )
    return null;
  const cab = fleet.find((c) => c.id === category);
  if (!cab) return null;
  const route = findRoute(j);
  const pack = packages.find((p) => p.id === j.package);
  if (!pack) return null;
  if (j.mode !== "local" && !route) return null;
  const days = tripDays(j);
  const km =
    j.mode === "local"
      ? pack.km
      : j.mode === "roundtrip"
        ? Math.max(route!.km * 2, fareRules.roundTripMinimumKmPerDay * days)
        : route!.km;
  const base =
    j.mode === "local" ? cab.localBase * (pack.hours / 4) : km * cab.rate;
  const driver =
    j.mode === "roundtrip" ? fareRules.driverAllowancePerDay * days : 0;
  const tax = Math.round((base + driver) * fareRules.taxRate);
  const toll =
    j.mode === "local" ? 0 : route!.toll * (j.mode === "roundtrip" ? 2 : 1);
  return {
    base,
    driver,
    tax,
    toll,
    total: base + driver + tax + toll,
    km,
    days,
  };
}
export type Fare = NonNullable<ReturnType<typeof calculateFare>>;
export const modeLabel = (mode: Journey["mode"]) =>
  ({ oneway: "One way", roundtrip: "Round trip", local: "Local rental" })[mode];
export const prettyDate = (date: string) =>
  new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
