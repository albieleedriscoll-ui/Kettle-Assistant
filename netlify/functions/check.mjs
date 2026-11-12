// A plain-English health check. Open  https://YOUR-SITE.netlify.app/api/check  in a browser.
// It sends Claude one tiny test question (a fraction of a penny) and says what it found.

import venues from "../../venues/_index.mjs";
import { askClaude, MODEL } from "../../lib/claude.mjs";

export const config = { path: "/api/check" };

const ADVICE = {
  "no-key":
    "The Claude API key hasn't been added. In Netlify, add an environment variable called ANTHROPIC_API_KEY, then deploy again.",
  key: "Claude didn't accept the API key. Check the whole key was pasted into Netlify with no spaces, then deploy again.",
  credit:
    "Claude says there's no credit to use. Add credit in the Claude Console, or raise the monthly spend limit there.",
  limit: "Claude is limiting requests right now. Wait a minute and refresh this page.",
  model: `Claude doesn't recognise the model name "${MODEL}". Ask Claude to update the model in lib/claude.mjs.`,
  busy: "Claude's servers are busy or unreachable. Wait a minute and refresh this page.",
  timeout: "Claude took too long to answer. Wait a minute and refresh this page.",
  other: "Claude returned an error this check doesn't recognise. The message is shown below.",
};

let last = { at: 0, result: null };

async function testClaude() {
  // At most one real test every 15 seconds, however often the page is refreshed.
  if (last.result && Date.now() - last.at < 15000) return last.result;
  let result;
  try {
    const out = await askClaude({
      system: "Reply with the single word: ready",
      messages: [{ role: "user", content: "Are you there?" }],
      maxTokens: 20,
      timeoutMs: 15000,
    });
    result = { ok: true, detail: `Claude answered: "${out.text.slice(0, 40)}"` };
  } catch (err) {
    const kind = err.kind || "other";
    result = { ok: false, detail: ADVICE[kind] || ADVICE.other, message: kind === "no-key" ? "" : err.message };
  }
  last = { at: Date.now(), result };
  return result;
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default async function handler() {
  const ids = Object.keys(venues);
  const claude = await testClaude();
  const rows = [
    {
      ok: ids.length > 0,
      title: "Restaurants loaded",
      detail: ids.length ? ids.map((id) => `${venues[id].name} (${id})`).join(", ") : "None found in the venues folder.",
    },
    { ok: claude.ok, title: "Claude", detail: claude.detail, message: claude.message },
  ];
  const allOk = rows.every((r) => r.ok);

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Assistant check</title>
<style>body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#14201A}
h1{font-size:24px}.row{border:1px solid #D3DCD7;border-radius:10px;padding:12px 14px;margin:10px 0}
.ok b{color:#1C6A4F}.bad b{color:#9E3219}.row p{margin:4px 0 0}code{background:#E7EEEA;padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
small{color:#56655E}</style></head><body>
<h1>${allOk ? "All working" : "Something needs fixing"}</h1>
${rows
  .map(
    (r) => `<div class="row ${r.ok ? "ok" : "bad"}"><b>${r.ok ? "Working" : "Problem"}: ${esc(r.title)}</b>
<p>${esc(r.detail)}</p>${r.message ? `<p><small>Message from Claude: <code>${esc(r.message)}</code></small></p>` : ""}</div>`
  )
  .join("\n")}
<p><small>This page can't test the enquiry emails. To test those, send yourself an enquiry from the chat page.</small></p>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
