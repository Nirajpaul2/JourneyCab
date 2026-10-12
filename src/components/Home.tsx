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
import { faqs, fleet, policies, routes } from "../config";
import { calculateFare, money } from "../booking";
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
            <span className="eyebrow-line" /> LESS PLANNING. MORE GOING.
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
            Plan your journey, compare cabs,
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
            src="/images/hero-rajasthan.jpg"
            alt="Warm sandstone architecture of Amer Fort in Jaipur, Rajasthan"
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
              <MapPin size={14} /> RAJASTHAN, INDIA
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
            title="Where will the road take you?"
            description="Familiar favourites. New memories. Pick a route to get started."
            action={{ label: "Plan your own journey", onClick: onBook }}
          />
          <div className="routes-grid">
            {routes.map((r, i) => (
              <button
                className="route-card"
                key={r.to}
                onClick={() => onRoute(r.from, r.to)}
                aria-label={`Book ${r.from} to ${r.to}`}
              >
                <div className="route-photo">
                  <img
                    src={`/images/${r.image}.jpg`}
                    alt={`${r.to} travel destination`}
                    loading="lazy"
                  />
                  <span className="route-tag">{r.tag}</span>
                  <span className="route-number">0{i + 1}</span>
                </div>
                <div className="route-card-content">
                  <h3>
                    {r.from}
                    <ArrowRight size={17} />
                    {r.to}
                  </h3>
                  <p>{r.mood}</p>
                  <div className="route-card-bottom">
                    <span>
                      From{" "}
                      <strong>
                        {money(
                          calculateFare(
                            {
                              ...journey,
                              mode: "oneway",
                              from: r.from,
                              to: r.to,
                            },
                            "hatchback",
                          )!.total,
                        )}
                      </strong>
                      <small>Illustrative estimate · ~{r.hours} hrs</small>
                    </span>
                    <span className="round-arrow">
                      <ArrowUpRight size={20} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="section-note">
            A little preview of what’s possible. Fares and travel times are
            illustrative estimates.
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
                copy: "A weekend away. A visit home. A ride both ways.",
              },
              {
                mode: "local" as const,
                icon: Navigation,
                title: "A city at your pace",
                copy: "A cab for a few hours, and a day full of possibilities.",
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
            description="A little luggage or the whole family. There’s room for your kind of trip."
          />
          <div className="fleet-grid">
            {fleet.map((c, i) => (
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
                title: "Travel",
                copy: "In this demo, see your simulated confirmation.",
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
                route: "Mumbai → Pune",
              },
              {
                quote:
                  "Enough room for the bags, the snacks, and everyone’s favourite road-trip playlist.",
                initials: "MS",
                name: "A family on the move",
                route: "Bengaluru → Mysuru",
              },
              {
                quote:
                  "Seeing the full estimate before choosing a cab made the whole journey feel simpler.",
                initials: "RP",
                name: "A thoughtful planner",
                route: "Delhi → Jaipur",
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
