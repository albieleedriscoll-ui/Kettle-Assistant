// Tests for the health check page, using a stand-in for Claude so no real requests are made.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/check.mjs";

const SITE = "https://kettle-demo.netlify.app";
const realFetch = globalThis.fetch;
const realNow = Date.now;
let respond;

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key-never-shown";
  delete process.env.CLAUDE_API_URL;
  globalThis.fetch = async () => respond();
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
});

const page = async () => (await handler(new Request(SITE + "/api/check"))).text();

test("when Claude answers, the page says all working and gives each restaurant's links", async () => {
  respond = () =>
    new Response(
      JSON.stringify({ content: [{ type: "text", text: "ready" }], stop_reason: "end_turn", usage: { input_tokens: 20, output_tokens: 2 } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  const html = await page();
  assert.match(html, /<h1>All working<\/h1>/);
  assert.match(html, /Working: Restaurants loaded/);
  assert.match(html, /Working: Claude/);
  assert.match(html, /href="\/\?venue=copper-kettle"/);
  assert.match(html, /href="\/embed-demo\.html\?venue=copper-kettle"/);
  // The one line a restaurant adds to its website, with this site's own address in it.
  assert.ok(
    html.includes(`&lt;script src=&quot;${SITE}/widget.js&quot; data-venue=&quot;copper-kettle&quot; async&gt;&lt;/script&gt;`)
  );
  assert.equal(html.includes("test-key-never-shown"), false);
});

test("when Claude rejects the key, the page says what to fix and never shows the key", async () => {
  Date.now = () => realNow() + 60_000; // the page re-tests Claude at most every 15 seconds
  respond = () =>
    new Response(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }), {
      status: 401,
    });
  const html = await page();
  assert.match(html, /<h1>Something needs fixing<\/h1>/);
  assert.match(html, /Working: Restaurants loaded/);
  assert.match(html, /Problem: Claude/);
  assert.match(html, /Claude didn't accept the API key/);
  assert.match(html, /invalid x-api-key/);
  assert.equal(html.includes("test-key-never-shown"), false);
});
