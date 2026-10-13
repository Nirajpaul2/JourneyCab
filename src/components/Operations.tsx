import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  ClipboardList,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "../api";
import { cities, fleet, packages } from "../config";
import { money, prettyDate } from "../booking";
import { statusLabels } from "../operations-types";
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  Driver,
  Notification,
} from "../operations-types";
type Detail = {
  booking: Booking;
  events: BookingEvent[];
  notifications: Notification[];
};
export default function Operations() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [tab, setTab] = useState<"requests" | "drivers">("requests");
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sms, setSms] = useState(false);
  const [message, setMessage] = useState("");
  async function load(ref?: string) {
    const [requests, partners] = await Promise.all([
      api<{ bookings: Booking[]; smsConfigured: boolean }>(
        "/api/admin/bookings",
      ),
      api<{ drivers: Driver[] }>("/api/admin/drivers"),
    ]);
    setBookings(requests.bookings);
    setSms(requests.smsConfigured);
    setDrivers(partners.drivers);
    if (ref) setDetail(await api<Detail>(`/api/admin/bookings/${ref}`));
  }
  async function run(fn: () => Promise<void>) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api<{ email: string | null }>("/api/session")
      .then(async (s) => {
        setEmail(s.email);
        if (s.email) await load();
      })
      .catch((e) => setError(e.message))
      .finally(() => setChecking(false));
  }, []);
  async function action(data: Record<string, unknown>) {
    if (!detail) return;
    const ref = detail.booking.reference;
    await run(async () => {
      await api(`/api/admin/bookings/${ref}`, {
        method: "POST",
        body: JSON.stringify({ ...data, version: detail.booking.version }),
      });
      await load(ref);
      setMessage("Booking updated.");
    });
  }
  const open = bookings.filter(
    (b) => !["completed", "cancelled", "rejected"].includes(b.status),
  );
  const filtered = bookings.filter(
    (b) =>
      (filter === "all" ||
        (filter === "open" && open.includes(b)) ||
        b.status === filter) &&
      `${b.reference} ${b.passenger.name} ${b.passenger.phone} ${b.journey.from} ${b.journey.to}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="ops-page">
      <header className="ops-top">
        <a className="ops-brand" href="/">
          journeycab<span>.</span>
        </a>
        <span className="ops-top-label">
          <ShieldCheck size={16} /> Operations desk
        </span>
        {email && (
          <div className="ops-account">
            <span>{email}</span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api("/api/session", { method: "DELETE" });
                  setEmail(null);
                  setBookings([]);
                  setDetail(null);
                  setDrivers([]);
                })
              }
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </header>
      {checking ? (
        <main className="ops-login surface">
          <p>Checking your session…</p>
        </main>
      ) : !email ? (
        <main className="ops-login surface">
          <span className="eyebrow">FOR THE PEOPLE BEHIND THE JOURNEY</span>
          <h1>Welcome to the desk.</h1>
          <p>Manage ride requests and your local driver partners.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                const session = await api<{ email: string }>("/api/session", {
                  method: "POST",
                  body: JSON.stringify({
                    email: f.get("email"),
                    password: f.get("password"),
                  }),
                });
                setEmail(session.email);
                await load();
              });
            }}
          >
            <label className="ops-field">
              Staff email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label className="ops-field">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="muted">
            Staff access only. Ask your administrator for an account.
          </p>
          <a className="back-link" href="/">
            <ArrowLeft size={15} /> Customer website
          </a>
        </main>
      ) : (
        <div className="ops-shell">
          <aside className="ops-sidebar">
            <span className="eyebrow">WORKSPACE</span>
            <button
              className={tab === "requests" ? "selected" : ""}
              onClick={() => setTab("requests")}
            >
              <ClipboardList size={18} /> Ride requests{" "}
              <span>{open.length}</span>
            </button>
            <button
              className={tab === "drivers" ? "selected" : ""}
              onClick={() => setTab("drivers")}
            >
              <Users size={18} /> Driver partners
            </button>
            <div className="ops-sidebar-note">
              <ShieldCheck size={22} />
              <strong>People first. Always.</strong>
              <p>
                Agree the fare. Check availability. Assign a trusted partner.
              </p>
            </div>
            <a href="/">View customer website ↗</a>
          </aside>
          <main className="ops-main">
            <div className="ops-heading">
              <div>
                <span className="eyebrow">BIHAR · MANUALLY CONFIRMED</span>
                <h1>
                  {tab === "requests"
                    ? "A good journey starts here."
                    : "Your local driving partners."}
                </h1>
                <p>
                  {tab === "requests"
                    ? "Give every request a clear next step."
                    : "Build a dependable network, one partner at a time."}
                </p>
              </div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void run(() => load(detail?.booking.reference))}
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="ops-success" role="status">
                <Check size={16} />
                {message}
              </p>
            )}
            <div className="ops-stats">
              <div>
                <span>Needs a fare</span>
                <strong>
                  {bookings.filter((b) => b.status === "requested").length}
                </strong>
                <small>New ride requests</small>
              </div>
              <div>
                <span>Needs a driver</span>
                <strong>
                  {bookings.filter((b) => b.status === "quoted").length}
                </strong>
                <small>Fare agreed with customer</small>
              </div>
              <div>
                <span>Ready to confirm</span>
                <strong>
                  {bookings.filter((b) => b.status === "assigned").length}
                </strong>
                <small>Partner has accepted</small>
              </div>
              <div>
                <span>Active partners</span>
                <strong>{drivers.filter((d) => d.active).length}</strong>
                <small>Bihar & selected UP routes</small>
              </div>
            </div>
            {!sms && (
              <div className="ops-notice">
                <ShieldCheck size={18} />
                <p>
                  <strong>SMS delivery needs setup.</strong> Confirmed bookings
                  appear on the customer’s private status page. Contact the
                  customer directly and record delivery below until a provider
                  is connected.
                </p>
              </div>
            )}
            {tab === "requests" ? (
              <div className="ops-workspace">
                <section className="surface ops-queue">
                  <div className="ops-section-title">
                    <h2>Request inbox</h2>
                    <span>{filtered.length}</span>
                  </div>
                  <label className="ops-field">
                    <span className="sr-only">Search requests</span>
                    <input
                      placeholder="Name, reference, city or phone"
                      aria-label="Search requests"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label className="ops-field">
                    <span className="sr-only">Filter requests</span>
                    <select
                      aria-label="Filter requests"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="open">Open requests</option>
                      <option value="all">All requests</option>
                      {Object.entries(statusLabels).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted ops-small">
                    Latest 500 requests. Refresh to receive new requests.
                  </p>
                  <div className="request-list">
                    {filtered.length ? (
                      filtered.map((b) => (
                        <button
                          key={b.reference}
                          className={`request-row ${detail?.booking.reference === b.reference ? "active" : ""}`}
                          onClick={() =>
                            void run(async () =>
                              setDetail(
                                await api<Detail>(
                                  `/api/admin/bookings/${b.reference}`,
                                ),
                              ),
                            )
                          }
                        >
                          <span className={`status-pill ${b.status}`}>
                            {statusLabels[b.status]}
                          </span>
                          <strong>
                            {b.journey.from}{" "}
                            {b.journey.to ? "→ " + b.journey.to : "· Local"}
                          </strong>
                          <span>
                            {b.passenger.name} · {prettyDate(b.journey.date)}
                          </span>
                          <small>
                            {b.reference} · {b.journey.time} IST
                          </small>
                        </button>
                      ))
                    ) : (
                      <div className="ops-empty">
                        <ClipboardList size={28} />
                        <h3>No requests here yet.</h3>
                        <p>Customer ride requests will appear in this inbox.</p>
                      </div>
                    )}
                  </div>
                </section>
                <section className="surface ops-detail">
                  {!detail ? (
                    <div className="ops-empty">
                      <CarFront size={36} />
                      <h2>Every journey, thoughtfully arranged.</h2>
                      <p>
                        Select a request to review the fare, assign a partner,
                        and confirm the ride.
                      </p>
                    </div>
                  ) : (
                    <BookingDetail
                      key={`${detail.booking.reference}-${detail.booking.version}`}
                      detail={detail}
                      drivers={drivers}
                      busy={busy}
                      sms={sms}
                      action={action}
                      notify={(id, data) =>
                        void run(async () => {
                          await api(`/api/admin/notifications/${id}`, {
                            method: "POST",
                            body: JSON.stringify(data),
                          });
                          await load(detail.booking.reference);
                          setMessage("Contact record updated.");
                        })
                      }
                    />
                  )}
                </section>
              </div>
            ) : (
              <section className="surface">
                <div className="ops-section-title">
                  <div>
                    <h2>Partner register</h2>
                    <p className="muted">
                      Add partners after your team has verified their documents
                      and vehicle.
                    </p>
                  </div>
                  <Plus size={23} />
                </div>
                <form
                  className="driver-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = Object.fromEntries(new FormData(form));
                    void run(async () => {
                      await api("/api/admin/drivers", {
                        method: "POST",
                        body: JSON.stringify(f),
                      });
                      form.reset();
                      await load();
                      setMessage("Driver partner added.");
                    });
                  }}
                >
                  {[
                    ["name", "Driver name"],
                    ["phone", "Mobile number"],
                    ["vehicle", "Vehicle model"],
                    ["plate", "Registration number"],
                  ].map(([name, label]) => (
                    <label className="ops-field" key={name}>
                      {label}
                      <input
                        name={name}
                        required
                        maxLength={name === "phone" ? 10 : 100}
                        type={name === "phone" ? "tel" : "text"}
                      />
                    </label>
                  ))}
                  <label className="ops-field">
                    Base city
                    <select name="city">
                      {cities.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ops-field">
                    Category
                    <select name="category">
                      {fleet.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button primary" disabled={busy}>
                    Add partner
                    <Plus size={16} />
                  </button>
                </form>
                <div className="driver-cards">
                  {drivers.map((d) => (
                    <article key={d.id}>
                      <div className="ops-section-title">
                        <h3>{d.name}</h3>
                        <span className="status-pill">
                          {d.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p>
                        {d.vehicle} · {d.plate}
                      </p>
                      <p className="muted">
                        {d.city} · {d.category} · {d.phone}
                      </p>
                      <button
                        disabled={busy}
                        className="text-button"
                        onClick={() =>
                          void run(async () => {
                            await api(`/api/admin/drivers/${d.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ active: !d.active }),
                            });
                            await load();
                          })
                        }
                      >
                        {d.active ? "Set inactive" : "Reactivate"}
                      </button>
                    </article>
                  ))}
                </div>
                {!drivers.length && (
                  <p className="muted">No partners added yet.</p>
                )}
              </section>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
