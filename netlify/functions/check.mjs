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

const STYLE = `
:root{--fg:#17201C;--muted:#5A6761;--line:#E0E5E2;--bg:#F4F5F3;--ok:#1C6A4F;--ok-soft:#E6F0EB;--bad:#9E3219;--bad-soft:#F9E1DA}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:680px;margin:0 auto;padding:36px 20px 56px}
.eyebrow{margin:0 0 10px;font-size:12.5px;font-weight:650;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.status{display:flex;align-items:center;gap:14px;padding:20px 22px;border-radius:18px;background:#fff;border:1px solid var(--line)}
.status i{width:14px;height:14px;border-radius:50%;flex:none;background:var(--ok);box-shadow:0 0 0 6px var(--ok-soft)}
.status.bad i{background:var(--bad);box-shadow:0 0 0 6px var(--bad-soft)}
h1{font-size:24px;line-height:1.2;margin:0}
.status small{display:block;margin-top:2px;color:var(--muted);font-size:14px}
h2{font-size:13px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:30px 2px 10px}
.row{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 10px}
.row b{display:block}.ok b{color:var(--ok)}.bad b{color:var(--bad)}
.row p{margin:4px 0 0}
.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.links a{display:inline-block;padding:7px 14px;border-radius:999px;border:1px solid #BBD6CA;color:var(--ok);font-size:14.5px;font-weight:600;text-decoration:none}
.links a:hover{background:var(--ok-soft)}
code{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#EEF2EF;padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
pre{margin:6px 0 0;padding:10px 12px;border-radius:10px;background:#EEF2EF;overflow-x:auto}
pre code{background:none;padding:0;white-space:pre-wrap}
small,.muted{color:var(--muted);font-size:14px}
`;

export default async function handler(req) {
  let origin = "";
  try {
    origin = new URL(req.url).origin;
  } catch {
    /* no address to build links from */
  }
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
  const checked = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date());

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Assistant check</title>
<style>${STYLE}</style></head><body><main>
<p class="eyebrow">Kettle and Co website assistant</p>
<div class="status ${allOk ? "ok" : "bad"}"><i></i><div><h1>${allOk ? "All working" : "Something needs fixing"}</h1>
<small>Checked at ${checked}, UK time. Refresh the page to check again.</small></div></div>

<h2>Checks</h2>
${rows
  .map(
    (r) => `<div class="row ${r.ok ? "ok" : "bad"}"><b>${r.ok ? "Working" : "Problem"}: ${esc(r.title)}</b>
<p>${esc(r.detail)}</p>${r.message ? `<p><small>Message from Claude: <code>${esc(r.message)}</code></small></p>` : ""}</div>`
  )
  .join("\n")}

${ids.length ? "<h2>Restaurants</h2>" : ""}
${ids
  .map((id) => {
    const q = encodeURIComponent(id);
    return `<div class="row"><b>${esc(venues[id].name)}</b>
<div class="links"><a href="/?venue=${q}">Open the chat page</a><a href="/embed-demo.html?venue=${q}">See it on a stand-in website</a></div>
<p class="muted">The one line for their website:</p>
<pre><code>${esc(`<script src="${origin}/widget.js" data-venue="${id}" async></script>`)}</code></pre></div>`;
  })
  .join("\n")}

<p><small>This page can't test the enquiry emails. To test those, send yourself an enquiry from the chat page.</small></p>
</main></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
