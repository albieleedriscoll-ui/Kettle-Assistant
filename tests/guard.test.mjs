// Tests for the safety checks. Run all tests with:  node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenQuestion, screenReply, parseTags, fixedReply, makeHandoff, saysWithoutDenying } from "../lib/guard.mjs";
import venue from "../venues/copper-kettle.mjs";

test("guest questions are sorted into the right route", () => {
  const cases = {
    // Straight to the team, Claude never asked
    "My daughter has a nut allergy, what can she eat?": "allergy",
    "I'm coeliac. Is the kitchen separate?": "allergy",
    "so it's definitely gluten-free?": "allergy",
    "Does the nut roast contain nuts?": "allergy",
    "Are the chips cooked in a shared fryer?": "allergy",
    "Is the soup safe for someone who can't have dairy?": "allergy",
    "do you have egg free pasta": "allergy",
    "Is the roast free from sesame?": "allergy",
    "Can you guarantee no gluten in the gravy?": "allergy",
    "I'm lactose intolerant": "allergy",
    "Any traces of peanuts in the desserts?": "allergy",
    "ALLERGIES?": "allergy",
    // Possible reaction
    "My son is having a reaction after eating at yours": "emergency",
    "she used her epipen at your restaurant last night": "emergency",
    "I think I'm going into anaphylaxis": "emergency",
    // Complaints
    "I want to complain about last night": "complaint",
    "We got food poisoning": "complaint",
    "I want a refund": "complaint",
    "You overcharged us on Saturday": "complaint",
    "the fish made me sick": "complaint",
    // Ordinary questions go to Claude
    "Do you do gluten-free?": null,
    "Do you have a nut roast?": null,
    "Is the deposit refundable?": null,
    "What time's your last table on Saturday?": null,
    "Is there parking?": null,
    "Book me a table for 2 tonight": null,
    "Do you have vegan options?": null,
    "Is the fish fresh?": null,
    "Is there definitely parking after 6?": null,
    "Can I book for 12 on 12 December?": null,
    "Are dogs allowed?": null,
  };
  for (const [question, expected] of Object.entries(cases)) {
    assert.equal(screenQuestion(question).kind, expected, question);
  }
});

test("food and diet questions are recognised", () => {
  assert.equal(screenQuestion("Do you do gluten-free?").diet, true);
  assert.equal(screenQuestion("Any vegan mains?").diet, true);
  assert.equal(screenQuestion("Is there parking?").diet, false);
});

test("the fixed replies never promise anything and always offer the team", () => {
  for (const kind of ["allergy", "emergency", "complaint"]) {
    const r = fixedReply(kind, venue);
    assert.equal(r.handoff.urgent, true, kind);
    assert.deepEqual(r.handoff.fields, ["name", "contact"], kind);
    assert.doesNotMatch(r.reply, /is safe|are safe|is gluten-free|confirmed/i, kind);
  }
  assert.match(fixedReply("emergency", venue).reply, /call 999/);
  assert.match(fixedReply("allergy", venue).reply, /0113 496 0123/);
  assert.match(fixedReply("unavailable", venue).reply, /0113 496 0123/);
  assert.ok(fixedReply("unavailable", venue).offer);
});

test("denied statements are told apart from promises", () => {
  const promise = /\b(guarantee\w*|definitely|safe for)\b/gi;
  assert.equal(saysWithoutDenying("I can't guarantee that.", promise), false);
  assert.equal(saysWithoutDenying("It's not definitely free of gluten.", promise), false);
  assert.equal(saysWithoutDenying("We guarantee it.", promise), true);
  assert.equal(saysWithoutDenying("I can't park you, but it is definitely fine.", promise), true);
  assert.equal(saysWithoutDenying("No. It is safe for coeliacs.", promise), true);
  assert.equal(saysWithoutDenying("Nothing here at all.", promise), false);
});

test("Claude's signals are split from the words", () => {
  const p = parseTags("A table for 12, lovely!\nThe team confirms bigger tables.\nHANDOFF: Group booking | 12 people on 12 December\nLINK: booking");
  assert.equal(p.text, "A table for 12, lovely!\nThe team confirms bigger tables.");
  assert.equal(p.link, true);
  assert.equal(p.handoff.type, "Group booking");
  assert.equal(p.handoff.summary, "12 people on 12 December");
  assert.deepEqual(p.handoff.fields, ["date", "size", "name", "contact"]);
  assert.equal(p.handoff.urgent, false);

  const plain = parseTags("We're open **12pm to 10pm**.");
  assert.equal(plain.text, "We're open 12pm to 10pm.");
  assert.equal(plain.link, false);
  assert.equal(plain.handoff, null);

  assert.equal(parseTags("Sorry about that.\nHANDOFF: Complaint | cold food").handoff.urgent, true);
  assert.equal(makeHandoff("x".repeat(200)).type.length, 60);
});

