import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  Navigation,
  RotateCcw,
  Search,
} from "lucide-react";
import type { Journey, TripMode } from "../config";
import { cities, defaultRoute, packages, serviceArea } from "../config";
import { indiaDate, validateJourney } from "../booking";

function CitySelect({
  label,
  value,
  onChange,
  error,
  destination = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  destination?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const matches = cities.filter((c) =>
    `${c.name} ${c.state}`.toLowerCase().includes(query.toLowerCase()),
  );
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[active] as HTMLElement | undefined;
    if (!open || !list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [active, open, query]);
  const choose = (name: string) => {
    onChange(name);
    setQuery("");
    setOpen(false);
    setActive(0);
  };
  return (
    <div className={`field city-field ${error ? "invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {destination ? <MapPin size={18} /> : <Navigation size={18} />}
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            open && matches[active] ? `${id}-option-${active}` : undefined
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          value={open ? query : value}
          placeholder={open ? `Search ${label.toLowerCase()}` : "Select a city"}
          onFocus={() => {
            setQuery("");
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) =>
                Math.max(0, Math.min(a + 1, matches.length - 1)),
              );
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (matches[active]) choose(matches[active].name);
            }
          }}
        />
        <ChevronDown size={15} />
      </div>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-options`}
          role="listbox"
          aria-label={`${label} cities`}
          className="city-options"
        >
          {matches.map((c, i) => (
            <li
              id={`${id}-option-${i}`}
              key={c.name}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c.name)}
              onMouseMove={() => setActive(i)}
            >
              <MapPin size={15} />
              <span>
                {c.name}
                <small>{c.state}</small>
              </span>
              {c.name === value && <span className="selected-dot" />}
            </li>
          ))}
          {!matches.length && (
            <li className="no-city">
              No matching Bihar cities. Try {defaultRoute.from} or{" "}
              {defaultRoute.to}.
            </li>
          )}
        </ul>
      )}
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export default function BookingForm({
  journey,
  onChange,
  onSearch,
  compact = false,
  searchLabel = "Search Cabs",
  onCancel,
}: {
  journey: Journey;
  onChange: (journey: Journey) => void;
  onSearch: () => void;
  compact?: boolean;
  searchLabel?: string;
  onCancel?: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (key: keyof Journey, value: string) => {
    onChange({ ...journey, [key]: value });
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const tabs: { id: TripMode; label: string; icon: typeof ArrowRight }[] = [
    { id: "oneway", label: "One Way", icon: ArrowRight },
    { id: "roundtrip", label: "Round Trip", icon: RotateCcw },
    { id: "local", label: "Local", icon: MapPin },
  ];
  return (
    <form
      className={`booking-panel ${compact ? "compact-booking" : ""}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const next = validateJourney(journey);
        setErrors(next);
        if (!Object.keys(next).length) onSearch();
      }}
    >
      <div className="booking-top">
        <div className="trip-tabs" role="group" aria-label="Journey type">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={journey.mode === t.id}
              className={journey.mode === t.id ? "active" : ""}
              onClick={() => {
                update("mode", t.id);
                setErrors({});
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
        <span className="booking-note">
          <span className="green-dot" /> {serviceArea.notice}
        </span>
      </div>
      <div
        className={`booking-fields ${journey.mode === "roundtrip" ? "has-return" : ""}`}
      >
        <div className="city-pair">
          <CitySelect
            label={journey.mode === "local" ? "Your city" : "Pickup city"}
            value={journey.from}
            onChange={(v) => update("from", v)}
            error={errors.from}
          />
          {journey.mode !== "local" ? (
            <>
              <button
                className="swap-button"
                type="button"
                aria-label="Swap pickup and destination cities"
                onClick={() => {
                  onChange({ ...journey, from: journey.to, to: journey.from });
                  setErrors({});
                }}
              >
                <ArrowRightLeft size={16} />
              </button>
              <CitySelect
                label="Destination"
                value={journey.to}
                onChange={(v) => update("to", v)}
                error={errors.to}
                destination
              />
            </>
          ) : (
            <div className="field">
              <label htmlFor="rental-package">Rental package</label>
              <div className="input-wrap">
                <Clock3 size={18} />
                <select
                  id="rental-package"
                  value={journey.package}
                  onChange={(e) => update("package", e.target.value)}
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className={`field ${errors.date ? "invalid" : ""}`}>
          <label htmlFor="pickup-date">Pickup date</label>
          <div className="input-wrap">
            <CalendarDays size={18} />
            <input
              id="pickup-date"
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? "date-error" : undefined}
              type="date"
              min={indiaDate()}
              value={journey.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>
          {errors.date && (
            <small id="date-error" className="field-error">
              {errors.date}
            </small>
          )}
        </div>
        <div className={`field ${errors.time ? "invalid" : ""}`}>
          <label htmlFor="pickup-time">
            Pickup time <span>(IST)</span>
          </label>
          <div className="input-wrap">
            <Clock3 size={18} />
            <input
              id="pickup-time"
              aria-invalid={!!errors.time}
              type="time"
              value={journey.time}
              onChange={(e) => update("time", e.target.value)}
            />
          </div>
          {errors.time && <small className="field-error">{errors.time}</small>}
        </div>
        {journey.mode === "roundtrip" && (
          <div className={`field ${errors.returnDate ? "invalid" : ""}`}>
            <label htmlFor="return-date">Return date</label>
            <div className="input-wrap">
              <CalendarDays size={18} />
              <input
                id="return-date"
                aria-invalid={!!errors.returnDate}
                aria-describedby={
                  errors.returnDate ? "return-error" : undefined
                }
                type="date"
                min={journey.date || indiaDate()}
                value={journey.returnDate}
                onChange={(e) => update("returnDate", e.target.value)}
              />
            </div>
            {errors.returnDate && (
              <small id="return-error" className="field-error">
                {errors.returnDate}
              </small>
            )}
          </div>
        )}
        <button className="button primary search-button" type="submit">
          <Search size={18} />
          {searchLabel}
          <ArrowRight size={18} />
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          className="text-button cancel-edit"
          onClick={onCancel}
        >
          Keep current journey
        </button>
      )}
      <div className="booking-foot">
        <span>A little planning. A lot to look forward to.</span>
        <span>Bihar only · Illustrative fares. No payment required.</span>
      </div>
    </form>
  );
}
