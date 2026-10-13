import type { Store } from "./store";
import { requireThat } from "./store";
export interface SmsConfig {
  sid: string;
  token: string;
  from: string;
}
export async function sendNotification(
  store: Store,
  id: number,
  actor: string,
  config?: SmsConfig,
  transport: typeof fetch = fetch,
) {
  requireThat(
    config?.sid && config?.token && config?.from,
    "SMS provider is not configured. Record a manual call/message after contacting the customer.",
    503,
  );
  const notification = store.notification(id);
  requireThat(
    notification.status === "pending",
    "This notification was already handled. Check its delivery status.",
    409,
  );
  const claimed = store.db
    .prepare(
      "UPDATE notifications SET status='sending' WHERE id=? AND status='pending'",
    )
    .run(id);
  requireThat(
    claimed.changes === 1,
    "Notification is already being sent.",
    409,
  );
  const booking = store.get(notification.booking_ref);
  const phone = booking.passenger.phone.replace(/\D/g, "").slice(-10);
  try {
    const response = await transport(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.sid}:${config.token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: `+91${phone}`,
          From: config.from,
          Body: notification.body,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = (await response.json()) as { sid?: string };
    if (!response.ok) {
      // 5xx may occur after the provider accepted the message; do not retry blindly.
      const state = response.status >= 500 ? "unknown" : "failed";
      store.db
        .prepare("UPDATE notifications SET status=?,error=? WHERE id=?")
        .run(
          state,
          `Provider HTTP ${response.status}. Check provider logs before arranging delivery.`,
          id,
        );
    } else if (result.sid) {
      store.db
        .prepare(
          "UPDATE notifications SET status='accepted',provider_id=?,error=NULL WHERE id=?",
        )
        .run(result.sid, id);
    } else
      store.db
        .prepare(
          "UPDATE notifications SET status='unknown',error='Provider response did not include a message ID. Check provider logs.' WHERE id=?",
        )
        .run(id);
  } catch {
    store.db
      .prepare(
        "UPDATE notifications SET status='unknown',error='Connection interrupted. Check provider logs before arranging delivery.' WHERE id=?",
      )
      .run(id);
  }
  store.event(
    notification.booking_ref,
    "notification_attempt",
    actor,
    `SMS notification ${id}: ${store.notification(id).status}.`,
  );
  return store.notification(id);
}
