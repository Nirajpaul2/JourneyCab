import test from "node:test";
import assert from "node:assert/strict";
import type { Booking, BookingStatus } from "./operations-types";
import { whatsappConfirmation } from "./whatsapp";

const fixture = (): Booking => ({
  reference: "JC-ABC123ABC123", category: "hatchback", status: "confirmed",
  journey: { mode: "oneway", from: "Siwan", to: "Patna", date: "2099-10-13", time: "09:00", returnDate: "", package: "4h40" },
  passenger: { name: "Test Customer & family", phone: "9876543210", email: "private@example.test", pickup: "Test pickup #1", drop: "Test destination" },
  estimate: { total: 2299 } as Booking["estimate"],
  finalFare: 2399, fareNote: "Parking extra & tolls included.",
  driver: { id: "test-driver", name: "Test Driver", phone: "9876543211", category: "sedan", city: "Siwan", vehicle: "Sample Sedan", plate: "BR01AB1234", active: true },
  upgradeApproval: { from: "hatchback", to: "sedan", recordedBy: "private-staff@example.test", recordedAt: "2099-10-12T12:00:00Z" },
  version: 4, createdAt: "2099-10-12T12:00:00Z", updatedAt: "2099-10-12T12:00:00Z",
});

test("WhatsApp confirmation targets the customer's number, preserves message encoding and uses agreed details", () => {
  const b = fixture();
  const before = structuredClone(b);
  const draft = whatsappConfirmation(b)!;
  const url = new URL(draft.url);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/919876543210");
  assert.deepEqual([...url.searchParams.keys()], ["text"]);
  assert.equal(url.searchParams.get("text"), draft.message);
  for (const text of [b.reference, "Test Customer & family", "Siwan → Patna", "09:00 IST", "Test pickup #1", "2,399", b.fareNote, "Test Driver", "BR01AB1234", "Customer-approved Sedan upgrade"])
    assert.ok(draft.message.includes(text), text);
  assert.ok(!draft.message.includes(b.passenger.email));
  assert.ok(!draft.message.includes(b.upgradeApproval!.recordedBy));
  assert.deepEqual(b, before); // Preparing a link must not mark anything sent.
});

test("WhatsApp confirmation cannot be prepared for unconfirmed, cancelled, incomplete or invalid-recipient bookings", () => {
  for (const status of ["requested", "quoted", "assigned", "completed", "cancelled", "rejected"] as BookingStatus[])
    assert.equal(whatsappConfirmation({ ...fixture(), status }), null);
  assert.equal(whatsappConfirmation({ ...fixture(), driver: null }), null);
  assert.equal(whatsappConfirmation({ ...fixture(), finalFare: null }), null);
  for (const phone of ["123", "9876543210&text=other", "+19876543210", "1234567890"])
    assert.equal(whatsappConfirmation({ ...fixture(), passenger: { ...fixture().passenger, phone } }), null);
  assert.equal(whatsappConfirmation({ ...fixture(), passenger: { ...fixture().passenger, phone: "+91 98765 43210" } })?.phone, "919876543210");
});