const check = (question, reply) => screenReply({ question, parsed: parseTags(reply), venue });

test("a good diet answer is kept, with the allergy note and a way to reach the team", () => {
  const r = check("Do you do gluten-free?", "Yes, lots of our dishes can be made without gluten and they're marked GF on the menu.");
  assert.equal(r.guard, null);
  assert.match(r.reply, /marked GF on the menu/);
  assert.match(r.reply, /If you have an allergy or you're coeliac, please check with the team/);
  assert.equal(r.offer.handoff.urgent, true);
});

test("the allergy note isn't doubled when Claude already gave one", () => {
  const r = check("Do you do gluten-free?", "Yes, many dishes are marked GF. Our kitchen handles gluten, so if you're coeliac please speak to the team.");
  assert.equal((r.reply.match(/coeliac/g) || []).length, 1);
  assert.ok(r.offer);
});

test("an allergy promise from Claude is thrown away", () => {
  const promises = [
    "Yes, the nut roast is definitely gluten-free.",
    "Our fryer is separate so the chips are safe for coeliacs.",
    "That dish doesn't contain any dairy.",
    "It is 100% vegan and free from nuts.",
    "We guarantee there's no gluten in it.",
  ];
  for (const reply of promises) {
    const r = check("Do you do gluten-free?", reply);
    assert.equal(r.guard, "allergy", reply);
    assert.match(r.reply, /I can't give allergy advice/, reply);
    assert.equal(r.handoff.urgent, true, reply);
  }
});

test("a promise is caught even when the guest's question looked harmless", () => {
  const r = check("What's in the Sunday roast?", "Beef, pork or a nut roast, and the gravy is safe for anyone avoiding gluten.");
  assert.equal(r.guard, "allergy");
});

test("Claude saying it can't promise is allowed through", () => {
  const r = check("Do you do gluten-free?", "Lots of dishes are marked GF, but I can't guarantee anything about allergens, so please ask the team.");
  assert.equal(r.guard, null);
  assert.match(r.reply, /marked GF/);
});

test("a booking or payment confirmation from Claude is thrown away", () => {
  const confirmations = [
    "Great, I've booked you a table for 2 at 7pm.",
    "Your table is confirmed for tonight.",
    "All done, you're booked in!",
    "Your refund has been processed.",
    "I have cancelled your reservation.",
    "Booking confirmed for Saturday.",
  ];
  for (const reply of confirmations) {
    const r = check("Book me a table for 2 tonight", reply);
    assert.equal(r.guard, "booking", reply);
    assert.match(r.reply, /I can't make, change or confirm bookings/, reply);
    assert.equal(r.link, true, reply);
    assert.ok(r.offer, reply);
  }
});

test("ordinary booking answers are left alone", () => {
  const ok = [
    "The booking page shows every free table and confirms straight away. I can't confirm tables myself.",
    "Groups of 9 or more pay a £10 per head deposit when the team confirms the booking.",
    "Nothing is booked until the team confirm it.",
    "I can't confirm your table is booked, but the booking page will.",
  ];
  for (const reply of ok) {
    assert.equal(check("Can I book?", reply + "\nLINK: booking").guard, null, reply);
  }
});

test("an ordinary answer is passed through untouched", () => {
  const r = check("Is there parking?", "There's no car park, but pay-and-display nearby is free after 6pm.");
  assert.equal(r.reply, "There's no car park, but pay-and-display nearby is free after 6pm.");
  assert.equal(r.link, false);
  assert.equal(r.handoff, null);
  assert.equal(r.offer, undefined);
});

test("no booking button is offered for a venue without a booking page", () => {
  const phoneOnly = { ...venue, demo: false, bookingUrl: "" };
  const r = screenReply({ question: "Can I book?", parsed: parseTags("Give us a ring.\nLINK: booking"), venue: phoneOnly });
  assert.equal(r.link, false);
  assert.doesNotMatch(fixedReply("booking", phoneOnly).reply, /booking page/);
});
