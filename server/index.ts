import { createApp } from "./app";
import { Store } from "./store";
import { sendNotification } from "./notifications";
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN ?? "http://127.0.0.1:5173";
if (
  production &&
  (!process.env.APP_ORIGIN || new URL(origin).protocol !== "https:")
)
  throw new Error("Production requires APP_ORIGIN with HTTPS.");
process.umask(0o077);
const store = new Store(
  process.env.DATABASE_PATH ?? "./data/journeycab.sqlite",
);
store.db
  .prepare(
    "UPDATE notifications SET status='unknown', error='Delivery outcome unknown after restart; check provider before arranging delivery.' WHERE status='sending'",
  )
  .run();
const sms =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM
    ? {
        sid: process.env.TWILIO_ACCOUNT_SID,
        token: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_FROM,
      }
    : undefined;
if (sms && !/^AC[a-fA-F0-9]{32}$/.test(sms.sid))
  throw new Error("Invalid Twilio account SID.");
const server = createApp({
  store,
  origin,
  production,
  sms,
  acceptingBookings: !production || process.env.BOOKINGS_OPEN === "true",
  trustProxy: process.env.TRUST_PROXY === "1",
});
server.listen(
  Number(process.env.PORT ?? 3001),
  process.env.HOST ?? "127.0.0.1",
  () =>
    console.log(
      `JourneyCab server listening on port ${process.env.PORT ?? 3001}. SMS ${sms ? "configured" : "not configured; notifications stay pending"}.`,
    ),
);
let sending = false;
const worker = setInterval(async () => {
  if (!sms || sending) return;
  sending = true;
  try {
    const rows = store.db
      .prepare(
        "SELECT id FROM notifications WHERE status='pending' ORDER BY id LIMIT 5",
      )
      .all();
    for (const row of rows) {
      try {
        await sendNotification(
          store,
          Number(row.id),
          "notification-worker",
          sms,
        );
      } catch {
        /* Another staff action may have claimed or superseded the notice. */
      }
    }
  } finally {
    sending = false;
  }
}, 10000);
worker.unref();
function close() {
  clearInterval(worker);
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
