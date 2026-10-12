import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Info,
  LoaderCircle,
  MapPin,
  Menu,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { brand, fleet, packages, policies } from "./config";
import type { Category, Journey, Passenger, TripMode } from "./config";
import {
  calculateFare,
  emptyPassenger,
  findRoute,
  initialJourney,
  modeLabel,
  money,
  prettyDate,
  validateJourney,
  validatePassenger,
} from "./booking";
import BookingForm from "./components/BookingForm";
import Home from "./components/Home";
import {
  Amenities,
  DemoNotice,
  FareBreakdown,
  Footer,
  JourneyDetails,
  Logo,
  Stepper,
} from "./components/Common";
import imageCredits from "./image-credits.json";
type Stage = "home" | "results" | "review" | "confirmation";
export default function App() {
  const [stage, setStage] = useState<Stage>("home");
  const [journey, setJourney] = useState<Journey>(initialJourney);
  const [draft, setDraft] = useState<Journey>(journey);
  const [passenger, setPassenger] = useState<Passenger>(emptyPassenger);
  const [selected, setSelected] = useState<Category>("sedan");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("ready");
  const [category, setCategory] = useState<Category | "all">("all");
  const [seats, setSeats] = useState(0);
  const [sort, setSort] = useState("low");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [dialog, setDialog] = useState<"credits" | "policy" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorOnce = useRef(
    new URLSearchParams(window.location.search).get("scenario") === "error",
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (stage !== "home") headingRef.current?.focus();
  }, [stage]);
  useEffect(() => {
    if (dialog) {
      dialogRef.current?.showModal();
    } else dialogRef.current?.close();
  }, [dialog]);
  const goHome = (id = "booking") => {
    setStage("home");
    setEditing(false);
    setMobileMenu(false);
    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
    }, 40);
  };
  const search = (value = journey) => {
    setJourney(value);
    setEditing(false);
    setErrors({});
    setCategory("all");
    setSeats(0);
    setStage("results");
    setStatus("loading");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus(errorOnce.current ? "error" : "ready");
      errorOnce.current = false;
    }, 650);
  };
  const chooseRoute = (from: string, to: string) => {
    setJourney((j) => ({ ...j, mode: "oneway", from, to }));
    goHome();
  };
  const chooseMode = (mode: TripMode) => {
    setJourney((j) => ({ ...j, mode }));
    goHome();
  };
  const edit = () => {
    setDraft({ ...journey });
    setEditing(true);
  };
  const cab = fleet.find((c) => c.id === selected)!;
  const fare = calculateFare(journey, selected);
  const route = findRoute(journey);
  const available = journey.mode === "local" || route;
  const filtered = fleet
    .filter(
      (c) => (category === "all" || c.id === category) && c.seats >= seats,
    )
    .sort((a, b) => {
      const difference =
        (calculateFare(journey, a.id)?.total || 0) -
        (calculateFare(journey, b.id)?.total || 0);
      return sort === "low" ? difference : -difference;
    });
  const reset = () => {
    setJourney(initialJourney());
    setPassenger(emptyPassenger());
    setErrors({});
    setConfirmation("");
    setSelected("sedan");
    setStatus("ready");
    setCategory("all");
    setSeats(0);
    goHome();
  };
  const updatePassenger = (key: keyof Passenger, value: string) => {
    setPassenger((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const confirm = () => {
    const next = validatePassenger(passenger, journey.mode);
    if (Object.keys(validateJourney(journey)).length)
      next.journey =
        "Your departure has passed or your journey needs updating. Go back and edit your journey.";
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(
        () =>
          document
            .querySelector<HTMLInputElement>('[aria-invalid="true"]')
            ?.focus(),
        0,
      );
      return;
    }
    setConfirmation(`JC-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`);
    setStage("confirmation");
  };
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="container header-inner">
          <Logo
            onClick={() => {
              setStage("home");
              setMobileMenu(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <nav
            className={mobileMenu ? "nav is-open" : "nav"}
            aria-label="Main navigation"
          >
            {[
              ["Services", "services"],
              ["Popular Routes", "routes"],
              ["Our Fleet", "fleet"],
              ["FAQs", "faqs"],
            ].map(([label, id]) => (
              <button key={id} onClick={() => goHome(id)}>
                {label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <span className="demo-tag">CLIENT DEMO</span>
            <button
              className="button primary header-book"
              onClick={() => goHome()}
            >
              Book a Cab
              <ArrowUpRight size={17} />
            </button>
            <button
              className="menu-toggle icon-button"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        {stage === "home" ? (
          <Home
            journey={journey}
            setJourney={setJourney}
            onSearch={() => search()}
            onRoute={chooseRoute}
            onMode={chooseMode}
            onBook={() => goHome()}
          />
        ) : (
          <div className="flow-page">
            <div className="container flow-container">
              <Stepper
                step={stage === "results" ? 1 : stage === "review" ? 2 : 3}
              />
              {stage === "results" && (
                <>
                  <button className="back-link" onClick={() => goHome()}>
                    <ArrowLeft size={16} />
                    Back to your journey
                  </button>
                  <div className="flow-heading">
                    <div>
                      <span className="eyebrow">
                        THE NEXT PART IS THE EASY PART
                      </span>
                      <h1 ref={headingRef} tabIndex={-1}>
                        Your journey. Your kind of cab.
                      </h1>
                      <p>Make yourself comfortable. Find the ride that fits.</p>
                    </div>
                    <span className="soft-badge">
                      <ShieldCheck size={16} />
                      Illustrative fares, clearly explained
                    </span>
                  </div>
                  {editing ? (
                    <BookingForm
                      journey={draft}
                      onChange={setDraft}
                      onSearch={() => search(draft)}
                      compact
                      searchLabel="Update search"
                      onCancel={() => setEditing(false)}
                    />
                  ) : (
                    <div className="journey-summary">
                      <div className="journey-summary-route">
                        <MapPin size={20} />
                        <strong>
                          {journey.from}{" "}
                          {journey.mode !== "local" && (
                            <>
                              <ArrowRight size={19} />
                              {journey.to}
                            </>
                          )}
                        </strong>
                        <span className="mode-pill">
                          {modeLabel(journey.mode)}
                        </span>
                      </div>
                      <div className="journey-summary-meta">
                        <span>
                          {prettyDate(journey.date)} · {journey.time} IST
                        </span>
                        {journey.mode === "roundtrip" && (
                          <span>Return {prettyDate(journey.returnDate)}</span>
                        )}
                        {journey.mode === "local" && (
                          <span>
                            {
                              packages.find((p) => p.id === journey.package)
                                ?.label
                            }
                          </span>
                        )}
                        <button className="text-button" onClick={edit}>
                          <Pencil size={14} />
                          Edit journey
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="results-layout">
                    <aside className="filters">
                      <h2>
                        <SlidersHorizontal size={18} />
                        Refine your ride
                      </h2>
                      <fieldset>
                        <legend>Vehicle category</legend>
                        {[{ id: "all", title: "All cabs" }, ...fleet].map(
                          (c) => (
                            <label className="filter-choice" key={c.id}>
                              <input
                                type="radio"
                                name="category"
                                checked={category === c.id}
                                onChange={() =>
                                  setCategory(c.id as Category | "all")
                                }
                              />
                              <span>{c.title}</span>
                            </label>
                          ),
                        )}
                      </fieldset>
                      <fieldset>
                        <legend>Room for everyone</legend>
                        <label
                          htmlFor="passengers-filter"
                          className="small-label"
                        >
                          Passenger capacity
                        </label>
                        <select
                          id="passengers-filter"
                          value={seats}
                          onChange={(e) => setSeats(Number(e.target.value))}
                        >
                          <option value={0}>Any capacity</option>
                          <option value={4}>4 or more passengers</option>
                          <option value={6}>6 passengers</option>
                        </select>
                      </fieldset>
                      <button
                        className="text-button"
                        onClick={() => {
                          setCategory("all");
                          setSeats(0);
                        }}
                      >
                        <RotateCcw size={14} />
                        Reset filters
                      </button>
                      <div className="filter-help">
                        <Info size={20} />
                        <h3>A clear starting point</h3>
                        <p>
                          Estimates include sample tax and itemised tolls. Final
                          availability and charges would be confirmed by the
                          provider.
                        </p>
                      </div>
                    </aside>
                    <div className="results-content" aria-live="polite">
                      {status === "loading" ? (
                        <div className="state-panel">
                          <LoaderCircle className="spinner" size={36} />
                          <h2>Finding your kind of ride…</h2>
                          <p>Preparing your sample cab options.</p>
                        </div>
                      ) : status === "error" ? (
                        <div className="state-panel">
                          <CircleAlert size={38} />
                          <h2>Let’s give that another try.</h2>
                          <p>
                            The demo search couldn’t finish. Your journey is
                            still here.
                          </p>
                          <button
                            className="button primary"
                            onClick={() => search()}
                          >
                            <RotateCcw size={17} />
                            Try again
                          </button>
                        </div>
                      ) : !available ? (
                        <div className="state-panel">
                          <MapPin size={38} />
                          <h2>A road we haven’t mapped yet.</h2>
                          <p>
                            This demo includes six intercity routes and their
                            reverse journeys. Try a featured route, or explore a
                            local rental.
                          </p>
                          <button
                            className="button primary"
                            onClick={() => {
                              const next = {
                                ...journey,
                                from: "Mumbai",
                                to: "Pune",
                              };
                              search(next);
                            }}
                          >
                            Explore Mumbai → Pune
                            <ArrowRight size={16} />
                          </button>
                          <button className="text-button" onClick={edit}>
                            Choose another journey
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="results-toolbar">
                            <span>
                              <strong>{filtered.length}</strong>{" "}
                              {filtered.length === 1
                                ? "cab option"
                                : "cab options"}{" "}
                              for your journey
                            </span>
                            <label>
                              Sort by
                              <select
                                aria-label="Sort cabs"
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                              >
                                <option value="low">Price: low to high</option>
                                <option value="high">Price: high to low</option>
                              </select>
                              <ChevronDown size={14} />
                            </label>
                          </div>
                          {!filtered.length ? (
                            <div className="state-panel">
                              <Search size={36} />
                              <h2>A little more room?</h2>
                              <p>
                                No sample cabs match these filters. Clear them
                                to see every option.
                              </p>
                              <button
                                className="button primary"
                                onClick={() => {
                                  setCategory("all");
                                  setSeats(0);
                                }}
                              >
                                Clear filters
                              </button>
                            </div>
                          ) : (
                            filtered.map((c) => {
                              const f = calculateFare(journey, c.id)!;
                              return (
                                <article
                                  className={`cab-card ${c.id === "sedan" ? "recommended" : ""}`}
                                  key={c.id}
                                >
                                  {c.id === "sedan" && (
                                    <div className="recommendation">
                                      <Check size={13} />A LITTLE EXTRA COMFORT
                                    </div>
                                  )}
                                  <div className="cab-main">
                                    <img
                                      className="cab-image"
                                      src={`/images/${c.image}.jpg`}
                                      alt={`Representative ${c.models}`}
                                    />
                                    <div className="cab-description">
                                      <span className="eyebrow">
                                        {c.id === "hatchback"
                                          ? "PACK LIGHT, GO FAR"
                                          : c.id === "sedan"
                                            ? "SETTLE IN"
                                            : c.id === "suv"
                                              ? "BETTER TOGETHER"
                                              : "ENJOY THE EXTRA SPACE"}
                                      </span>
                                      <h2>{c.title}</h2>
                                      <p>{c.models}</p>
                                      <Amenities category={c.id} />
                                      <span className="cab-distance">
                                        <Check size={13} />
                                        {f.km} km{" "}
                                        {journey.mode === "local"
                                          ? "package"
                                          : "fare basis"}
                                        {journey.mode === "roundtrip"
                                          ? ` · ${f.days} day${f.days > 1 ? "s" : ""}`
                                          : ""}
                                      </span>
                                    </div>
                                    <div className="cab-price">
                                      <small>Estimated total</small>
                                      <strong>{money(f.total)}</strong>
                                      <span>Includes sample tax</span>
                                      <button
                                        className="button primary"
                                        onClick={() => {
                                          setSelected(c.id);
                                          setErrors({});
                                          setStage("review");
                                        }}
                                      >
                                        Select Cab
                                        <ArrowRight size={17} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="cab-bottom">
                                    <FareBreakdown fare={f} />
                                    <button
                                      className="text-button policy-button"
                                      onClick={() => setDialog("policy")}
                                    >
                                      Inclusions & cancellation
                                      <Info size={14} />
                                    </button>
                                  </div>
                                </article>
                              );
                            })
                          )}
                          <p className="result-disclaimer">
                            {journey.mode === "roundtrip"
                              ? "Round trips use the greater of route distance × 2 or 250 km per day, plus ₹300 driver allowance per day. "
                              : ""}
                            {journey.mode === "local"
                              ? "Both package limits apply. Extra distance, overtime, tolls and parking are excluded. "
                              : ""}
                            Illustrative estimates only. Vehicle photos and
                            models are representative.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <DemoNotice />
                </>
              )}
              {stage === "review" && fare && (
                <>
                  <button
                    className="back-link"
                    onClick={() => setStage("results")}
                  >
                    <ArrowLeft size={16} />
                    Back to cab options
                  </button>
                  <div className="flow-heading">
                    <div>
                      <span className="eyebrow">ALMOST ON YOUR WAY</span>
                      <h1 ref={headingRef} tabIndex={-1}>
                        Make this journey yours.
                      </h1>
                      <p>A few details, and your demo booking is ready.</p>
                    </div>
                  </div>
                  <form
                    className="review-layout"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      confirm();
                    }}
                  >
                    <div className="review-form">
                      <section className="surface">
                        <h2>
                          <span className="mini-number">01</span>Who’s coming
                          along?
                        </h2>
                        <p className="muted">
                          Add the lead passenger’s details. Use sample
                          information for this demo.
                        </p>
                        <div className="passenger-fields">
                          {[
                            {
                              key: "name" as const,
                              label: "Full name",
                              placeholder: "e.g. Alex Kumar",
                              type: "text",
                            },
                            {
                              key: "phone" as const,
                              label: "Mobile number",
                              placeholder: "e.g. 9876543210",
                              type: "tel",
                            },
                            {
                              key: "email" as const,
                              label: "Email address (optional)",
                              placeholder: "e.g. alex@example.com",
                              type: "email",
                            },
                          ].map((field) => (
                            <div
                              className={`review-field ${field.key === "name" ? "full" : ""}`}
                              key={field.key}
                            >
                              <label htmlFor={`passenger-${field.key}`}>
                                {field.label}
                              </label>
                              <input
                                id={`passenger-${field.key}`}
                                name={field.key}
                                autoComplete="off"
                                type={field.type}
                                value={passenger[field.key]}
                                placeholder={field.placeholder}
                                maxLength={field.key === "phone" ? 16 : 120}
                                onChange={(e) =>
                                  updatePassenger(field.key, e.target.value)
                                }
                                aria-invalid={!!errors[field.key]}
                                aria-describedby={
                                  errors[field.key]
                                    ? `${field.key}-error`
                                    : undefined
                                }
                              />
                              {errors[field.key] && (
                                <small
                                  className="field-error"
                                  id={`${field.key}-error`}
                                >
                                  {errors[field.key]}
                                </small>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="surface">
                        <h2>
                          <span className="mini-number">02</span>Let’s get the
                          little details right.
                        </h2>
                        <p className="muted">
                          Your pickup is in {journey.from}
                          {journey.mode !== "local"
                            ? `, with a drop in ${journey.to}`
                            : ". Your local rental returns within the city"}
                          .
                        </p>
                        {[
                          {
                            key: "pickup" as const,
                            label: `Pickup address · ${journey.from}`,
                            placeholder:
                              "Building, street and a nearby landmark",
                          },
                          ...(journey.mode === "local"
                            ? []
                            : [
                                {
                                  key: "drop" as const,
                                  label: `Drop address · ${journey.to}`,
                                  placeholder:
                                    "Building, street and a nearby landmark",
                                },
                              ]),
                        ].map((f) => (
                          <div
                            className="review-field address-field"
                            key={f.key}
                          >
                            <label htmlFor={`address-${f.key}`}>
                              {f.label}
                            </label>
                            <textarea
                              id={`address-${f.key}`}
                              rows={2}
                              maxLength={400}
                              value={passenger[f.key]}
                              placeholder={f.placeholder}
                              onChange={(e) =>
                                updatePassenger(f.key, e.target.value)
                              }
                              aria-invalid={!!errors[f.key]}
                              aria-describedby={
                                errors[f.key] ? `${f.key}-error` : undefined
                              }
                            />
                            {errors[f.key] && (
                              <small
                                className="field-error"
                                id={`${f.key}-error`}
                              >
                                {errors[f.key]}
                              </small>
                            )}
                          </div>
                        ))}
                      </section>
                      <div className="privacy-note">
                        <ShieldCheck size={20} />
                        <p>
                          Your details stay in this page’s memory. Nothing is
                          sent, saved to storage, or used to contact you.
                          Refreshing clears them.
                        </p>
                      </div>
                      {errors.journey && (
                        <p className="error-banner" role="alert">
                          {errors.journey}
                        </p>
                      )}
                    </div>
                    <aside className="trip-review surface">
                      <div className="review-summary-title">
                        <h2>Your journey</h2>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setStage("results");
                            edit();
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <JourneyDetails journey={journey} />
                      <div className="selected-cab">
                        <img src={`/images/${cab.image}.jpg`} alt={cab.title} />
                        <div>
                          <strong>{cab.title}</strong>
                          <small>{cab.models}</small>
                        </div>
                      </div>
                      <Amenities category={selected} />
                      <FareBreakdown fare={fare} expanded />
                      <p className="fare-caveat">
                        Illustrative total · {fare.km} km{" "}
                        {journey.mode === "local" ? "package" : "fare basis"}
                        {journey.mode === "roundtrip"
                          ? ` · ${fare.days} days (250 km/day minimum)`
                          : ""}
                        . Parking and additional usage excluded.
                      </p>
                      <button
                        type="button"
                        className="text-button review-policy"
                        onClick={() => setDialog("policy")}
                      >
                        Review draft policies
                        <ArrowUpRight size={14} />
                      </button>
                      <button
                        className="button primary confirm-button"
                        type="submit"
                      >
                        Confirm Demo Booking
                        <ArrowRight size={18} />
                      </button>
                      <small className="no-payment">
                        <ShieldCheck size={13} />
                        No payment. No real reservation.
                      </small>
                    </aside>
                  </form>
                </>
              )}
              {stage === "confirmation" && fare && (
                <div className="confirmation-wrap">
                  <div className="success-icon">
                    <CheckCircle2 size={42} strokeWidth={1.5} />
                  </div>
                  <span className="eyebrow">HERE’S TO THE NEXT CHAPTER</span>
                  <h1 ref={headingRef} tabIndex={-1}>
                    Your demo journey is ready.
                  </h1>
                  <p>
                    Thanks, {passenger.name.trim().split(" ")[0]}. That’s how
                    easy planning a ride can feel.
                  </p>
                  <div className="confirmation-notice">
                    <Info size={18} />
                    <strong>{brand.demoNotice}</strong>
                  </div>
                  <div className="confirmation-ticket">
                    <div className="ticket-top">
                      <Logo onClick={() => goHome()} />
                      <span>SIMULATED CONFIRMATION</span>
                    </div>
                    <div className="reference-row">
                      <div>
                        <small>Demo booking reference</small>
                        <strong>{confirmation}</strong>
                      </div>
                      <span className="mode-pill">
                        {modeLabel(journey.mode)}
                      </span>
                    </div>
                    <div className="ticket-columns">
                      <JourneyDetails journey={journey} />
                      <div className="ticket-vehicle">
                        <img src={`/images/${cab.image}.jpg`} alt={cab.title} />
                        <strong>{cab.title}</strong>
                        <small>{cab.models}</small>
                        <Amenities category={selected} />
                      </div>
                    </div>
                    <div className="ticket-addresses">
                      <p>
                        <strong>Pickup</strong>
                        {passenger.pickup}
                      </p>
                      {journey.mode !== "local" && (
                        <p>
                          <strong>Drop</strong>
                          {passenger.drop}
                        </p>
                      )}
                    </div>
                    <div className="ticket-total">
                      <span>
                        Estimated journey total
                        <small>Illustrative fare · no payment collected</small>
                      </span>
                      <strong>{money(fare.total)}</strong>
                    </div>
                  </div>
                  <p className="confirmation-footnote">
                    No driver has been assigned. No messages have been sent.
                    <br />
                    Your sample details will clear when you start again or
                    refresh.
                  </p>
                  <button className="button primary" onClick={reset}>
                    Start a New Booking
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer navigate={goHome} onBook={() => goHome()} />
      <div className="credits-bar">
        <span>Built for the possibilities ahead.</span>
        <button onClick={() => setDialog("credits")}>
          Photography & image credits
          <ArrowUpRight size={12} />
        </button>
      </div>
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="dialog-title"
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setDialog(null);
        }}
      >
        <div className="modal-heading">
          <h2 id="dialog-title">
            {dialog === "credits"
              ? "The people behind the pictures"
              : "A clear view of your fare"}
          </h2>
          <button
            className="icon-button"
            onClick={() => setDialog(null)}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>
        {dialog === "credits" ? (
          <>
            <p className="muted">
              Locally bundled photographs, used under the licenses below.
              Vehicle images are illustrative; no creator endorsement is
              implied.
            </p>
            <div className="image-credits">
              {imageCredits.map((c) => (
                <article key={c.filename}>
                  <img src={`/images/${c.filename}`} alt="" loading="lazy" />
                  <div>
                    <a href={c.source} target="_blank" rel="noreferrer">
                      {c.title}
                      <ArrowUpRight size={12} />
                    </a>
                    <p>
                      Photo by {c.creator} ·{" "}
                      <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                        {c.license}
                      </a>
                    </p>
                    <small>
                      {c.changes} Photographs and their displayed adaptations
                      retain their listed license.
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="policy-content">
            <span className="soft-badge">{policies.label}</span>
            <h3>What’s in the estimate</h3>
            <p>{policies.inclusions}</p>
            <h3>What’s extra</h3>
            <p>{policies.exclusions}</p>
            <h3>If plans change</h3>
            <p>{policies.cancellation}</p>
            <h3>How this demo calculates fares</h3>
            <p>
              One way: sample distance × category rate. Round trip: the greater
              of twice the route distance or 250 km per calendar day, plus ₹300
              driver allowance per day. Local: a fixed 4-hour / 40 km or 8-hour
              / 80 km package. A sample 5% tax applies to base fare and driver
              allowance; toll estimates are added separately.
            </p>
            <button className="button primary" onClick={() => setDialog(null)}>
              Got it
              <Check size={17} />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
