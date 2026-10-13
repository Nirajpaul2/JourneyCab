import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";

const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));
mkdirSync(dataRoot, { recursive: true, mode: 0o700 });
const directory = mkdtempSync(`${dataRoot}docker-smoke-`);
const name = `journeycab-smoke-${process.pid}`;
const origin = "http://journeycab-smoke.local";
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", timeout: 60000 });
let created = false;
try {
  docker("run", "-d", "--name", name,
    "--user", `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
    "--publish", "127.0.0.1::3001",
    "--mount", `type=bind,source=${directory},target=/app/data`,
    "--read-only", "--tmpfs", "/tmp:rw,size=32m,mode=1777",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true",
    "--env", "NODE_ENV=development", "--env", `APP_ORIGIN=${origin}`,
    "journeycab:local");
  created = true;
  const address = docker("port", name, "3001").trim();
  assert.match(address, /^127\.0\.0\.1:\d+$/);
  let base = `http://${address}`;
  async function ready() {
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) });
        if (r.ok) return;
      } catch { /* Container may still be starting. */ }
      await setTimeout(250);
    }
    throw new Error("Docker API did not become ready.");
  }
  await ready();
  assert.equal((await fetch(`${base}/admin`)).status, 200);
  assert.equal((await fetch(`${base}/api/admin/bookings`)).status, 401);
  const token = randomBytes(32).toString("hex");
  const request = {
    journey: { mode: "oneway", from: "Siwan", to: "Patna", date: "2099-10-13", time: "09:00", returnDate: "2099-10-15", package: "4h40" },
    category: "sedan", consent: true, requestKey: randomUUID(), trackingToken: token,
    passenger: { name: "Docker Test", phone: "9876543210", email: "", pickup: "Synthetic pickup only", drop: "Synthetic destination only" },
  };
  async function submit(requestOrigin) {
    return fetch(`${base}/api/bookings`, { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(request) });
  }
  assert.equal((await submit("https://wrong-origin.example")).status, 403);
  const response = await submit(origin);
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.match(receipt.reference, /^JC-/);
  assert.equal((await (await submit(origin)).json()).reference, receipt.reference);
  console.log("Docker booking, idempotency, admin authorization and origin checks passed.");
  docker("restart", name);
  const restartedAddress = docker("port", name, "3001").trim();
  assert.match(restartedAddress, /^127\.0\.0\.1:\d+$/);
  if (restartedAddress !== address) console.log("Docker reassigned the temporary test port on restart; using its current binding.");
  base = `http://${restartedAddress}`;
  await ready();
  const tracked = await fetch(`${base}/api/bookings/${receipt.reference}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(tracked.status, 200);
  const booking = await tracked.json();
  assert.equal(booking.status, "requested");
  assert.equal(booking.estimate.total, 2299);
  assert.equal(booking.driver, null);
  assert.equal("passenger" in booking, false);
  console.log("Booking and private tracking survived a container restart. No messages sent.");
} finally {
  // Only remove the disposable container/database created by this test.
  if (created) docker("rm", "-f", name);
  rmSync(directory, { recursive: true, force: true });
}
