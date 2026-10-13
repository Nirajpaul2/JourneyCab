import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFare,
  indiaDate,
  initialJourney,
  validateJourney,
  validatePassenger,
} from "./booking";
import { cities, defaultRoute, fleet, routes } from "./config";
const trip = {
  ...initialJourney(),
  date: "2099-10-13",
  time: "09:00",
  returnDate: "2099-10-15",
};
test("Every advertised route uses the banner price without extra sample charges", () => {
  const expected: [string, string, number][] = [
    ["Siwan", "Patna", 2299], ["Siwan", "Chhapra", 1699],
    ["Siwan", "Varanasi", 5399], ["Siwan", "Rajgir", 4999],
    ["Maharajganj", "Patna", 2199], ["Chhapra", "Patna", 1599],
    ["Rasulpur", "Patna", 2399], ["Chainpur", "Patna", 2399],
    ["Ekma", "Patna", 2099], ["Siwan", "Muzaffarpur", 2699],
    ["Maharajganj", "Muzaffarpur", 2699], ["Siwan", "Raxaul", 2799],
    ["Maharajganj", "Raxaul", 2799], ["Gopalganj", "Patna", 2599],
    ["Mirganj", "Patna", 2599], ["Barhiya", "Patna", 2499],
    ["Siwan", "Gorakhpur", 2799], ["Maharajganj", "Gorakhpur", 2899],
    ["Siwan", "Darbhanga", 4299],
  ];
  assert.equal(routes.length, expected.length);
  for (const [from, to, price] of expected) {
    for (const category of ["sedan", "hatchback"] as const) {
      const f = calculateFare({ ...trip, from, to }, category)!;
      assert.equal(f.base, price);
      assert.equal(f.total, price);
      assert.equal(f.tax + f.toll + f.driver, 0);
    }
    assert.equal(calculateFare({ ...trip, from: to, to: from }, "sedan"), null);
  }
});
test("Unpublished services and categories never receive invented prices", () => {
  for (const mode of ["local", "roundtrip"] as const)
    for (const c of fleet)
      assert.equal(calculateFare({ ...trip, mode }, c.id), null);
  for (const category of ["suv", "premium-suv"] as const)
    assert.equal(calculateFare(trip, category), null);
  for (const [from, to] of [["Patna", "Varanasi"], ["Gorakhpur", "Varanasi"], ["Siwan", "Gaya"]])
    assert.equal(calculateFare({ ...trip, from, to }, "sedan"), null);
});
test("Validation catches missing/identical cities, past IST departure and early return", () => {
  assert.ok(validateJourney({ ...trip, to: trip.from }).to);
  assert.ok(validateJourney({ ...trip, from: "" }).from);
  assert.ok(
    validateJourney({ ...trip, mode: "roundtrip", returnDate: "2099-10-12" })
      .returnDate,
  );
  assert.ok(validateJourney({ ...trip, date: "2000-01-01" }).date);
  assert.ok(
    validateJourney(
      { ...trip, date: "2099-10-13", time: "09:00" },
      new Date("2099-10-13T03:30:00Z"),
    ).date,
  );
  assert.deepEqual(validateJourney({ ...trip, mode: "local", to: "" }), {});
});
test("India date default is correct across UTC midnight", () => {
  assert.equal(indiaDate(0, new Date("2026-10-12T20:00:00Z")), "2026-10-13");
  assert.equal(indiaDate(1, new Date("2026-10-12T20:00:00Z")), "2026-10-14");
});
test("Passenger validation permits optional email and local destination omission", () => {
  const passenger = {
    name: "Alex Kumar",
    phone: "9876543210",
    email: "",
    pickup: "12 Example Road",
    drop: "",
  };
  assert.deepEqual(validatePassenger(passenger, "local"), {});
  assert.ok(validatePassenger(passenger, "oneway").drop);
  assert.ok(validatePassenger({ ...passenger, phone: "123" }, "local").phone);
  assert.ok(validatePassenger({ ...passenger, email: "bad@" }, "local").email);
  assert.deepEqual(
    validatePassenger({ ...passenger, phone: "+91 9876543210" }, "local"),
    {},
  );
});

test("Coverage matches the banner, including only its two Uttar Pradesh cities", () => {
  assert.ok(cities.length > 0);
  assert.deepEqual(cities.filter((city) => city.state !== "Bihar").map((city) => city.name).sort(), ["Gorakhpur", "Varanasi"]);
  for (const route of routes) {
    assert.ok(cities.some((city) => city.name === route.from));
    assert.ok(cities.some((city) => city.name === route.to));
    assert.notEqual(route.from, route.to);
  }
  assert.equal(initialJourney().from, defaultRoute.from);
  assert.equal(initialJourney().to, defaultRoute.to);
});
test("Unsupported pickup is rejected for every trip mode, including local rentals", () => {
  for (const mode of ["oneway", "roundtrip", "local"] as const) {
    for (const from of ["Delhi", "Mumbai", "Ranchi", "Kolkata"]) {
      const journey = { ...trip, mode, from };
      assert.match(validateJourney(journey).from, /service-area/);
      assert.equal(calculateFare(journey, "sedan"), null);
    }
  }
});
test("Unsupported destination never receives an intercity quote", () => {
  for (const mode of ["oneway", "roundtrip"] as const) {
    for (const to of ["Delhi", "Mumbai", "Ranchi", "Kolkata"]) {
      const journey = { ...trip, mode, to };
      assert.match(validateJourney(journey).to, /service-area/);
      assert.equal(calculateFare(journey, "sedan"), null);
    }
  }
});
