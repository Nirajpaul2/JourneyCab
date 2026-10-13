import test from "node:test";
import assert from "node:assert/strict";
import { api } from "./api";

test("API client rejects a static HTML fallback even when its HTTP status is 200", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<!doctype html><html>Frontend</html>", { status: 200 }));
  await assert.rejects(api("/api/bookings"), /booking server is unavailable/);
});
test("API client reports network outages and empty proxy errors without returning a receipt", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(api("/api/bookings"), /booking server is unavailable/);
  fetchMock.mock.mockImplementation(async () => new Response("", {status:502}));
  await assert.rejects(api("/api/bookings"), /booking server is unavailable/);
});
test("API client preserves valid server receipts and actionable validation errors", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({reference:"JC-ABC123ABC123"}), {status:201}));
  assert.deepEqual(await api("/api/bookings"), {reference:"JC-ABC123ABC123"});
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify({error:"Choose a valid future journey within Bihar."}), {status:400}));
  await assert.rejects(api("/api/bookings"), /valid future journey within Bihar/);
});
