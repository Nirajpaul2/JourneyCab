import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Phone,
  CarFront,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api";
import { packages } from "../config";
import { money, prettyDate } from "../booking";
import { statusLabels } from "../operations-types";
import type { PublicBooking } from "../operations-types";
export default function Tracking() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [token, setToken] = useState(params.get("key") ?? "");
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      setBooking(
        await api<PublicBooking>(
          `/api/bookings/${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!reference || !token) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => clearInterval(timer);
  }, [reference, token]);
  const closed = booking && ["cancelled", "rejected"].includes(booking.status);
  return (
    <div className="ops-page track-page">
      <header className="ops-top">
        <a className="ops-brand" href="/">
          journeycab<span>.</span>
        </a>
        <span className="ops-top-label">
          <ShieldCheck size={16} /> Private booking status
        </span>
      </header>
      <main className="tracking-content">
        <a className="back-link" href="/">
          <ArrowLeft size={16} /> Back to journeys
        </a>
        {!reference || !token ? (
          <section className="surface">
            <span className="eyebrow">YOUR JOURNEY, AT A GLANCE</span>
            <h1>Check your ride request.</h1>
            <p>
              Open the private status link saved after requesting your ride. It
              includes your reference and access key.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setReference(String(data.get("reference")).trim());
                setToken(String(data.get("key")).trim());
              }}
            >
              <label className="ops-field">
                Booking reference
                <input name="reference" required placeholder="JC-…" defaultValue={reference} />
              </label>
              <label className="ops-field">
                Private access key
                <input name="key" type="password" required autoComplete="off" />
              </label>
              <button className="button primary">View request</button>
            </form>
            <p className="muted">
              Your private link was shown on the request receipt. If you saved
              it, open that link directly. A booking reference alone cannot
              unlock the ride details. This page shows booking status, not live
              vehicle location.
            </p>
          </section>
        ) : (
          <>
            <div className="ops-heading">
              <div>
                <span className="eyebrow">YOUR BIHAR JOURNEY</span>
                <h1>
                  {booking
                    ? statusLabels[booking.status]
                    : "Finding your request…"}
                </h1>
                <p>{reference}</p>
              </div>
              <button
                className="button secondary"
                onClick={() => void refresh()}
                disabled={busy}
              >
                <RefreshCw size={16} /> Refresh status
              </button>
            </div>
            {error && (
              <p role="alert" className="error-banner">
                {error}
              </p>
            )}
            {booking && (
              <>
                <div className={`request-banner ${closed ? "closed" : ""}`}>
                  {booking.status === "confirmed" ||
                  booking.status === "completed" ? (
                    <CheckCircle2 />
                  ) : (
                    <Clock3 />
                  )}
                  <div>
                    <strong>
                      {closed
                        ? "This request is closed."
                        : booking.status === "confirmed"
                          ? "Your team has confirmed this booking."
                          : booking.status === "completed"
                            ? "Your trip is marked complete."
                            : "Your request is with our booking team."}
                    </strong>
                    <p>
                      {closed
                        ? "Please contact the booking team before making new travel plans."
                        : booking.status === "confirmed"
                          ? "Your agreed fare and partner-driver details are below."
                          : "Submitting a request does not reserve a cab. Our team checks availability and agrees the fare with you before confirmation."}
                    </p>
                  </div>
                </div>
                {!closed && (
                  <ol className="request-timeline">
                    {(
                      ["requested", "quoted", "assigned", "confirmed"] as const
                    ).map((s, i) => (
                      <li
                        key={s}
                        className={
                          [
                            "requested",
                            "quoted",
                            "assigned",
                            "confirmed",
                            "completed",
                          ].indexOf(booking.status) >= i
                            ? "done"
                            : ""
                        }
                      >
                        <span>{i + 1}</span>
                        {statusLabels[s]}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="tracking-grid">
                  <section className="surface">
                    <span className="eyebrow">JOURNEY DETAILS</span>
                    <h2>
                      {booking.journey.from}
                      {booking.journey.to
                        ? ` → ${booking.journey.to}`
                        : " · Local rental"}
                    </h2>
                    <p>
                      {prettyDate(booking.journey.date)} ·{" "}
                      {booking.journey.time} IST
                    </p>
                    {booking.journey.mode === "local" && (
                      <p>
                        {
                          packages.find((p) => p.id === booking.journey.package)
                            ?.label
                        }
                      </p>
                    )}
                    {booking.journey.mode === "roundtrip" && (
                      <p>Return: {prettyDate(booking.journey.returnDate)}</p>
                    )}
                    <p className="muted">
                      Requested category: {booking.category.replace("-", " ")}
                    </p>
                    <hr />
                    <span className="muted">
                      {booking.finalFare
                        ? "Agreed fare"
                        : "Initial estimate · awaiting approval"}
                    </span>
                    <strong className="tracking-fare">
                      {money(booking.finalFare ?? booking.estimate.total)}
                    </strong>
                    <p>
                      {booking.fareNote ||
                        "The team will confirm the final fare and inclusions with you."}
                    </p>
                  </section>
                  <section className="surface">
                    <CarFront size={28} />
                    <h2>Your partner driver</h2>
                    {booking.driver ? (
                      <>
                        <h3>{booking.driver.name}</h3>
                        {booking.category === "hatchback" && booking.driver.category === "sedan" && (
                          <p>Customer-approved Sedan upgrade · agreed fare unchanged.</p>
                        )}
                        <p>
                          {booking.driver.vehicle} · {booking.driver.plate}
                        </p>
                        <a
                          className="button secondary"
                          href={`tel:+91${booking.driver.phone}`}
                        >
                          <Phone size={16} />
                          {booking.driver.phone}
                        </a>
                      </>
                    ) : (
                      <p>
                        Driver contact and vehicle details appear here after
                        your team confirms the booking.
                      </p>
                    )}
                  </section>
                </div>
                <p className="muted">
                  Last updated{" "}
                  {new Date(booking.updatedAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST. This page refreshes every 30 seconds.
                </p>
                <p className="privacy-note">
                  Keep this private link safe. Anyone with the link can view
                  this booking’s status and assigned driver.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
