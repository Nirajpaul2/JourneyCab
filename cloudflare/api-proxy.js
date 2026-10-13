// The Worker keeps /api on the browser's origin; only the server-side destination
// comes from deployment configuration. No browser-provided proxy destinations.
const LIMIT = 16 * 1024;
const PUBLIC_ORIGIN = "https://journeycab.nirajpaul.com";

function failure(status, message) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" },
  });
}

export async function proxyApi(request, env, transport = fetch) {
  const url = new URL(request.url);
  if (url.pathname !== "/api" && !url.pathname.startsWith("/api/"))
    return failure(404, "Endpoint not found.");
  // Preview/alternate domains must not reuse production staff sessions.
  if (url.origin !== PUBLIC_ORIGIN)
    return failure(403, "Use the JourneyCab production domain for API access.");
  if (!["GET", "HEAD"].includes(request.method) &&
      request.headers.get("Origin") !== PUBLIC_ORIGIN)
    return failure(403, "Request origin is not allowed.");

  let backend;
  try {
    backend = new URL(env.BOOKING_API_ORIGIN);
    if (backend.protocol !== "https:" || backend.username || backend.password ||
        backend.pathname !== "/" || backend.search || backend.hash ||
        backend.origin === url.origin)
      throw new Error("Invalid origin");
  } catch {
    return failure(503, "The booking API connection is not configured. Please contact the booking team.");
  }
  if (!!env.CF_ACCESS_CLIENT_ID !== !!env.CF_ACCESS_CLIENT_SECRET)
    return failure(503, "The booking API connection is not configured. Please contact the booking team.");

  // Copy the API path, never resolve a user path as a potentially absolute URL.
  backend.pathname = url.pathname;
  backend.search = url.search;
  const headers = new Headers();
  for (const name of ["Accept", "Content-Type", "Origin", "Cookie", "Authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Optional Access service credentials belong in Worker secrets. Do not forward
  // client-supplied Access or forwarding headers to the trusted tunnel origin.
  if (env.CF_ACCESS_CLIENT_ID) {
    headers.set("CF-Access-Client-Id", env.CF_ACCESS_CLIENT_ID);
    headers.set("CF-Access-Client-Secret", env.CF_ACCESS_CLIENT_SECRET);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    let body;
    if (request.body && !["GET", "HEAD"].includes(request.method)) {
      const reader = request.body.getReader();
      const chunks = [];
      let length = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > LIMIT) {
          await reader.cancel();
          return failure(413, "Request is too large.");
        }
        chunks.push(value);
      }
      body = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    }
    const upstream = await transport(backend.toString(), {
      method: request.method,
      headers,
      body,
      // Never send cookies, passwords or service tokens through redirects.
      redirect: "manual",
      signal: controller.signal,
    });
    if ((upstream.status >= 300 && upstream.status < 400) ||
        !/^application\/json\b/i.test(upstream.headers.get("Content-Type") ?? "")) {
      await upstream.body?.cancel();
      return failure(502, "The booking API returned an invalid response. Please contact the booking team.");
    }
    const response = new Response(upstream.body, upstream);
    // Preserve Set-Cookie (host-only production session), status and JSON errors.
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    response.headers.delete("Access-Control-Allow-Origin");
    response.headers.delete("Access-Control-Allow-Credentials");
    return response;
  } catch {
    return failure(502, "The booking server is unavailable. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}
