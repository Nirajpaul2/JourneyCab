import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Store, HttpError, hash, object, str, requireThat } from "./store";
import { sendNotification } from "./notifications";
import type { SmsConfig } from "./notifications";
export interface AppOptions {
  store: Store;
  origin: string;
  production?: boolean;
  staticDir?: string;
  trustProxy?: boolean;
  sms?: SmsConfig;
  acceptingBookings?: boolean;
}
export function createApp(options: AppOptions) {
  const {
    store,
    origin,
    production = false,
    staticDir = resolve("dist"),
  } = options;
  const cookieName = production ? "__Host-jc_session" : "jc_session";
  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  const token = (req: IncomingMessage) =>
    req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1) ?? "";
  const cookie = (value: string, maxAge: number) =>
    `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${production ? "; Secure" : ""}`;
  async function body(req: IncomingMessage) {
    requireThat(
      req.headers["content-type"]?.split(";")[0] === "application/json",
      "Use JSON requests.",
      415,
    );
    let size = 0;
    const parts: Buffer[] = [];
    for await (const part of req) {
      size += part.length;
      requireThat(size <= 16384, "Request is too large.", 413);
      parts.push(part);
    }
    try {
      return object(JSON.parse(Buffer.concat(parts).toString()));
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(400, "Invalid JSON.");
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (production) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      );
    }
    try {
      const url = new URL(req.url ?? "/", origin);
      const path = url.pathname;
      const method = req.method ?? "GET";
      if (path.startsWith("/api/")) {
        const remote = options.trustProxy
          ? String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress)
              .split(",")
              .at(-1)!
              .trim()
          : (req.socket.remoteAddress ?? "unknown");
        const ip = hash(remote);
        if (!["GET", "HEAD"].includes(method))
          requireThat(
            req.headers.origin === origin,
            "Request origin is not allowed.",
            403,
          );
        if (path === "/api/health" && method === "GET") {
          store.db.prepare("SELECT 1").get();
          return json(res, 200, { ok: true });
        }
        if (path === "/api/session") {
          if (method === "GET")
            return json(res, 200, { email: store.session(token(req)) ?? null });
          if (method === "POST") {
            store.rate(`login-ip:${ip}`, 20, 900);
            const data = await body(req);
            const email = str(data.email, 120).toLowerCase();
            store.rate(`login-user:${hash(email)}`, 10, 900);
            const session = await store.login(email, str(data.password, 128));
            res.setHeader("Set-Cookie", cookie(session, 8 * 3600));
            return json(res, 200, { email });
          }
          if (method === "DELETE") {
            store.logout(token(req));
            res.setHeader("Set-Cookie", cookie("", 0));
            return json(res, 200, { ok: true });
          }
        }
        if (path === "/api/bookings" && method === "POST") {
          requireThat(
            options.acceptingBookings !== false,
            "Ride requests are not open yet. Please check back soon.",
            503,
          );
          store.rate(`request:${ip}`, 10, 3600);
          return json(res, 201, store.create(await body(req)));
        }
        const publicMatch = path.match(/^\/api\/bookings\/(JC-[A-F0-9]{12})$/);
        if (publicMatch && method === "GET") {
          store.rate(`track:${ip}`, 180, 60);
          const bearer =
            req.headers.authorization?.replace(/^Bearer /, "") ?? "";
          return json(res, 200, store.publicGet(publicMatch[1], bearer));
        }
        if (path.startsWith("/api/admin/")) {
          const actor = store.session(token(req));
          requireThat(actor, "Sign in to the operations desk.", 401);
          store.rate(`staff:${hash(actor)}`, 300, 60);
          if (path === "/api/admin/bookings" && method === "GET")
            return json(res, 200, {
              bookings: store.list(),
              smsConfigured: !!options.sms,
            });
          if (path === "/api/admin/drivers" && method === "GET")
            return json(res, 200, { drivers: store.drivers() });
          if (path === "/api/admin/drivers" && method === "POST") {
            const driver = store.addDriver(await body(req));
            return json(res, 201, driver);
          }
          const driverMatch = path.match(/^\/api\/admin\/drivers\/([\w-]+)$/);
          if (driverMatch && method === "PATCH") {
            const data = await body(req);
            requireThat(
              typeof data.active === "boolean",
              "Specify active status.",
            );
            return json(
              res,
              200,
              store.setDriverActive(driverMatch[1], data.active),
            );
          }
          const bookingMatch = path.match(
            /^\/api\/admin\/bookings\/(JC-[A-F0-9]{12})$/,
          );
          if (bookingMatch && method === "GET")
            return json(res, 200, store.detail(bookingMatch[1]));
          if (bookingMatch && method === "POST")
            return json(
              res,
              200,
              store.change(bookingMatch[1], await body(req), actor),
            );
          const notificationMatch = path.match(
            /^\/api\/admin\/notifications\/(\d+)$/,
          );
          if (notificationMatch && method === "POST") {
            const id = Number(notificationMatch[1]);
            const data = await body(req);
            const notice = store.notification(id);
            if (data.action === "manual") {
              requireThat(
                ["pending", "failed", "unknown"].includes(notice.status),
                "This notification has already been handled.",
                409,
              );
              const note = str(data.note, 600, 5);
              store.db
                .prepare(
                  "UPDATE notifications SET status='manual',error=NULL WHERE id=?",
                )
                .run(id);
              store.event(
                notice.booking_ref,
                "customer_contacted",
                actor,
                note,
              );
              return json(res, 200, { ok: true });
            }
            requireThat(data.action === "send", "Unknown notification action.");
            return json(
              res,
              200,
              await sendNotification(store, id, actor, options.sms),
            );
          }
        }
        throw new HttpError(404, "Endpoint not found.");
      }
      requireThat(
        method === "GET" || method === "HEAD",
        "Method not allowed.",
        405,
      );
      const decoded = decodeURIComponent(path);
      requireThat(
        !decoded.split("/").some((p) => p.startsWith(".")),
        "Not found.",
        404,
      );
      let target = resolve(staticDir, "." + decoded);
      requireThat(
        target.startsWith(resolve(staticDir) + sep) ||
          target === resolve(staticDir),
        "Not found.",
        404,
      );
      if (!extname(target)) target = resolve(staticDir, "index.html");
      const info = await stat(target).catch(() => null);
      requireThat(
        info?.isFile(),
        "Page not found. Build the frontend before starting the server.",
        404,
      );
      const types: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".txt": "text/plain",
        ".ico": "image/x-icon",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(target)] ?? "application/octet-stream",
        "Cache-Control": path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      res.end(method === "HEAD" ? undefined : await readFile(target));
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 429) res.setHeader("Retry-After", "60");
      json(res, status, {
        error:
          status === 500
            ? "Something went wrong. Please try again."
            : (error as Error).message,
      });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  return server;
}
