// The second safety layer. These checks are ordinary code, so they work the same way every
// time and don't depend on Claude following its instructions.
//
//   screenQuestion  looks at the guest's message BEFORE Claude sees it. Allergy questions,
//                   possible reactions and complaints get a fixed, pre-written reply and a form.
//                   Claude is never asked.
//   screenReply     looks at Claude's answer BEFORE the guest sees it. If it sounds like an
//                   allergy promise or a booking confirmation, it is thrown away and replaced.

import { hasBookingPage } from "./venue.mjs";

const ALLERGEN_WORDS =
  "nuts?|peanuts?|tree nuts?|almonds?|cashews?|walnuts?|hazelnuts?|pistachios?|sesame|shellfish|prawns?|" +
  "crustaceans?|molluscs?|mustard|sulphites?|sulfites?|soya?|lupin|celery|gluten|wheat|dairy|milk|lactose|eggs?|fish";

const EMERGENCY =
  /\b(reaction|anaphyla\w*|epi-?pen|can'?t breathe|cannot breathe|throat (is )?(closing|swelling|tight)|swelling up|swollen (lips?|tongue|face|throat|mouth)|(lips?|tongue|face|throat|mouth) (is|are|has|have|keeps?|started)? ?(swelling|swollen|swelled|swell(ed)? up|gone numb|tingling))\b/i;

const STRONG_ALLERGY =
  /\b(al+er+g\w*|intoler\w*|coeliacs?|celiacs?|ceoliacs?|cross[- ]?contaminat\w*|traces? of|may contain|(shared|same|separate|dedicated) fryer)\b/i;

const ALLERGEN = new RegExp(`\\b(${ALLERGEN_WORDS})\\b`, "i");

const SAFETY_WORDS =
  /\b(safe|definitely|guarantee\w*|promise\w*|100\s?%|contains?|containing|free from|without any|no traces?)\b/i;

// "nut-free", "egg free" and so on. Gluten-free and dairy-free alone are treated as a diet question.
const FREE_OF_ALLERGEN =
  /\b(nut|peanut|sesame|shellfish|egg|soya?|celery|mustard|lupin|fish|wheat|milk)s?[- ]free\b/i;

const DIET = new RegExp(
  `\\b(${ALLERGEN_WORDS}|vegan\\w*|vegetarian\\w*|veggie|dietary|plant[- ]based|gf)\\b`,
  "i"
);

const COMPLAINT =
  /\b(complain\w*|food poisoning|overcharged|money back|(want|need|demand|give me) (a |my )?refund|(made|make) (me|us|him|her|them) (ill|sick)|(was|were|been|got) (ill|sick) after)\b/i;

// Things Claude must never say about allergens.
const ALLERGY_PROMISE =
  /\b(100\s?%|guarantee\w*|(completely|totally|perfectly|entirely) safe|safe (for|to eat)|(is|are|it'?s|that'?s|will be) safe|no risk|won'?t contain|will not contain|does(n'?t| not) contain|do(n'?t| not) contain|free from|no traces?|definitely)\b/gi;

// Things Claude must never say about bookings and payments.
const BOOKING_DONE = new RegExp(
  [
    "\\bi(?:'ve| have)(?: now| just| already)? (?:booked|reserved|confirmed|cancell?ed|amended|changed|moved|refunded|processed|taken (?:a|your|the) (?:deposit|payment))",
    "\\byour (?:table|booking|reservation|appointment|deposit|refund|cancellation|payment) (?:is|has been|was)(?: now| all)? (?:confirmed|booked|reserved|cancell?ed|refunded|processed|taken|secured|set|sorted)",
    "\\b(?:booking|reservation|table)(?: is| is now)? confirmed\\b",
    "\\byou(?:'re| are)(?: now| all)? (?:booked|confirmed)\\b",
    "\\bconsider it (?:booked|done)\\b",
  ].join("|"),
  "gi"
);

const NEGATION =
  /\b(can'?t|cannot|can not|couldn'?t|unable|not able|won'?t be able|wouldn'?t|shouldn'?t|never|not|no|isn'?t|aren'?t|nothing)\b/i;
const CLAUSE_BREAK = /[.!?;:,\n]|\bbut\b|\bhowever\b|\bthough\b/gi;

// True if the pattern appears somewhere it isn't being denied.
// "I can't guarantee that" is fine. "I can't park there, but it is definitely nut-free" is not.
export function saysWithoutDenying(text, pattern) {
  const t = String(text || "");
  for (const match of t.matchAll(pattern)) {
    const before = t.slice(0, match.index);
    let clauseStart = 0;
    for (const br of before.matchAll(CLAUSE_BREAK)) clauseStart = br.index + br[0].length;
    if (!NEGATION.test(before.slice(clauseStart))) return true;
  }
  return false;
}

const GROUP_TYPE = /group|party|event|private|function|wedding|christmas|large|celebrat/i;
const URGENT_TYPE = /allerg|intoleran|coeliac|celiac|medical|reaction|complain|poison|\bill\b|sick/i;

export function screenQuestion(text) {
  const t = String(text || "");
  const diet = DIET.test(t);
  if (EMERGENCY.test(t)) return { kind: "emergency", diet };
  if (STRONG_ALLERGY.test(t) || FREE_OF_ALLERGEN.test(t) || (ALLERGEN.test(t) && SAFETY_WORDS.test(t))) {
    return { kind: "allergy", diet };
  }
  if (COMPLAINT.test(t)) return { kind: "complaint", diet };
  return { kind: null, diet };
}

export function fieldsFor(type) {
  return GROUP_TYPE.test(type || "") ? ["date", "size", "name", "contact"] : ["name", "contact"];
}

export function makeHandoff(type, summary = "", urgent = false) {
  const cleanType = String(type || "").replace(/\s+/g, " ").trim().slice(0, 60) || "Question for the team";
  const cleanSummary = String(summary || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return {
    type: cleanType,
    summary: cleanSummary,
    urgent: Boolean(urgent) || URGENT_TYPE.test(cleanType + " " + cleanSummary),
    fields: fieldsFor(cleanType),
  };
}

function allergyOffer() {
  return {
    label: "Ask the team about an allergy",
    lead: "Of course. Pop your details in and I'll pass it to the team.",
    handoff: makeHandoff("Allergy question", "", true),
  };
}

// The pre-written replies. Claude is not involved in any of these.
export function fixedReply(kind, venue) {
  const phone = venue.phone;
  if (kind === "emergency") {
    return {
      reply:
        "If someone is having an allergic reaction right now, call 999.\n\n" +
        `I can't give medical or allergy advice, but I'll pass this to the team straight away. Leave your details below, or call ${phone}.`,
      handoff: makeHandoff("Allergy or reaction", "", true),
    };
  }
  if (kind === "allergy") {
    return {
      reply:
        "I can't give allergy advice or promise that a dish is free from an allergen, so I won't guess. " +
        "The team can check the allergen information and talk you through it properly.\n\n" +
        `Leave your details below, or call ${phone}.`,
      handoff: makeHandoff("Allergy question", "", true),
    };
  }
  if (kind === "complaint") {
    return {
      reply:
        "I'm sorry to hear that. This needs a person, not me, so I'll pass it straight to the manager. " +
        "Leave your details below and they'll be in touch.",
      handoff: makeHandoff("Complaint", "", true),
    };
  }
  if (kind === "booking") {
    const hasPage = hasBookingPage(venue);
    return {
      reply:
        "I can't make, change or confirm bookings or payments myself. " +
        (hasPage
          ? "For a new booking, the booking page shows what's free and confirms straight away. For an existing booking, a deposit or a refund, "
          : "For a new booking or anything about an existing one, ") +
        `call ${phone}, or I can pass your details to the team.`,
      link: hasPage,
      offer: {
        label: "Pass my details to the team",
        lead: "Sure. Pop your details in and I'll pass it on.",
        handoff: makeHandoff("Booking query"),
      },
    };
  }
  // "unavailable": Claude couldn't answer (no key, no credit, or their servers are busy).
  return {
    reply:
      `Sorry, I'm having trouble answering right now. You can call us on ${phone}, ` +
      "or leave your details and I'll pass your question to the team.",
    offer: {
      label: "Pass my question to the team",
      lead: "Sure. Pop your details in and I'll send your question over.",
      handoff: makeHandoff("Question for the team"),
    },
  };
}

// Splits Claude's raw answer into the words for the guest and the two signals it may add.
export function parseTags(raw) {
  const text = String(raw || "");
  const handoffMatch = text.match(/^\s*HANDOFF:\s*([^|\n]+)(?:\|\s*(.*))?$/im);
  const link = /^\s*LINK:\s*booking\b/im.test(text);
  const clean = text
    .replace(/^\s*(HANDOFF|LINK):.*$/gim, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    text: clean,
    link,
    handoff: handoffMatch ? makeHandoff(handoffMatch[1], handoffMatch[2] || "") : null,
  };
}

// Checks Claude's answer. Returns what the guest should actually be shown.
export function screenReply({ question, parsed, venue }) {
  const reply = parsed.text;
  const askedAboutDiet = DIET.test(question);

  if ((askedAboutDiet || DIET.test(reply)) && saysWithoutDenying(reply, ALLERGY_PROMISE)) {
    return { ...fixedReply("allergy", venue), guard: "allergy" };
  }
  if (saysWithoutDenying(reply, BOOKING_DONE)) {
    return { ...fixedReply("booking", venue), guard: "booking" };
  }

  const out = {
    reply,
    link: parsed.link && hasBookingPage(venue),
    handoff: parsed.handoff,
    guard: null,
  };

  // Any answer to a food or diet question carries the allergy note and a way to reach the team.
  if (askedAboutDiet && !out.handoff) {
    if (!/allerg|coeliac|celiac/i.test(reply)) {
      out.reply += "\n\nIf you have an allergy or you're coeliac, please check with the team before you order.";
    }
    out.offer = allergyOffer();
  }
  return out;
}
