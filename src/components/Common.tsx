import Logo from "./BrandLogo";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Info,
  Luggage,
  Snowflake,
  Users,
} from "lucide-react";
import {
  brand,
  fleet,
  packages,
  serviceArea,
  serviceAreaLines,
} from "../config";
import type { Category, Journey } from "../config";
import { money, prettyDate, modeLabel } from "../booking";
import type { Fare } from "../booking";
export { default as Logo } from "./BrandLogo";
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && (
        <button className="text-button" onClick={action.onClick}>
          {action.label}
          <ArrowUpRight size={18} />
        </button>
      )}
    </div>
  );
}
export function Amenities({ category }: { category: Category }) {
  const c = fleet.find((c) => c.id === category)!;
  return (
    <div className="amenities">
      <span>
        <Users size={15} />
        {c.seats} seats
      </span>
      <span>
        <Luggage size={15} />
        {c.bags} {c.bags === 1 ? "bag" : "bags"}
      </span>
      <span>
        <Snowflake size={15} />
        AC
      </span>
    </div>
  );
}
export function FareBreakdown({
  fare,
  expanded = false,
}: {
  fare: Fare;
  expanded?: boolean;
}) {
  return (
    <details className="fare-breakdown" open={expanded || undefined}>
      <summary>
        Fare breakdown <ChevronDown size={16} />
      </summary>
      <dl>
        <div>
          <dt>Advertised one-way AC fare</dt>
          <dd>{money(fare.base)}</dd>
        </div>
        <div>
          <dt>Toll tax & parking</dt>
          <dd>Payable separately</dd>
        </div>
        <div className="fare-total">
          <dt>Route fare</dt>
          <dd>{money(fare.total)}</dd>
        </div>
      </dl>
    </details>
  );
}
export function JourneyDetails({ journey }: { journey: Journey }) {
  return (
    <div className="journey-details">
      <div className="route-line">
        <span className="route-dot" />
        <div>
          <small>{journey.mode === "local" ? "Rental city" : "Pickup"}</small>
          <strong>{journey.from}</strong>
        </div>
      </div>
      {journey.mode !== "local" && (
        <div className="route-line">
          <span className="route-dot end" />
          <div>
            <small>Destination</small>
            <strong>{journey.to}</strong>
          </div>
        </div>
      )}
      <div className="trip-meta">
        <span>{modeLabel(journey.mode)}</span>
        <span>
          {prettyDate(journey.date)} · {journey.time} IST
        </span>
        {journey.mode === "roundtrip" && (
          <span>Return: {prettyDate(journey.returnDate)}</span>
        )}
        {journey.mode === "local" && (
          <span>{packages.find((p) => p.id === journey.package)?.label}</span>
        )}
      </div>
    </div>
  );
}
export function DemoNotice() {
  return (
    <div className="demo-notice">
      <Info size={16} />
      <span>
        Tolls and parking are extra. Our team confirms availability and agrees your
        final fare before reserving a cab.
      </span>
    </div>
  );
}
export function Stepper({ step }: { step: number }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {["Your journey", "Choose a cab", "Trip review", "Request received"].map(
        (s, i) => (
          <li
            key={s}
            className={i <= step ? "done" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            <em>{s}</em>
          </li>
        ),
      )}
    </ol>
  );
}
export function Footer({
  navigate,
  onBook,
}: {
  navigate: (id: string) => void;
  onBook: () => void;
}) {
  return (
    <footer>
      <div className="container footer-top">
        <div className="footer-brand">
          <Logo onClick={onBook} light />
          <p>
            Your Bihar journey. A familiar comfort.
            <br />
            Let’s make the journey part of the story.
          </p>
          <span className="footer-tagline">{brand.tagline}</span>
        </div>
        <div>
          <h3>Explore {brand.name}</h3>
          <a href="/track">Track a request</a>
          <a href="/admin">Staff sign in</a>
          <a href="/privacy">Privacy & booking contact</a>
          <button onClick={() => navigate("services")}>Our services</button>
          <button onClick={() => navigate("routes")}>Popular routes</button>
          <button onClick={() => navigate("fleet")}>Our fleet</button>
          <button onClick={() => navigate("faqs")}>
            FAQs & draft policies
          </button>
        </div>
        <div>
          <h3>Our service area</h3>
          {serviceAreaLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>{serviceArea.notice}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {brand.name}. A concept for the road
          ahead.
        </span>
        <span>Partner drivers · Confirmed by our team.</span>
      </div>
    </footer>
  );
}