function BookingDetail({
  detail,
  drivers,
  busy,
  sms,
  action,
  notify,
}: {
  detail: Detail;
  drivers: Driver[];
  busy: boolean;
  sms: boolean;
  action: (data: Record<string, unknown>) => Promise<void>;
  notify: (id: number, data: Record<string, unknown>) => void;
}) {
  const b = detail.booking;
  const [closing, setClosing] = useState(false);
  const closed = ["completed", "cancelled", "rejected"].includes(b.status);
  return (
    <>
      <div className="ops-section-title">
        <span className={`status-pill ${b.status}`}>
          {statusLabels[b.status]}
        </span>
        <small>{b.reference}</small>
      </div>
      <h2>
        {b.journey.from}
        {b.journey.to ? " → " + b.journey.to : " · Local rental"}
      </h2>
      <p className="muted">
        {prettyDate(b.journey.date)} · {b.journey.time} IST · {b.category}
        {b.journey.mode === "roundtrip"
          ? ` · Return ${prettyDate(b.journey.returnDate)}`
          : ""}
        {b.journey.mode === "local"
          ? ` · ${packages.find((p) => p.id === b.journey.package)?.label}`
          : ""}
      </p>
      <div className="ops-customer">
        <div>
          <strong>{b.passenger.name}</strong>
          <a href={`tel:${b.passenger.phone}`}>{b.passenger.phone}</a>
          {b.passenger.email && <span>{b.passenger.email}</span>}
        </div>
        <div>
          <span>Pickup</span>
          <p>{b.passenger.pickup}</p>
          {b.passenger.drop && (
            <>
              <span>Drop</span>
              <p>{b.passenger.drop}</p>
            </>
          )}
        </div>
      </div>
      <div className="ops-fare">
        <span>
          Initial estimate <strong>{money(b.estimate.total)}</strong>
        </span>
        <span>
          Agreed fare{" "}
          <strong>
            {b.finalFare ? money(b.finalFare) : "Awaiting review"}
          </strong>
        </span>
      </div>
      {b.fareNote && <p className="ops-note">{b.fareNote}</p>}
      {b.status === "requested" && (
        <form
          className="ops-action"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action({
              action: "quote",
              fare: Number(f.get("fare")),
              note: f.get("note"),
              customerAgreed: f.get("agreed") === "on",
            });
          }}
        >
          <h3>01 · Agree the fare</h3>
          <p>
            Check partner availability and speak with the customer before
            approving.
          </p>
          <label className="ops-field">
            Final fare (₹)
            <input
              name="fare"
              type="number"
              min="1"
              max="1000000"
              step="1"
              defaultValue={b.estimate.total}
              required
            />
          </label>
          <label className="ops-field">
            Fare inclusions and exclusions
            <textarea
              name="note"
              minLength={5}
              maxLength={600}
              required
              placeholder="Record exactly what this fare covers."
            />
          </label>
          <label className="ops-check">
            <input name="agreed" type="checkbox" required /> Customer agreed to
            this fare and its terms.
          </label>
          <button className="button primary" disabled={busy}>
            Approve fare
            <Check size={16} />
          </button>
        </form>
      )}
      {b.status === "quoted" && (
        <form
          className="ops-action"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action({
              action: "assign",
              driverId: f.get("driver"),
              driverAgreed: f.get("agreed") === "on",
            });
          }}
        >
          <h3>02 · Assign a partner</h3>
          <p>
            Only active partners in the requested category are shown.
            Conflicting bookings are blocked.
          </p>
          <label className="ops-field">
            Driver partner
            <select name="driver" required defaultValue="">
              <option value="" disabled>
                Select a driver
              </option>
              {drivers
                .filter((d) => d.active && d.category === b.category)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.vehicle} · {d.plate}
                  </option>
                ))}
            </select>
          </label>
          <label className="ops-check">
            <input type="checkbox" name="agreed" required /> Driver accepted
            this journey and pickup time.
          </label>
          <button className="button primary" disabled={busy}>
            Assign driver
            <ArrowRight size={16} />
          </button>
        </form>
      )}
      {b.driver && (
        <div className="ops-partner">
          <CarFront size={23} />
          <div>
            <strong>{b.driver.name}</strong>
            <p>
              {b.driver.vehicle} · {b.driver.plate} · {b.driver.phone}
            </p>
          </div>
        </div>
      )}
      {b.status === "assigned" && (
        <div className="ops-action">
          <h3>03 · Confirm the booking</h3>
          <p>
            The fare is approved and a partner has accepted. Confirming updates
            the customer’s private status page and queues their confirmation
            message.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void action({ action: "confirm" })}
          >
            Confirm booking
            <Check size={16} />
          </button>
        </div>
      )}
      {b.status === "confirmed" && (
        <div className="ops-action">
          <h3>Ready for the journey.</h3>
          <p>Mark complete only after the driver has completed this ride.</p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void action({ action: "complete" })}
          >
            Mark trip completed
          </button>
        </div>
      )}
      {!!detail.notifications.length && (
        <section className="ops-notifications">
          <h3>Customer communication</h3>
          {detail.notifications.map((n) => (
            <article key={n.id}>
              <div className="ops-section-title">
                <strong>Booking update</strong>
                <span className="status-pill">
                  {n.status === "accepted"
                    ? "Accepted by SMS provider"
                    : n.status === "manual"
                      ? "Contact recorded"
                      : n.status}
                </span>
              </div>
              <p>{n.body}</p>
              {n.error && <p className="error-banner">{n.error}</p>}
              {n.provider_id && (
                <small>
                  Provider reference: {n.provider_id}. Acceptance does not
                  confirm handset delivery.
                </small>
              )}
              {n.status === "pending" && sms && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => notify(n.id, { action: "send" })}
                >
                  Send SMS now
                </button>
              )}
              {["pending", "failed", "unknown"].includes(n.status) &&
                !n.error?.startsWith("Superseded") && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      notify(n.id, { action: "manual", note: f.get("note") });
                    }}
                  >
                    <label className="ops-field">
                      Manual contact record
                      <textarea
                        name="note"
                        minLength={5}
                        maxLength={600}
                        required
                        placeholder="After calling or messaging: record channel, time and outcome."
                      />
                    </label>
                    <button disabled={busy} className="button secondary">
                      Record customer contacted
                    </button>
                  </form>
                )}
            </article>
          ))}
        </section>
      )}
      {!closed && (
        <div className="ops-close">
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setClosing(!closing)}
          >
            {closing ? "Keep request open" : "Cancel / decline request"}
          </button>
          {closing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void action({
                  action: b.status === "requested" ? "reject" : "cancel",
                  note: f.get("note"),
                });
              }}
            >
              <label className="ops-field">
                Reason
                <textarea name="note" minLength={5} maxLength={600} required />
              </label>
              <button className="button secondary" disabled={busy}>
                Close request
              </button>
            </form>
          )}
        </div>
      )}
      <details className="ops-audit">
        <summary>Activity history · {detail.events.length} events</summary>
        {detail.events.map((event) => (
          <div key={event.id}>
            <strong>
              {statusLabels[event.action as BookingStatus] ??
                event.action.replaceAll("_", " ")}
            </strong>
            <small>
              {new Date(event.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST · {event.actor}
            </small>
            {event.note && <p>{event.note}</p>}
          </div>
        ))}
      </details>
    </>
  );
}
