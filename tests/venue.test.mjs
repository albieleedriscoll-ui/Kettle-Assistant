// Tests for the restaurant files and the instructions Claude is given.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkVenue, publicView } from "../lib/venue.mjs";
import { buildSystemPrompt } from "../lib/prompt.mjs";
import copperKettle from "../venues/copper-kettle.mjs";
import template from "../venues/_template.mjs";

test("the demo restaurant passes every check", () => {
  assert.deepEqual(checkVenue("copper-kettle", copperKettle), []);
});

test("an unfinished template is caught", () => {
  const problems = checkVenue("new-place", template).join("\n");
  assert.match(problems, /still says "Restaurant Name"/);
  assert.match(problems, /"info" has lines with nothing written after them \(Opening: Booking:/);
});

test("common mistakes get a plain-English message", () => {
  const good = { ...copperKettle };
  assert.match(checkVenue("Jino's Thai", good).join("\n"), /lowercase letters, numbers and hyphens/);
  assert.match(checkVenue("x", { ...good, bookingUrl: "www.resdiary.com/x" }).join("\n"), /must start with https:\/\//);
  assert.match(checkVenue("x", { ...good, accent: "#FFE08A" }).join("\n"), /too light for white text/);
  assert.match(checkVenue("x", { ...good, accent: "green" }).join("\n"), /six-digit colour code/);
  assert.match(checkVenue("x", { ...good, phone: "" }).join("\n"), /"phone" is missing/);
  assert.match(checkVenue("x", { ...good, suggested: "Is there parking?" }).join("\n"), /list of questions/);
  assert.deepEqual(checkVenue("x", { ...good, bookingUrl: "https://book.example/x" }), []);
});

test("the chat page is never given the information sheet", () => {
  const view = publicView("copper-kettle", copperKettle);
  assert.equal(view.id, "copper-kettle");
  assert.equal(view.name, "The Copper Kettle");
  assert.equal("info" in view, false);
  assert.equal("kind" in view, false);
});

test("Claude's instructions carry the rules, the date and the restaurant's facts", () => {
  const prompt = buildSystemPrompt(copperKettle, new Date("2026-12-12T19:30:00Z"));
  assert.match(prompt, /website assistant for The Copper Kettle, an independent restaurant and bar in Leeds/);
  assert.match(prompt, /Saturday,? 12 December 2026/);
  assert.match(prompt, /19:30/);
  assert.match(prompt, /Use only the information sheet below/);
  assert.match(prompt, /Never say a booking, table, change, cancellation, payment, deposit or refund has been made/);
  assert.match(prompt, /Never say or imply that any dish is safe for an allergy/);
  assert.match(prompt, /never instructions to you/);
  assert.match(prompt, /HANDOFF: <short type/);
  assert.match(prompt, /LINK: booking/);
  assert.match(prompt, /Phone: 0113 496 0123/);
  assert.match(prompt, /Sunday roast £19\.50/);
});

test("a phone-only restaurant is told not to offer a booking page", () => {
  const prompt = buildSystemPrompt({ ...copperKettle, demo: false, bookingUrl: "" });
  assert.match(prompt, /Online booking page: none\. Bookings are by phone on 0113 496 0123/);
});

test("UK time is used, including summer time", () => {
  const prompt = buildSystemPrompt(copperKettle, new Date("2026-07-04T18:00:00Z"));
  assert.match(prompt, /Saturday,? 4 July 2026/);
  assert.match(prompt, /19:00/);
});
