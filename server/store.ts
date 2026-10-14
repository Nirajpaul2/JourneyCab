import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  calculateFare,
  validateJourney,
  validatePassenger,
} from "../src/booking";
import { cities, fleet } from "../src/config";
import type { Category, Journey, Passenger } from "../src/config";
import type {
  Booking,
  Driver,
  PublicBooking,
  Notification,
} from "../src/operations-types";
import { canAssignCategory, isSedanUpgrade } from "../src/operations-types";
const scrypt = promisify(scryptCallback);
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export function str(value: unknown, max = 200, min = 1): string {
  requireThat(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    "Check the required fields and their length.",
  );
  return value.trim();
}
export function object(value: unknown): Record<string, unknown> {
  requireThat(
    value && typeof value === "object" && !Array.isArray(value),
    "Invalid request.",
  );
  return value as Record<string, unknown>;
}
export async function passwordHash(password: string) {
  requireThat(
    password.length >= 14 && password.length <= 128,
    "Use a password of 14–128 characters.",
  );
  const salt = randomBytes(16).toString("hex");
  const digest = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${digest.toString("hex")}`;
}
export async function passwordMatches(password: string, saved: string) {
  const [salt, digest] = saved.split(":");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(digest, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS admins(email TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES admins(email), expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS drivers(id TEXT PRIMARY KEY, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS bookings(reference TEXT PRIMARY KEY, token_hash TEXT NOT NULL, request_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, driver_id TEXT REFERENCES drivers(id), starts INTEGER NOT NULL, ends INTEGER NOT NULL, version INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS booking_driver_time ON bookings(driver_id, starts, ends);
      CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, booking_ref TEXT REFERENCES bookings(reference) NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, booking_ref TEXT REFERENCES bookings(reference) NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL, provider_id TEXT, error TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
      PRAGMA user_version=1;`);
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  rate(key: string, limit: number, seconds: number) {
    const now = Date.now();
    this.db.prepare("DELETE FROM rate_limits WHERE expires < ?").run(now);
    const row = this.db
      .prepare("SELECT count FROM rate_limits WHERE key=?")
      .get(key) as { count: number } | undefined;
    requireThat(
      !row || row.count < limit,
      "Too many attempts. Please try again later.",
      429,
    );
    this.db
      .prepare(
        "INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
      )
      .run(key, now + seconds * 1000);
  }
  async addAdmin(email: string, password: string) {
    const normalized = str(email, 120).toLowerCase();
    requireThat(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized),
      "Enter a valid staff email.",
    );
    const digest = await passwordHash(password);
    this.db.prepare("INSERT INTO admins VALUES(?,?)").run(normalized, digest);
  }
  async login(email: string, password: string) {
    const row = this.db
      .prepare("SELECT password_hash FROM admins WHERE email=?")
      .get(email.toLowerCase()) as { password_hash: string } | undefined;
    // Perform the same expensive operation for unknown users.
    const valid = await passwordMatches(
      password,
      row?.password_hash ?? `${"0".repeat(32)}:${"0".repeat(128)}`,
    );
    requireThat(row && valid, "Email or password is incorrect.", 401);
    const token = randomBytes(32).toString("hex");
    this.db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    this.db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(hash(token), email.toLowerCase(), Date.now() + 8 * 3600_000);
    return token;
  }
  session(token: string) {
    return (
      this.db
        .prepare("SELECT email FROM sessions WHERE token_hash=? AND expires>?")
        .get(hash(token), Date.now()) as { email: string } | undefined
    )?.email;
  }
  logout(token: string) {
    this.db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
  }
  drivers(): Driver[] {
    return this.db
      .prepare("SELECT body FROM drivers ORDER BY id DESC")
      .all()
      .map((row) => JSON.parse(row.body as string));
  }
  addDriver(input: unknown): Driver {
    const data = object(input);
    const driver: Driver = {
      id: randomUUID(),
      name: str(data.name, 100, 2),
      phone: str(data.phone, 16),
      city: str(data.city, 50),
      category: str(data.category, 30) as Category,
      vehicle: str(data.vehicle, 100, 2),
      plate: str(data.plate, 20, 6).toUpperCase(),
      active: true,
    };
    requireThat(
      /^[6-9]\d{9}$/.test(driver.phone),
      "Enter a 10-digit Indian driver mobile number.",
    );
    requireThat(
      cities.some((c) => c.name === driver.city),
      "Choose a base city from the service-area list.",
    );
    requireThat(
      fleet.some((c) => c.id === driver.category),
      "Choose a vehicle category.",
    );
    requireThat(
      !this.drivers().some(
        (d) => d.plate.replace(/\s/g, "") === driver.plate.replace(/\s/g, ""),
      ),
      "This vehicle is already registered.",
      409,
    );
    this.db
      .prepare("INSERT INTO drivers VALUES(?,?)")
      .run(driver.id, JSON.stringify(driver));
    return driver;
  }
  setDriverActive(id: string, active: boolean) {
    const driver = this.drivers().find((d) => d.id === id);
    requireThat(driver, "Driver not found.", 404);
    if (!active)
      requireThat(
        !this.db
          .prepare(
            "SELECT reference FROM bookings WHERE driver_id=? AND status IN ('assigned','confirmed')",
          )
          .get(id),
        "Finish or cancel the driver’s assigned bookings first.",
        409,
      );
    driver.active = active;
    this.db
      .prepare("UPDATE drivers SET body=? WHERE id=?")
      .run(JSON.stringify(driver), id);
    return driver;
  }
  get(reference: string): Booking {
    const row = this.db
      .prepare("SELECT body FROM bookings WHERE reference=?")
      .get(reference);
    requireThat(row, "Booking not found.", 404);
    return JSON.parse(row.body as string);
  }
  list(): Booking[] {
    return this.db
      .prepare("SELECT body FROM bookings ORDER BY rowid DESC LIMIT 500")
      .all()
      .map((row) => JSON.parse(row.body as string));
  }
  publicGet(reference: string, token: string): PublicBooking {
    const row = this.db
      .prepare("SELECT body FROM bookings WHERE reference=? AND token_hash=?")
      .get(reference, hash(token));
    requireThat(row, "Booking not found. Check your private status link.", 404);
    const b = JSON.parse(row.body as string) as Booking;
    const driver =
      b.driver && ["confirmed", "completed"].includes(b.status)
        ? {
            name: b.driver.name,
            phone: b.driver.phone,
            vehicle: b.driver.vehicle,
            plate: b.driver.plate,
            category: b.driver.category,
          }
        : null;
    return {
      reference: b.reference,
      journey: b.journey,
      category: b.category,
      status: b.status,
      estimate: b.estimate,
      finalFare: b.finalFare,
      fareNote: b.fareNote,
      driver,
      updatedAt: b.updatedAt,
    };
  }
  create(input: unknown) {
    const data = object(input);
    const j = object(data.journey);
    const p = object(data.passenger);
    const journey = Object.fromEntries(
      ["mode", "from", "to", "date", "time", "returnDate", "package"].map(
        (k) => [k, str(j[k], 60, k === "to" || k === "returnDate" ? 0 : 1)],
      ),
    ) as unknown as Journey;
    const passenger = Object.fromEntries(
      ["name", "phone", "email", "pickup", "drop"].map((k) => [
        k,
        str(
          p[k],
          k === "pickup" || k === "drop" ? 400 : 120,
          k === "email" || k === "drop" ? 0 : 1,
        ),
      ]),
    ) as unknown as Passenger;
    requireThat(
      ["oneway", "roundtrip", "local"].includes(journey.mode),
      "Invalid journey type.",
    );
    requireThat(
      /^\d{4}-\d{2}-\d{2}$/.test(journey.date) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(journey.time),
      "Invalid departure date or time.",
    );
    requireThat(
      Number.isFinite(Date.parse(`${journey.date}T00:00:00Z`)) &&
        new Date(`${journey.date}T00:00:00Z`).toISOString().slice(0, 10) ===
          journey.date,
      "Invalid departure date.",
    );
    if (journey.mode === "roundtrip")
      requireThat(
        /^\d{4}-\d{2}-\d{2}$/.test(journey.returnDate) &&
          Number.isFinite(Date.parse(`${journey.returnDate}T00:00:00Z`)) &&
          new Date(`${journey.returnDate}T00:00:00Z`)
            .toISOString()
            .slice(0, 10) === journey.returnDate,
        "Invalid return date.",
      );
    requireThat(
      Object.keys(validateJourney(journey)).length === 0,
      "Choose a valid future journey in the service area.",
    );
    requireThat(
      Object.keys(validatePassenger(passenger, journey.mode)).length === 0,
      "Check passenger and pickup/drop details.",
    );
    requireThat(
      data.consent === true && !data.website,
      "Consent to booking contact is required.",
    );
    const category = str(data.category, 30) as Category;
    const estimate = calculateFare(journey, category);
    requireThat(estimate, "This route or category is not supported.");
    const requestKey = str(data.requestKey, 80);
    const token = str(data.trackingToken, 64);
    requireThat(
      /^[a-f0-9]{64}$/.test(token) && /^[a-zA-Z0-9-]{20,80}$/.test(requestKey),
      "Invalid request identifier.",
    );
    if (journey.mode === "local") {
      journey.to = "";
      passenger.drop = "";
    }
    const payloadHash = hash(JSON.stringify({ journey, passenger, category }));
    return this.transaction(() => {
      const existing = this.db
        .prepare(
          "SELECT reference,payload_hash,token_hash FROM bookings WHERE request_key=?",
        )
        .get(requestKey);
      if (existing) {
        requireThat(
          existing.payload_hash === payloadHash &&
            existing.token_hash === hash(token),
          "This submission has changed. Start a new request.",
          409,
        );
        return { reference: existing.reference as string, duplicate: true };
      }
      const now = new Date().toISOString();
      const reference = `JC-${randomBytes(6).toString("hex").toUpperCase()}`;
      const booking: Booking = {
        reference,
        journey,
        passenger,
        category,
        estimate,
        status: "requested",
        finalFare: null,
        fareNote: "",
        driver: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      const starts = Date.parse(`${journey.date}T${journey.time}:00+05:30`);
      // The banner supplies no travel durations. Reserve a conservative 24h
      // window for new requests so a guessed route time cannot double-book a
      // partner. Existing bookings retain their saved allocation windows.
      const ends = starts + 24 * 3600_000;
      this.db
        .prepare("INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?)")
        .run(
          reference,
          hash(token),
          requestKey,
          payloadHash,
          JSON.stringify(booking),
          "requested",
          null,
          starts,
          ends,
          1,
        );
      this.event(
        reference,
        "requested",
        "customer",
        "Customer consented to booking-related contact.",
      );
      return { reference, duplicate: false };
    });
  }
  event(reference: string, action: string, actor: string, note: string) {
    this.db
      .prepare(
        "INSERT INTO events(booking_ref,action,actor,note,created_at) VALUES(?,?,?,?,?)",
      )
      .run(reference, action, actor, note, new Date().toISOString());
  }
  detail(reference: string) {
    return {
      booking: this.get(reference),
      events: this.db
        .prepare(
          "SELECT id,action,actor,note,created_at AS createdAt FROM events WHERE booking_ref=? ORDER BY id",
        )
        .all(reference),
      notifications: this.db
        .prepare(
          "SELECT * FROM notifications WHERE booking_ref=? ORDER BY id DESC",
        )
        .all(reference),
    };
  }
  change(reference: string, input: unknown, actor: string) {
    const data = object(input);
    const action = str(data.action, 30);
    let note = str(data.note ?? "", 600, 0);
    return this.transaction(() => {
      const b = this.get(reference);
      requireThat(
        data.version === b.version,
        "This booking changed. Refresh before continuing.",
        409,
      );
      const state = b.status;
      requireThat(
        !["completed", "cancelled", "rejected"].includes(state),
        "This booking is already closed.",
        409,
      );
      if (action === "quote") {
        requireThat(
          state === "requested",
          "The fare has already been approved.",
          409,
        );
        requireThat(
          typeof data.fare === "number" &&
            Number.isSafeInteger(data.fare) &&
            data.fare > 0 &&
            data.fare <= 1000000,
          "Enter a whole-rupee fare between ₹1 and ₹10,00,000.",
        );
        requireThat(
          note.length >= 5 && data.customerAgreed === true,
          "Confirm the customer agreed to the fare and record its inclusions.",
        );
        b.finalFare = data.fare;
        b.fareNote = note;
        b.status = "quoted";
      } else if (action === "assign") {
        requireThat(
          state === "quoted",
          "Approve the fare before assigning a driver.",
          409,
        );
        const driver = this.drivers().find((d) => d.id === data.driverId);
        requireThat(
          driver?.active && canAssignCategory(b.category, driver.category),
          "Choose an active partner with a matching category or a Sedan upgrade for a Hatchback booking.",
        );
        const upgrade = isSedanUpgrade(b.category, driver.category);
        requireThat(
          !upgrade || data.customerApprovedUpgrade === true,
          "Confirm the customer approved the Sedan upgrade at the agreed fare.",
        );
        requireThat(
          data.driverAgreed === true,
          "Confirm the driver accepted this journey.",
        );
        const window = this.db
          .prepare("SELECT starts,ends FROM bookings WHERE reference=?")
          .get(reference)!;
        requireThat(
          !this.db
            .prepare(
              "SELECT reference FROM bookings WHERE driver_id=? AND status IN ('assigned','confirmed') AND starts<? AND ends>?",
            )
            .get(driver.id, window.ends, window.starts),
          "This driver already has an overlapping booking.",
          409,
        );
        b.driver = driver;
        if (upgrade) {
          b.upgradeApproval = {
            from: "hatchback", to: "sedan",
            recordedBy: actor, recordedAt: new Date().toISOString(),
          };
          note = "Customer approved Hatchback → Sedan upgrade at the unchanged agreed fare." + (note ? ` ${note}` : "");
        }
        b.status = "assigned";
      } else if (action === "confirm") {
        requireThat(
          state === "assigned" && b.driver && b.finalFare,
          "Approve the fare and assign a driver first.",
          409,
        );
        requireThat(
          Date.parse(`${b.journey.date}T${b.journey.time}:00+05:30`) >
            Date.now(),
          "The departure has passed. Cancel and create a new request.",
        );
        b.status = "confirmed";
      } else if (action === "complete") {
        requireThat(
          state === "confirmed",
          "Only confirmed bookings can be completed.",
          409,
        );
        requireThat(
          Date.parse(`${b.journey.date}T${b.journey.time}:00+05:30`) <=
            Date.now(),
          "A future trip cannot be marked completed.",
          409,
        );
        b.status = "completed";
      } else if (action === "cancel" || action === "reject") {
        requireThat(
          note.length >= 5,
          "Record a reason for closing this request.",
        );
        requireThat(
          action !== "reject" || ["requested", "quoted"].includes(state),
          "Assigned bookings must be cancelled.",
          409,
        );
        b.status = action === "cancel" ? "cancelled" : "rejected";
      } else throw new HttpError(400, "Unknown booking action.");
      b.updatedAt = new Date().toISOString();
      b.version++;
      this.db
        .prepare(
          "UPDATE bookings SET body=?,status=?,driver_id=?,version=? WHERE reference=?",
        )
        .run(
          JSON.stringify(b),
          b.status,
          b.driver?.id ?? null,
          b.version,
          reference,
        );
      this.event(reference, b.status, actor, note);
      if (["confirmed", "cancelled", "rejected"].includes(b.status)) {
        // Superseded pending notices must not be sent after cancellation.
        this.db
          .prepare(
            "UPDATE notifications SET status='failed',error='Superseded by a newer booking status.' WHERE booking_ref=? AND status='pending'",
          )
          .run(reference);
        const body =
          b.status === "confirmed"
            ? `JourneyCab ${reference}: confirmed. ${b.journey.from}${b.journey.to ? " to " + b.journey.to : " local"}, ${b.journey.date} ${b.journey.time} IST. Fare INR ${b.finalFare}. Driver ${b.driver!.name}, ${b.driver!.phone}, ${b.driver!.vehicle}, ${b.driver!.plate}.`
            : `JourneyCab ${reference}: ${b.status === "rejected" ? "we are unable to fulfil your ride request" : "your booking is cancelled"}. Please check your private status page or contact the booking team.`;
        this.db
          .prepare(
            "INSERT INTO notifications(booking_ref,status,body,created_at) VALUES(?,'pending',?,?)",
          )
          .run(reference, body, b.updatedAt);
      }
      return b;
    });
  }
  notification(id: number) {
    const n = this.db
      .prepare("SELECT * FROM notifications WHERE id=?")
      .get(id) as unknown as Notification | undefined;
    requireThat(n, "Notification not found.", 404);
    return n;
  }
  close() {
    this.db.close();
  }
}
