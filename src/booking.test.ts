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
test("One-way Patna to Gaya uses a reproducible, itemised fare", () => {
  assert.deepEqual(calculateFare(trip, "sedan"), {
    base: 1300,
    driver: 0,
    tax: 65,
    toll: 100,
    total: 1465,
    km: 100,
    days: 1,
  });
});
test("Round-trip uses inclusive days and daily kilometre minimum", () => {
  assert.deepEqual(calculateFare({ ...trip, mode: "roundtrip" }, "sedan"), {
    base: 9750,
    driver: 900,
    tax: 533,
    toll: 200,
    total: 11383,
    km: 750,
    days: 3,
  });
});
test("Same-day round-trip uses actual return distance when above minimum", () => {
  const f = calculateFare(
    { ...trip, to: "Darbhanga", mode: "roundtrip", returnDate: trip.date },
    "sedan",
  )!;
  assert.equal(f.km, 290);
  assert.equal(f.driver, 300);
});
test("Local 4h/40km and 8h/80km packages itemise tax without intercity tolls", () => {
  assert.equal(
    calculateFare({ ...trip, mode: "local" }, "hatchback")!.total,
    1154,
  );
  const f = calculateFare(
    { ...trip, mode: "local", package: "8h80" },
    "hatchback",
  )!;
  assert.equal(f.base, 2198);
  assert.equal(f.total, 2308);
  assert.equal(f.km, 80);
  assert.equal(f.toll, 0);
});
test("Every route/category/mode total equals its components; reverse fares match", () => {
  for (const r of routes)
    for (const c of fleet)
      for (const mode of ["oneway", "roundtrip", "local"] as const) {
        const j = { ...trip, mode, from: r.from, to: r.to };
        const f = calculateFare(j, c.id)!;
        assert.equal(f.total, f.base + f.tax + f.toll + f.driver);
        assert.deepEqual(
          calculateFare({ ...j, from: r.to, to: r.from }, c.id),
          f,
        );
      }
});
test("Unsupported pairs have no invented quote", () => {
  assert.equal(calculateFare({ ...trip, to: "Nalanda" }, "sedan"), null);
});
test("Validation catches missing/identical cities, past IST departure and early return", () => {
  assert.ok(validateJourney({ ...trip, to: "Patna" }).to);
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

test("Coverage and all featured endpoints stay inside Bihar", () => {
  assert.ok(cities.length > 0);
  assert.ok(cities.every((city) => city.state === "Bihar"));
  for (const route of routes) {
    assert.ok(cities.some((city) => city.name === route.from));
    assert.ok(cities.some((city) => city.name === route.to));
    assert.notEqual(route.from, route.to);
  }
  assert.equal(initialJourney().from, defaultRoute.from);
  assert.equal(initialJourney().to, defaultRoute.to);
});
test("Out-of-state pickup is rejected for every trip mode, including local rentals", () => {
  for (const mode of ["oneway", "roundtrip", "local"] as const) {
    for (const from of ["Delhi", "Mumbai", "Ranchi", "Kolkata"]) {
      const journey = { ...trip, mode, from };
      assert.match(validateJourney(journey).from, /Bihar/);
      assert.equal(calculateFare(journey, "sedan"), null);
    }
  }
});
test("Out-of-state destination never receives an intercity quote", () => {
  for (const mode of ["oneway", "roundtrip"] as const) {
    for (const to of ["Delhi", "Mumbai", "Ranchi", "Kolkata"]) {
      const journey = { ...trip, mode, to };
      assert.match(validateJourney(journey).to, /Bihar/);
      assert.equal(calculateFare(journey, "sedan"), null);
    }
  }
});
test("Every listed Bihar city supports both local demo packages", () => {
  for (const city of cities)
    for (const pack of ["4h40", "8h80"]) {
      const journey = {
        ...trip,
        mode: "local" as const,
        from: city.name,
        to: "",
        package: pack,
      };
      assert.deepEqual(validateJourney(journey), {});
      assert.ok(calculateFare(journey, "sedan")!.total > 0);
    }
});
