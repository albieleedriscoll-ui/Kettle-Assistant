// DRAFT. Not deployed: Netlify only publishes functions in netlify/functions.
//
// This is the call-test function from the first Twilio experiment (11 Nov 2026).
// When Twilio reports an incoming call it reads the caller's last four digits back
// and writes one masked log line. It sends no texts and stores nothing.
//
// Kept as the starting point for the Stage 4 voice function (see docs/PLAN.md):
// classifyNumber already sorts UK mobiles from landlines, 070 numbers, pagers and
// withheld callers. Before it goes live it needs Twilio signature checking.

// Numbers Twilio uses when the caller has hidden their number.
const WITHHELD_NUMBERS = new Set([
  "+266696687", // "ANONYMOUS" on a keypad
  "+7378742833", // "RESTRICTED"
  "+2562533", // "BLOCKED"
  "+8656696", // "UNKNOWN"
  "+86282452253", // "UNAVAILABLE"
]);

// Works out what kind of number rang. Stage 1 will only text "uk-mobile".
export function classifyNumber(raw) {
  const number = (raw || "").trim();
  if (!/^\+\d{7,15}$/.test(number) || WITHHELD_NUMBERS.has(number)) return "withheld";
  // UK mobiles: 071-075 and 077-079, plus 07624 (Isle of Man).
  // 070 (personal numbers) and the rest of 076 (pagers) are not mobiles.
  if (/^\+447(?:[1-5]\d{8}|624\d{6}|[7-9]\d{8})$/.test(number)) return "uk-mobile";
  if (/^\+44[1-3]\d{8,9}$/.test(number)) return "uk-landline";
  if (number.startsWith("+44")) return "uk-other";
  return "international";
}

function lastFour(number) {
  return (number || "").replace(/\D/g, "").slice(-4);
}

// "+447700900123" becomes "+44*******0123" so full numbers never sit in the log.
function mask(number) {
  const digits = (number || "").replace(/\D/g, "");
  if (digits.length < 7) return "hidden";
  return "+" + digits.slice(0, 2) + "*".repeat(digits.length - 6) + digits.slice(-4);
}

// "0123" becomes "0, 1, 2, 3" so the voice reads each digit separately.
function spoken(digits) {
  return digits.split("").join(", ");
}

const KIND_IN_WORDS = {
  "uk-mobile": "a U K mobile number",
  "uk-landline": "a U K landline number",
  "uk-other": "a U K number that is not a mobile",
  international: "an international number",
};

// Plain <Say> with no voice or language uses the account's default voice, which is
// free and always valid. Stage 1 picks a proper British voice.
function twiml(sentence) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    "<Response>" +
    '<Pause length="1"/>' +
    `<Say>${sentence}</Say>` +
    "<Hangup/>" +
    "</Response>"
  );
}

export default async (req) => {
  const params =
    req.method === "POST"
      ? new URLSearchParams(await req.text())
      : new URL(req.url).searchParams;

  // Opened in a web browser rather than called by Twilio: show a simple "it works" page.
  if (!params.get("CallSid")) {
    return new Response(
      "Kettle and Co call test is live. Point your Twilio number at this address.",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const from = params.get("From") || "";
  const forwardedFrom = params.get("ForwardedFrom") || "";
  const kind = classifyNumber(from);

  console.log(
    "CALL TEST " +
      JSON.stringify({
        time: new Date().toISOString(),
        callerEndsIn: kind === "withheld" ? "withheld" : lastFour(from),
        caller: kind === "withheld" ? "withheld" : mask(from),
        callerType: kind,
        numberRang: mask(params.get("To")),
        divertedFrom: forwardedFrom ? mask(forwardedFrom) : "not given",
      })
  );

  let sentence = "This is the Kettle and Co test line. ";
  if (kind === "withheld") {
    sentence += "Your number was withheld, so we could not see who is calling.";
  } else {
    sentence += `Your call arrived from ${KIND_IN_WORDS[kind]} ending ${spoken(lastFour(from))}.`;
  }
  if (forwardedFrom && classifyNumber(forwardedFrom) !== "withheld") {
    sentence += ` The call was diverted from a number ending ${spoken(lastFour(forwardedFrom))}.`;
  }
  sentence += " Goodbye.";

  return new Response(twiml(sentence), {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
};
