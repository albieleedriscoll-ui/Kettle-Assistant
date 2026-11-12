// Runs the whole site on this computer, so a change can be looked at before anything is deployed.
//
//   node scripts/dev.mjs        then open  http://localhost:8788/?venue=copper-kettle
//
// Nothing here runs on Netlify, and nothing is spent:
// - Claude is played by a stand-in with a few canned answers written for the demo restaurant.
//   No API key is used, so this shows how the pages look and behave, not how the real Claude answers.
// - Enquiry forms are accepted and thrown away. No email is sent.

import http from "node:http";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PUBLIC = join(ROOT, "public");
const PORT = Number(process.env.PORT || 8788);
const ORIGIN = `http://localhost:${PORT}`;

// The real key never comes near this computer. These two lines point the code at the stand-in below.
process.env.ANTHROPIC_API_KEY = "local-stand-in";
process.env.CLAUDE_API_URL = `${ORIGIN}/__stand-in-claude`;

execFileSync(process.execPath, [join(ROOT, "scripts", "build.mjs")], { stdio: "inherit" });

const chat = (await import("../netlify/functions/chat.mjs")).default;
const check = (await import("../netlify/functions/check.mjs")).default;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function standInAnswer(question) {
  const q = question.toLowerCase();
  if (/\b(9|1\d|2\d)\b.*(people|of us|guests)|for (9|1\d|2\d)\b|group|private room/.test(q)) {
    return "That sounds lovely. Groups of 9 or more are confirmed by the team, so I'll pass this to them.\nHANDOFF: Group booking | Group booking request";
  }
  if (/book|table|reserv/.test(q)) {
    return "The booking page shows what's free and confirms straight away for up to 8 people.\nLINK: booking";
  }
  if (/park|bus|train|get there/.test(q)) {
    return "There's no car park, but there's pay-and-display on nearby streets, free after 6pm. Buses stop 2 minutes away and the station is a 10-minute walk.";
  }
  if (/gluten|vegan|vegetarian|dairy/.test(q)) {
    return "Many dishes can be made without gluten, though the kitchen does handle gluten. Dishes are marked V, VG and GF on the menu, and there are vegetarian and vegan dishes throughout.";
  }
  if (/open|close|last table|hours|time|saturday|sunday|monday|tonight/.test(q)) {
    return "On Fridays and Saturdays we're open 12pm to 11pm. The kitchen closes at 9:30pm and the last table is 9:15pm. Would you like the booking page?\nLINK: booking";
  }
  return "I don't have that information, but I can pass your question to the team.\nHANDOFF: Question for the team | A question the information sheet doesn't cover";
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function runFunction(fn, req, res, body) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const out = await fn(new Request(ORIGIN + req.url, { method: req.method, headers, body: hasBody ? body : undefined }));
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, ORIGIN).pathname;
    const body = await readBody(req);

    if (path === "/__stand-in-claude") {
      const sent = JSON.parse(body.toString() || "{}");
      const last = (sent.messages || []).at(-1);
      // The health check asks for the single word "ready". Say plainly that this isn't the real Claude.
      const isCheck = /single word: ready/.test(String(sent.system || ""));
      const text = isCheck ? "ready (stand-in, not the real Claude)" : standInAnswer(String((last && last.content) || ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ content: [{ type: "text", text }], stop_reason: "end_turn", usage: { input_tokens: 0, output_tokens: 0 } }));
    }
    if (path === "/api/chat") return await runFunction(chat, req, res, body);
    if (path === "/api/check") return await runFunction(check, req, res, body);

    if (req.method === "POST" && path === "/") {
      // Netlify Forms would store this and email it. Here it is dropped, and its contents are never printed.
      const form = new URLSearchParams(body.toString()).get("form-name");
      console.log(`FORM ${form || "(no form name)"} received and thrown away`);
      res.writeHead(form ? 200 : 404, { "Content-Type": "text/plain" });
      return res.end(form ? "ok" : "not found");
    }

    const file = resolve(PUBLIC, "." + (path === "/" ? "/index.html" : path));
    if (file !== PUBLIC && !file.startsWith(PUBLIC + sep)) throw Object.assign(new Error("outside"), { code: "ENOENT" });
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch (err) {
    const missing = err && (err.code === "ENOENT" || err.code === "EISDIR");
    if (!missing) console.error(err);
    res.writeHead(missing ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(missing ? "Not found" : "Something went wrong. See the terminal.");
  }
});

server.listen(PORT, () => {
  console.log(`\nLocal preview: ${ORIGIN}/?venue=copper-kettle`);
  console.log(`On a stand-in website: ${ORIGIN}/embed-demo.html?venue=copper-kettle`);
  console.log(`Health check: ${ORIGIN}/api/check`);
  console.log("Claude is a stand-in here. Answers are canned, and no key is used.\n");
});
