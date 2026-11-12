// Helpers for venue files: checking them at deploy time and deciding what the chat page may see.

export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// What the chat page is given. The information sheet stays on the server.
export function publicView(id, v) {
  return {
    id,
    name: v.name,
    label: v.label || "",
    demo: Boolean(v.demo),
    phone: v.phone || "",
    bookingUrl: v.bookingUrl || "",
    bookingLabel: v.bookingLabel || "Open booking page",
    accent: v.accent || "#1C6A4F",
    greeting: v.greeting,
    suggested: (v.suggested || []).slice(0, 5),
  };
}

// True when a guest can be sent to a booking page (demo venues show an explanation instead).
export function hasBookingPage(v) {
  return Boolean(v.bookingUrl) || Boolean(v.demo);
}

function contrastWithWhite(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum =
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return 1.05 / (lum + 0.05);
}

// Returns a list of plain-English problems. An empty list means the venue file is fine.
export function checkVenue(id, v) {
  const problems = [];
  const text = (x) => typeof x === "string" && x.trim().length > 0;

  if (!ID_PATTERN.test(id)) {
    problems.push(
      `the file name "${id}.mjs" must be lowercase letters, numbers and hyphens only (for example jinos-thai-cafe.mjs)`
    );
  }
  if (!v || typeof v !== "object") {
    problems.push("the file must contain: export default { ... }");
    return problems;
  }
  if (!text(v.name)) problems.push('"name" is missing');
  if (!text(v.kind)) problems.push('"kind" is missing (for example "an independent restaurant in Leeds")');
  if (!text(v.phone)) problems.push('"phone" is missing');
  if (!text(v.greeting)) problems.push('"greeting" is missing');
  if (!text(v.info) || v.info.trim().length < 80) {
    problems.push('"info" is missing or too short. It needs the opening hours, booking rules and so on');
  }
  if (text(v.info) && v.info.length > 12000) {
    problems.push('"info" is too long. Keep it under 12,000 characters');
  }
  if (text(v.info)) {
    const empty = v.info.split("\n").map((l) => l.trim()).filter((l) => /^[^:]{2,40}:$/.test(l));
    if (empty.length) {
      problems.push(`"info" has lines with nothing written after them (${empty.join(" ")}). Fill them in or delete them`);
    }
  }
  if (v.bookingUrl && !/^https:\/\/\S+$/.test(v.bookingUrl)) {
    problems.push('"bookingUrl" must start with https:// and have no spaces (or be left as "")');
  }
  if (v.accent) {
    if (!/^#[0-9a-fA-F]{6}$/.test(v.accent)) {
      problems.push('"accent" must be a six-digit colour code such as #1C6A4F');
    } else if (contrastWithWhite(v.accent) < 4.5) {
      problems.push(`"accent" ${v.accent} is too light for white text to show on it. Pick a darker shade`);
    }
  }
  if (v.suggested && (!Array.isArray(v.suggested) || v.suggested.some((s) => !text(s)))) {
    problems.push('"suggested" must be a list of questions in quotes');
  }
  if (/^\s*restaurant name\s*$/i.test(v.name || "")) {
    problems.push('"name" still says "Restaurant Name". Fill in the template');
  }
  return problems;
}
