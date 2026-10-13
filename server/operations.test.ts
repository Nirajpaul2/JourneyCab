import test from "node:test";
import { backup } from "node:sqlite";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { Store, HttpError } from "./store";
import { createApp } from "./app";
import { sendNotification } from "./notifications";
import type { AddressInfo } from "node:net";
const staff = "operator@example.test";
const sample = () => ({
  journey: {
    mode: "oneway",
    from: "Patna",
    to: "Gaya",
    date: "2099-10-13",
    time: "09:00",
    returnDate: "2099-10-15",
    package: "4h40",
  },
  passenger: {
    name: "Alex Kumar",
    phone: "9876543210",
    email: "",
    pickup: "12 Example Road",
    drop: "24 Sample Street",
  },
  category: "sedan",
  consent: true,
  requestKey: randomUUID(),
  trackingToken: randomBytes(32).toString("hex"),
});
const partner = {
  name: "Test Partner",
  phone: "9876543211",
  city: "Patna",
  category: "sedan",
  vehicle: "Sample Sedan",
  plate: "BR01AB1234",
};
function transition(
  store: Store,
  reference: string,
  data: Record<string, unknown>,
) {
  return store.change(
    reference,
    { version: store.get(reference).version, ...data },
    staff,
  );
}
function confirm(store: Store, reference: string, driverId: string) {
  transition(store, reference, {
    action: "quote",
    fare: 1600,
    note: "Agreed total including tolls; parking extra.",
    customerAgreed: true,
  });
  transition(store, reference, {
    action: "assign",
    driverId,
    driverAgreed: true,
  });
  transition(store, reference, { action: "confirm" });
}
test("Requests persist after restart; estimates are server-derived and tokens remain private", () => {
  const dir = mkdtempSync(join(tmpdir(), "journeycab-"));
  const file = join(dir, "db.sqlite");
  let store = new Store(file);
  try {
    const input = sample();
    const { reference } = store.create({
      ...input,
      estimate: { total: 1 },
      status: "confirmed",
      finalFare: 1,
    });
    assert.equal(store.get(reference).estimate.total, 1465);
    assert.equal(store.get(reference).status, "requested");
    store.close();
    store = new Store(file);
    const result = store.publicGet(reference, input.trackingToken);
    assert.equal(result.reference, reference);
    assert.equal("passenger" in result, false);
    assert.equal(result.driver, null);
    assert.throws(() => store.publicGet(reference, "bad"), /not found/);
    const row = store.db.prepare("SELECT * FROM bookings").get()!;
    assert.ok(!JSON.stringify(row).includes(input.trackingToken));
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});
test("Idempotent request retries cannot duplicate or overwrite a submitted request", () => {
  const s = new Store(":memory:");
  try {
    const input = sample();
    const first = s.create(input);
    assert.equal(s.create(input).reference, first.reference);
    assert.equal(s.list().length, 1);
    assert.throws(
      () => s.create({ ...input, category: "suv" }),
      /submission has changed/,
    );
    assert.throws(
      () =>
        s.create({ ...input, trackingToken: randomBytes(32).toString("hex") }),
      /submission has changed/,
    );
  } finally {
    s.close();
  }
});
test("Server rejects interstate, invalid dates, unsupported categories, missing consent and malformed bodies", () => {
  const s = new Store(":memory:");
  try {
    const input = sample();
    for (const invalid of [
      null,
      {},
      { ...input, consent: false },
      { ...input, journey: { ...input.journey, from: "Ranchi" } },
      { ...input, journey: { ...input.journey, to: "Nalanda" } },
      { ...input, category: "bus" },
      { ...input, journey: { ...input.journey, date: "2099-13-42" } },
      { ...input, journey: { ...input.journey, date: "2099-02-31" } },
      { ...input, journey: { ...input.journey, time: "25:00" } },
      {
        ...input,
        journey: {
          ...input.journey,
          mode: "roundtrip",
          returnDate: "2099-02-31",
        },
      },
      { ...input, passenger: { ...input.passenger, phone: "123" } },
    ])
      assert.throws(() => s.create(invalid), HttpError);
  } finally {
    s.close();
  }
});
test("Manual workflow enforces fare consent, driver acceptance, versions and confirmation order", () => {
  const s = new Store(":memory:");
  try {
    const input = sample();
    const { reference } = s.create(input);
    const d = s.addDriver(partner);
    assert.throws(
      () => transition(s, reference, { action: "confirm" }),
      /Approve the fare/,
    );
    assert.throws(
      () =>
        transition(s, reference, {
          action: "assign",
          driverId: d.id,
          driverAgreed: true,
        }),
      /Approve the fare/,
    );
    assert.throws(
      () =>
        transition(s, reference, {
          action: "quote",
          fare: 1600,
          note: "Including tolls.",
        }),
      /customer agreed/,
    );
    transition(s, reference, {
      action: "quote",
      fare: 1600,
      note: "Including tolls.",
      customerAgreed: true,
    });
    assert.throws(
      () =>
        s.change(
          reference,
          { action: "assign", version: 1, driverId: d.id, driverAgreed: true },
          staff,
        ),
      /booking changed/,
    );
    assert.throws(
      () => transition(s, reference, { action: "assign", driverId: d.id }),
      /driver accepted/,
    );
    transition(s, reference, {
      action: "assign",
      driverId: d.id,
      driverAgreed: true,
    });
    assert.equal(s.publicGet(reference, input.trackingToken).driver, null);
    transition(s, reference, { action: "confirm" });
    assert.equal(
      s.publicGet(reference, input.trackingToken).driver?.plate,
      partner.plate,
    );
    assert.equal(s.detail(reference).notifications.length, 1);
    assert.equal(s.detail(reference).events.length, 4);
    assert.throws(
      () => transition(s, reference, { action: "complete" }),
      /future trip/,
    );
    assert.throws(
      () => transition(s, reference, { action: "confirm" }),
      /Approve the fare/,
    );
    assert.equal(s.detail(reference).notifications.length, 1);
  } finally {
    s.close();
  }
});
test("Driver collisions are blocked, category must match, cancellation releases the driver", () => {
  const s = new Store(":memory:");
  try {
    const d = s.addDriver(partner);
    const a = s.create(sample()).reference;
    const b = s.create(sample()).reference;
    confirm(s, a, d.id);
    assert.throws(() => s.setDriverActive(d.id, false), /assigned bookings/);
    transition(s, b, {
      action: "quote",
      fare: 1700,
      note: "Customer agreed.",
      customerAgreed: true,
    });
    const wrong = s.addDriver({
      ...partner,
      category: "suv",
      plate: "BR01AB5678",
    });
    assert.throws(
      () =>
        transition(s, b, {
          action: "assign",
          driverId: wrong.id,
          driverAgreed: true,
        }),
      /category/,
    );
    assert.throws(
      () =>
        transition(s, b, {
          action: "assign",
          driverId: d.id,
          driverAgreed: true,
        }),
      /overlapping/,
    );
    transition(s, a, {
      action: "cancel",
      note: "Customer requested cancellation.",
    });
    assert.equal(s.detail(a).notifications[1].status, "failed");
    transition(s, b, { action: "assign", driverId: d.id, driverAgreed: true });
    assert.equal(s.get(b).status, "assigned");
    assert.throws(
      () => transition(s, a, { action: "confirm" }),
      /already closed/,
    );
  } finally {
    s.close();
  }
});
test("Local requests persist without a destination and respect the selected package", () => {
  const s = new Store(":memory:");
  try {
    const data = sample();
    data.journey = {
      ...data.journey,
      mode: "local",
      from: "Darbhanga",
      to: "",
      package: "8h80",
    };
    data.passenger.drop = "";
    const b = s.get(s.create(data).reference);
    assert.equal(b.estimate.total, 2728);
    assert.equal(b.journey.to, "");
  } finally {
    s.close();
  }
});
test("SMS provider is optional; accepted is distinct from delivered; duplicate sends are blocked", async () => {
  const s = new Store(":memory:");
  try {
    const d = s.addDriver(partner);
    const ref = s.create(sample()).reference;
    confirm(s, ref, d.id);
    const n = s.detail(ref).notifications[0];
    const id = Number(n.id);
    await assert.rejects(sendNotification(s, id, staff), /not configured/);
    assert.equal(s.notification(id).status, "pending");
    let calls = 0;
    const fake = (async () => {
      calls++;
      return new Response(JSON.stringify({ sid: "SM-test" }), { status: 201 });
    }) as typeof fetch;
    await sendNotification(
      s,
      id,
      staff,
      { sid: "test", token: "test", from: "test" },
      fake,
    );
    assert.equal(s.notification(id).status, "accepted");
    assert.equal(s.notification(id).provider_id, "SM-test");
    await assert.rejects(
      sendNotification(
        s,
        id,
        staff,
        { sid: "test", token: "test", from: "test" },
        fake,
      ),
      /already handled/,
    );
    assert.equal(calls, 1);
  } finally {
    s.close();
  }
});
test("An ambiguous SMS timeout is never automatically retried", async () => {
  const s = new Store(":memory:");
  try {
    const d = s.addDriver(partner);
    const ref = s.create(sample()).reference;
    confirm(s, ref, d.id);
    const id = Number(s.detail(ref).notifications[0].id);
    const fake = (async () => {
      throw Error("timeout");
    }) as typeof fetch;
    await sendNotification(
      s,
      id,
      staff,
      { sid: "test", token: "test", from: "test" },
      fake,
    );
    assert.equal(s.notification(id).status, "unknown");
    await assert.rejects(
      sendNotification(
        s,
        id,
        staff,
        { sid: "test", token: "test", from: "test" },
        fake,
      ),
      /already handled/,
    );
  } finally {
    s.close();
  }
});
test("API requires staff authentication and same-origin writes; sessions revoke on logout", async () => {
  const store = new Store(":memory:");
  await store.addAdmin(staff, "local-test-password-2026");
  const server = createApp({
    store,
    origin: "http://journeycab.test",
    production: true,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const headers = {
    "Content-Type": "application/json",
    Origin: "http://journeycab.test",
  };
  try {
    assert.equal((await fetch(base + "/api/admin/bookings")).status, 401);
    assert.equal(
      (
        await fetch(base + "/api/bookings", {
          method: "POST",
          headers: { ...headers, Origin: "https://evil.example" },
          body: JSON.stringify(sample()),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/session", {
          method: "POST",
          headers,
          body: JSON.stringify({ email: staff, password: "wrong-password" }),
        })
      ).status,
      401,
    );
    const login = await fetch(base + "/api/session", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: staff,
        password: "local-test-password-2026",
      }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Secure/);
    const staffHeaders = { ...headers, Cookie: cookie.split(";")[0] };
    const receipt = await fetch(base + "/api/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify(sample()),
    });
    assert.equal(receipt.status, 201);
    const list = await fetch(base + "/api/admin/bookings", {
      headers: staffHeaders,
    });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).bookings.length, 1);
    assert.equal(
      (
        await fetch(base + "/api/admin/drivers", {
          method: "POST",
          headers: staffHeaders,
          body: JSON.stringify(partner),
        })
      ).status,
      201,
    );
    const noOrigin = { ...staffHeaders } as Record<string, string>;
    delete noOrigin.Origin;
    assert.equal(
      (
        await fetch(base + "/api/admin/drivers", {
          method: "POST",
          headers: noOrigin,
          body: JSON.stringify(partner),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/session", {
          method: "DELETE",
          headers: staffHeaders,
        })
      ).status,
      200,
    );
    assert.equal(
      (await fetch(base + "/api/admin/bookings", { headers: staffHeaders }))
        .status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/api/session", {
          method: "POST",
          headers,
          body: "not json",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + "/api/bookings", {
          method: "POST",
          headers,
          body: JSON.stringify({ padding: "x".repeat(17000) }),
        })
      ).status,
      413,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
  }
});
test("Request rate limits are enforced and persist in the database", () => {
  const s = new Store(":memory:");
  try {
    s.rate("test", 2, 60);
    s.rate("test", 2, 60);
    assert.throws(
      () => s.rate("test", 2, 60),
      (e: unknown) => e instanceof HttpError && e.status === 429,
    );
  } finally {
    s.close();
  }
});

test("Production booking intake can remain closed during setup", async () => {
  const store = new Store(":memory:");
  const server = createApp({
    store,
    origin: "http://journeycab.test",
    acceptingBookings: false,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/bookings`,
      {
        method: "POST",
        headers: {
          Origin: "http://journeycab.test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sample()),
      },
    );
    assert.equal(response.status, 503);
    assert.equal(store.list().length, 0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
  }
});
test("A consistent SQLite backup restores booking data and private access", async () => {
  const dir = mkdtempSync(join(tmpdir(), "journeycab-backup-"));
  const store = new Store(join(dir, "live.sqlite"));
  try {
    const input = sample();
    const { reference } = store.create(input);
    await backup(store.db, join(dir, "backup.sqlite"));
    const restored = new Store(join(dir, "backup.sqlite"));
    try {
      assert.equal(
        restored.publicGet(reference, input.trackingToken).reference,
        reference,
      );
      assert.equal(restored.get(reference).passenger.name, "Alex Kumar");
    } finally {
      restored.close();
    }
  } finally {
    store.close();
    rmSync(dir, { recursive: true });
  }
});
