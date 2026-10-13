import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

test("API paths never fall back to the frontend; other routes use assets", async () => {
  let assets = 0;
  const env = { ASSETS: { fetch: () => { assets++; return new Response("frontend"); } } };
  for (const path of ["/api", "/api/health", "/api/session"]) {
    const result = await worker.fetch(new Request(`https://journeycab.nirajpaul.com${path}`), env);
    assert.equal(result.status, 503);
    assert.match(result.headers.get("Content-Type"), /application\/json/);
  }
  assert.equal(assets, 0);
  for (const path of ["/", "/admin", "/assets/index.js", "/apiary"]) {
    assert.equal(await (await worker.fetch(new Request(`https://journeycab.nirajpaul.com${path}`), env)).text(), "frontend");
  }
  assert.equal(assets, 4);
});
