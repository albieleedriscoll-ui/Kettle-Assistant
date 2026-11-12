// The chat endpoint: POST /api/chat answers one guest message.

import venues from "../../venues/_index.mjs";
import { buildSystemPrompt } from "../../lib/prompt.mjs";
import { screenQuestion, screenReply, fixedReply, parseTags } from "../../lib/guard.mjs";
import { askClaude } from "../../lib/claude.mjs";

export const config = {
  path: "/api/chat",
  // One internet connection can send 30 messages a minute. This protects your Claude credit.
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

const MAX_BODY = 20000;
const MAX_QUESTION = 500;
const MAX_TURNS = 12;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Only pages on this site may use the chat. Stops other websites spending your credit.
function sameSite(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set();
  const add = (value) => {
    if (!value) return;
    try {
      allowed.add(value.includes("://") ? new URL(value).host : value);
    } catch {
      /* ignore */
    }
  };
  add(req.url);
  add(req.headers.get("host"));
  add(req.headers.get("x-forwarded-host"));
  add(process.env.URL);
  add(process.env.DEPLOY_PRIME_URL);
  add(process.env.DEPLOY_URL);
  return allowed.has(originHost);
}

// Tidies the conversation the page sends: right shape, right length, starts with the guest.
function cleanTurns(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return null;
  const turns = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const content = m.content.trim().slice(0, m.role === "user" ? MAX_QUESTION : 2000);
    if (!content) continue;
    const prev = turns[turns.length - 1];
    if (prev && prev.role === m.role) prev.content += "\n\n" + content;
    else turns.push({ role: m.role, content });
  }
  const recent = turns.slice(-MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();
  if (!recent.length || recent[recent.length - 1].role !== "user") return null;
  return recent;
}

function log(venueId, route, extra = {}) {
  // One line per answer. No message text and no personal details are written here.
  console.log("CHAT " + JSON.stringify({ venue: venueId, route, ...extra }));
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!sameSite(req)) return json({ error: "forbidden" }, 403);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "too-long" }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad-request" }, 400);
  }

  const id = String((body && body.venue) || "").toLowerCase();
  const venue = Object.hasOwn(venues, id) ? venues[id] : null;
  if (!venue) return json({ error: "unknown-venue" }, 404);

  const lastRaw = Array.isArray(body.messages) && body.messages[body.messages.length - 1];
  if (lastRaw && typeof lastRaw.content === "string" && lastRaw.content.trim().length > MAX_QUESTION) {
    log(id, "too-long");
    return json({ reply: "That's a long one! Could you ask it in a sentence or two?" });
  }

  const turns = cleanTurns(body.messages);
  if (!turns) return json({ error: "bad-request" }, 400);
  const question = turns[turns.length - 1].content;

  // Safety check 1: some questions never go to Claude.
  const screened = screenQuestion(question);
  if (screened.kind) {
    log(id, "fixed:" + screened.kind);
    return json(fixedReply(screened.kind, venue));
  }

  let answer;
  try {
    answer = await askClaude({ system: buildSystemPrompt(venue), messages: turns });
  } catch (err) {
    console.error("CLAUDE PROBLEM " + JSON.stringify({ venue: id, kind: err.kind || "other", message: err.message }));
    log(id, "unavailable:" + (err.kind || "other"));
    return json(fixedReply("unavailable", venue));
  }

  const parsed = parseTags(answer.text);
  if (!parsed.text) {
    log(id, "unavailable:empty", { stop: answer.stop });
    return json(fixedReply("unavailable", venue));
  }

  // Safety check 2: Claude's answer is checked before the guest sees it.
  const checked = screenReply({ question, parsed, venue });
  log(id, checked.guard ? "replaced:" + checked.guard : "claude", {
    in: answer.tokensIn,
    out: answer.tokensOut,
    handoff: Boolean(checked.handoff),
    link: Boolean(checked.link),
  });

  const { guard, ...response } = checked;
  return json(response);
}
