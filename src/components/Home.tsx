import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Headphones,
  MapPin,
  MoveUpRight,
  Quote,
  Route,
  ShieldCheck,
  Sparkles,
  Wallet,
  CarFront,
  Navigation,
} from "lucide-react";
import type { Journey, TripMode } from "../config";
import { advertisedCategories, faqs, fleet, policies, routes, serviceArea } from "../config";
import { money } from "../booking";
import BookingForm from "./BookingForm";
import { Amenities, SectionHeading } from "./Common";
export default function Home({
  journey,
  setJourney,
  onSearch,
  onRoute,
  onMode,
  onBook,
}: {
  journey: Journey;
  setJourney: (j: Journey) => void;
  onSearch: () => void;
  onRoute: (from: string, to: string) => void;
  onMode: (mode: TripMode) => void;
  onBook: () => void;
}) {
  const benefits = [
    {
      icon: Wallet,
      title: "Know your fare",
      copy: "A clear estimate, before you decide.",
    },
    {
      icon: CarFront,
      title: "Find your kind of cab",
      copy: "From light packing to the whole family.",
    },
    {
      icon: MapPin,
      title: "Begin at your doorstep",
      copy: "Add a pickup that works for your plans.",
    },
    {
      icon: Headphones,
      title: "A little help along the way",
      copy: "Find answers before you set off.",
    },
  ];
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" /> BIHAR, ONE COMFORTABLE RIDE AT A
            TIME.
          </span>
          <h1 id="hero-title">
            Your next city
            <br />
            is one <span className="serif">comfortable</span>
            <br />
            <span className="highlight-word">
              ride away.
              <svg
                viewBox="0 0 320 16"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M3 10Q160-3 315 7M30 15Q172 5 287 12" />
              </svg>
            </span>
          </h1>
          <p>
            Travel across Bihar and on selected routes to Uttar Pradesh,
            <br className="desktop-break" /> and see your fare upfront.
          </p>
          <div className="hero-chips">
            <span>
              <Check size={15} />
              Your route, your pace
            </span>
            <span>
              <Check size={15} />
              Room to feel at home
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={`/images/${serviceArea.heroImage}.jpg`}
            alt={serviceArea.heroAlt}
            fetchPriority="high"
          />
          <div className="hero-image-shade" />
          <div className="hero-stamp">
            <Compass size={30} strokeWidth={1.3} />
            <span>
              A LITTLE FURTHER.
              <br />A LITTLE FREER.
            </span>
          </div>
          <div className="hero-image-caption">
            <span>
              <MapPin size={14} /> {serviceArea.heroLocation}
            </span>
            <strong>
              The journey is
              <br />
              part of the story.
            </strong>
          </div>
          <span className="image-counter">01 — 06</span>
        </div>
        <div id="booking" className="hero-booking">
          <BookingForm
            journey={journey}
            onChange={setJourney}
            onSearch={onSearch}
          />
        </div>
        <div className="hero-bottom">
          <span>
            <ShieldCheck size={16} />
            Your plans. Your choice. Your journey.
          </span>
          <a href="#routes">
            A little inspiration below <ArrowDown size={14} />
          </a>
        </div>
      </section>
      <section id="services" className="benefits-section">
        <div className="container benefits">
          {benefits.map((b) => (
            <div className="benefit" key={b.title}>
              <b.icon size={24} strokeWidth={1.5} />
              <div>
                <h3>{b.title}</h3>
                <p>{b.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="routes" className="section routes-section">
        <div className="container">
          <SectionHeading
            eyebrow="A CHANGE OF SCENERY"
            title="Your route. Your one-way fare."
            description="Published fares for a five-seater AC car. Choose a route to plan your pickup."
            action={{ label: "Plan your own journey", onClick: onBook }}
          />
          <div className="published-routes">
            {routes.map((r) => (
              <button
                className="published-route"
                key={`${r.from}-${r.to}`}
                onClick={() => onRoute(r.from, r.to)}
                aria-label={`Book ${r.from} to ${r.to} for ${money(r.fare)}, tolls and parking extra`}
              >
                <span className="published-route-path">
                  <span>{r.from}</span><ArrowRight size={16} /><span>{r.to}</span>
                </span>
                <span className="published-route-price">
                  <strong>{money(r.fare)}</strong><ArrowUpRight size={17} />
                </span>
              </button>
            ))}
          </div>
          <p className="section-note">
            One-way fares apply in the direction shown. Toll tax and parking are
            extra. Availability and the final fare are confirmed by our team.
          </p>
        </div>
      </section>
      <section className="section services-band">
        <div className="container">
          <div className="services-intro">
            <span className="eyebrow">YOUR DAY, YOUR WAY</span>
            <h2>
              One city over.
              <br />
              Or all around town.
            </h2>
          </div>
          <div className="service-options">
            {[
              {
                mode: "oneway" as const,
                icon: MoveUpRight,
                title: "One-way journeys",
                copy: "On to the next city, with no return leg to plan.",
              },
              {
                mode: "roundtrip" as const,
                icon: Route,
                title: "There & back again",
                copy: "Separate quote required. Online fares coming later.",
              },
              {
                mode: "local" as const,
                icon: Navigation,
                title: "A city at your pace",
                copy: "Separate quote required. Online fares coming later.",
              },
            ].map((s) => (
              <button
                key={s.mode}
                onClick={() => onMode(s.mode)}
                className="service-option"
              >
                <s.icon size={25} strokeWidth={1.4} />
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.copy}</p>
                </div>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        </div>
      </section>
      <section id="fleet" className="section fleet-section">
        <div className="container">
          <SectionHeading
            eyebrow="GOOD COMPANY. A COMFORTABLE CAB."
            title="Find your perfect travel companion."
            description="Five-seater AC cars, with space for up to four passengers and a driver."
          />
          <div className="fleet-grid">
            {fleet.filter((c) => advertisedCategories.includes(c.id)).map((c, i) => (
              <article className="fleet-card" key={c.id}>
                <div className="fleet-photo">
                  <img
                    src={`/images/${c.image}.jpg`}
                    alt={`Representative ${c.title}: ${c.models}`}
                    loading="lazy"
                  />
                  <span>
                    {
                      [
                        "LIGHT & EASY",
                        "EVERYDAY COMFORT",
                        "ROOM FOR MORE",
                        "THE EXTRA MILE",
                      ][i]
                    }
                  </span>
                </div>
                <div className="fleet-content">
                  <h3>{c.title}</h3>
                  <p className="fleet-model">{c.models}</p>
                  <Amenities category={c.id} />
                  <p className="fleet-description">{c.description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="section-note">
            Vehicle photos are illustrative. Model and availability would be
            confirmed by the provider.
          </p>
        </div>
      </section>
      <section className="how-section">
        <div className="container">
          <div className="how-heading">
            <span className="eyebrow">FROM “LET’S GO” TO ON YOUR WAY</span>
            <h2>
              A good journey starts
              <br />
              with four simple steps.
            </h2>
            <p>
              Less to figure out.
              <br />
              More to look forward to.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                title: "Choose your route",
                copy: "Tell us where and when you’d like to go.",
              },
              {
                title: "Select your cab",
                copy: "Compare space, comfort and a clear fare.",
              },
              {
                title: "Review your trip",
                copy: "Add the little details that make it your journey.",
              },
              {
                title: "We confirm your ride",
                copy: "Our team agrees the fare, assigns a partner driver, and confirms your ride.",
              },
            ].map((s, i) => (
              <div className="how-step" key={s.title}>
                <span className="step-number">
                  0{i + 1}
                  {i < 3 && <ArrowRight size={16} />}
                </span>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section feedback-section">
        <div className="container">
          <SectionHeading
            eyebrow="LITTLE MOMENTS. LONG-LASTING MEMORIES."
            title="It’s more than getting there."
            description="A glimpse of the experience we’re designing for."
          />
          <div className="feedback-grid">
            {[
              {
                quote:
                  "Coffee in the city. Lunch in the hills. The best part was leaving the planning behind.",
                initials: "AK",
                name: "A weekend explorer",
                route: `${routes[2].from} → ${routes[2].to}`,
              },
              {
                quote:
                  "Enough room for the bags, the snacks, and everyone’s favourite road-trip playlist.",
                initials: "MS",
                name: "A family on the move",
                route: `${routes[4].from} → ${routes[4].to}`,
              },
              {
                quote:
                  "Seeing the full estimate before choosing a cab made the whole journey feel simpler.",
                initials: "RP",
                name: "A thoughtful planner",
                route: `${routes[0].from} → ${routes[0].to}`,
              },
            ].map((t) => (
              <article className="feedback-card" key={t.name}>
                <div className="quote-top">
                  <Quote size={25} strokeWidth={1.2} />
                  <span>SAMPLE STORY</span>
                </div>
                <blockquote>“{t.quote}”</blockquote>
                <div className="sample-person">
                  <span className="avatar">{t.initials}</span>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.route}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="section-note">
            Sample testimonials for presentation only. These are fictional
            stories, not verified customer reviews.
          </p>
        </div>
      </section>
      <section id="faqs" className="section faq-section">
        <div className="container faq-layout">
          <div>
            <span className="eyebrow">BEFORE YOU SET OFF</span>
            <h2>
              A few things
              <br />
              you might wonder.
            </h2>
            <p>
              Good questions make for
              <br />
              better journeys.
            </p>
            <span className="draft-note">
              <CircleHelp size={17} />
              {policies.label}
            </span>
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <ChevronDown size={18} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="container final-cta">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> A LITTLE ADVENTURE AWAITS
          </span>
          <h2>Shall we get going?</h2>
          <p>Your next memory might be just a ride away.</p>
        </div>
        <button className="button primary" onClick={onBook}>
          Plan your journey
          <ArrowRight size={19} />
        </button>
        <svg className="cta-road" viewBox="0 0 500 220" aria-hidden="true">
          <path d="M0 205C80 20 180 240 260 85S450 50 500 0" />
        </svg>
      </section>
    </>
  );
}
