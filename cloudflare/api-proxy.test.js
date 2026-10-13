import test from "node:test";
import assert from "node:assert/strict";
import { proxyApi } from "./api-proxy.js";
const origin = "https://journeycab.nirajpaul.com";
const env = { BOOKING_API_ORIGIN: "https://booking-origin.example.test" };
const req = (path = "/api/session", options = {}) => new Request(origin + path, options);

test("Worker API fails closed for missing, recursive or insecure backend configuration", async () => {
  for (const backend of [undefined, origin, "http://127.0.0.1:5173", "https://user:pass@origin.test", "https://origin.test/api"]) {
    const r = await proxyApi(req(), { BOOKING_API_ORIGIN: backend }, () => { throw Error("Must not fetch"); });
    assert.equal(r.status, 503);
    assert.match(r.headers.get("content-type"), /json/);
  }
});
test("Proxy rejects preview domains and cross-origin writes before forwarding", async () => {
  for (const r of [new Request("https://preview.pages.dev/api/session"), req("/api/session", { method:"POST" }), req("/api/session", {method:"POST",headers:{Origin:"https://untrusted.example"}})]) {
    assert.equal((await proxyApi(r, env, () => { throw Error("Must not fetch"); })).status,403);
  }
});
test("Login request, host-only cookie, original Origin and status survive the proxy", async () => {
  const cookie = "__Host-jc_session=test-token; HttpOnly; Secure; SameSite=Strict; Path=/";
  const r = await proxyApi(req("/api/session?check=1", {
    method:"POST",headers:{Origin:origin,"Content-Type":"application/json",Cookie:"__Host-jc_session=old", "X-Forwarded-For":"fake", "CF-Access-Client-Secret":"untrusted"},body:JSON.stringify({email:"staff@example.test",password:"fictional-test-password"}),
  }), {...env,CF_ACCESS_CLIENT_ID:"test-id",CF_ACCESS_CLIENT_SECRET:"test-secret"}, async (url, options) => {
    assert.equal(url,env.BOOKING_API_ORIGIN+"/api/session?check=1");
    assert.equal(options.headers.get("Origin"),origin);
    assert.equal(options.headers.get("Cookie"),"__Host-jc_session=old");
    assert.equal(options.headers.get("X-Forwarded-For"),null);
    assert.equal(options.headers.get("CF-Access-Client-Secret"),"test-secret");
    assert.equal(options.redirect,"manual");
    assert.equal(JSON.parse(new TextDecoder().decode(options.body)).password,"fictional-test-password");
    return Response.json({email:"staff@example.test"},{headers:{"Set-Cookie":cookie}});
  });
  assert.equal(r.status,200);
  assert.equal(r.headers.get("Set-Cookie"),cookie);
  assert.equal(r.headers.get("Cache-Control"),"no-store");
});
test("Tracking authorization and backend validation errors are preserved", async () => {
  const r = await proxyApi(req("/api/bookings/JC-ABC",{headers:{Authorization:"Bearer private-token"}}),env,async (_url,options) => {
    assert.equal(options.headers.get("Authorization"),"Bearer private-token");
    return Response.json({error:"Booking not found."},{status:404});
  });
  assert.equal(r.status,404);
  assert.deepEqual(await r.json(),{error:"Booking not found."});
});
test("HTML fallbacks, Access redirects and network failures yield JSON errors", async () => {
  for (const transport of [async()=>new Response("<html>fallback</html>",{headers:{"Content-Type":"text/html"}}),async()=>new Response(null,{status:302,headers:{Location:"https://access.example"}}),async()=>{throw Error("offline");}]) {
    const r=await proxyApi(req(),env,transport);
    assert.equal(r.status,502);
    assert.match((await r.json()).error,/booking/i);
  }
});
test("Oversized JSON bodies are stopped before reaching the tunnel", async () => {
  const r=await proxyApi(req("/api/bookings",{method:"POST",headers:{Origin:origin},body:"x".repeat(16385)}),env,()=>{throw Error("Must not fetch");});
  assert.equal(r.status,413);
});
