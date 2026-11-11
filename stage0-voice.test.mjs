// Simulated Twilio calls for the draft call-test function. Run with: node --test drafts/stage0-voice.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import handler, { classifyNumber } from "./stage0-voice.mjs";

const URL_ = "https://example.netlify.app/.netlify/functions/voice";

// Builds the same kind of request Twilio sends when a call comes in.
function twilioCall(fields) {
  return new Request(URL_, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      CallSid: "CA00000000000000000000000000000000",
      AccountSid: "AC00000000000000000000000000000000",
      To: "+447480000001",
      CallStatus: "ringing",
      Direction: "inbound",
      ...fields,
    }).toString(),
  });
}

// Captures what the function writes to the log during one call.
async function run(req) {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(String(line));
  try {
    const res = await handler(req);
    return { res, body: await res.text(), log: lines.join("\n") };
  } finally {
    console.log = original;
  }
}

test("a UK mobile caller hears their own last four digits", async () => {
  const { res, body, log } = await run(twilioCall({ From: "+447700900123" }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type"), /text\/xml/);
  assert.match(body, /^<\?xml version="1\.0" encoding="UTF-8"\?><Response>/);
  assert.match(body, /U K mobile number ending 0, 1, 2, 3\./);
  assert.match(body, /<Hangup\/><\/Response>$/);
  assert.match(log, /"callerEndsIn":"0123"/);
  assert.match(log, /"callerType":"uk-mobile"/);
});

test("the full caller number never appears in the log or the reply", async () => {
  const { body, log } = await run(twilioCall({ From: "+447700900123" }));
  assert.doesNotMatch(log, /447700900123/);
  assert.doesNotMatch(body, /447700900123/);
  assert.match(log, /"caller":"\+44\*{6}0123"/);
});

test("a diverted call reports the caller, not the phone that diverted it", async () => {
  const { body, log } = await run(
    twilioCall({ From: "+447700900123", ForwardedFrom: "+447700900999" })
  );
  assert.match(body, /mobile number ending 0, 1, 2, 3\./);
  assert.match(body, /diverted from a number ending 0, 9, 9, 9\./);
  assert.match(log, /"callerEndsIn":"0123"/);
  assert.match(log, /"divertedFrom":"\+44\*{6}0999"/);
});

test("a withheld number is reported as withheld", async () => {
  for (const From of ["anonymous", "+266696687", "Restricted", ""]) {
    const { body, log } = await run(twilioCall({ From }));
    assert.match(body, /Your number was withheld/, `From=${From}`);
    assert.match(log, /"callerEndsIn":"withheld"/, `From=${From}`);
  }
});

test("a landline caller is recognised as a landline", async () => {
  const { body, log } = await run(twilioCall({ From: "+441132788088" }));
  assert.match(body, /U K landline number ending 8, 0, 8, 8\./);
  assert.match(log, /"callerType":"uk-landline"/);
});

test("Twilio can also call it with GET", async () => {
  const req = new Request(
    URL_ + "?CallSid=CA1&From=%2B447700900123&To=%2B447480000001"
  );
  const { body } = await run(req);
  assert.match(body, /ending 0, 1, 2, 3\./);
});

test("opening the address in a browser shows a plain 'live' message", async () => {
  const { res, body, log } = await run(new Request(URL_));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type"), /text\/plain/);
  assert.match(body, /call test is live/);
  assert.equal(log, "");
});

test("number types are sorted correctly", () => {
  const cases = {
    "+447700900123": "uk-mobile",
    "+447123456789": "uk-mobile",
    "+447911123456": "uk-mobile",
    "+447624123456": "uk-mobile", // Isle of Man mobile
    "+447012345678": "uk-other", // 070 personal number, not a mobile
    "+447600123456": "uk-other", // pager range
    "+441132788088": "uk-landline",
    "+442079460000": "uk-landline",
    "+443301234567": "uk-landline",
    "+448001234567": "uk-other", // freephone
    "+353871234567": "international",
    "+12125550123": "international",
    anonymous: "withheld",
    "+266696687": "withheld",
    "": "withheld",
    "07700900123": "withheld", // not in international format, so not trusted
  };
  for (const [number, expected] of Object.entries(cases)) {
    assert.equal(classifyNumber(number), expected, number);
  }
});
