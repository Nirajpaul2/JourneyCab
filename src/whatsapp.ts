import type { Booking } from "./operations-types";
import { money, prettyDate } from "./booking";

// Creating this draft does not send a message or record delivery.
export function whatsappConfirmation(booking: Booking) {
  if (booking.status !== "confirmed" || !booking.driver || !booking.finalFare)
    return null;
  const digits = booking.passenger.phone.replace(/[\s()+-]/g, "");
  const phone = /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
  if (!/^91[6-9]\d{9}$/.test(phone)) return null;
  const driver = booking.driver;
  const message = [
    `Hello ${booking.passenger.name},`,
    "Your JourneyCab ride is confirmed.",
    `Booking: ${booking.reference}`,
    `Route: ${booking.journey.from} → ${booking.journey.to || "Local rental"}`,
    `Pickup time: ${prettyDate(booking.journey.date)}, ${booking.journey.time} IST`,
    `Pickup address: ${booking.passenger.pickup}`,
    ...(booking.passenger.drop ? [`Drop address: ${booking.passenger.drop}`] : []),
    `Agreed fare: ${money(booking.finalFare)}`,
    ...(booking.fareNote ? [`Fare terms: ${booking.fareNote}`] : []),
    ...(booking.upgradeApproval ? ["Customer-approved Sedan upgrade; agreed fare unchanged."] : []),
    `Driver: ${driver.name}`,
    `Driver phone: +91 ${driver.phone}`,
    `Vehicle: ${driver.vehicle} · ${driver.plate}`,
    "Check booking status using the private link saved on your ride-request receipt.",
    "Thank you for choosing JourneyCab.",
  ].join("\n");
  return { phone, message, url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
}
