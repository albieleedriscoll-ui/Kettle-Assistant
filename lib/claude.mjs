// Talks to Claude. No extra software is needed: it is one web request.

export const MODEL = "claude-haiku-5-5";
const API_VERSION = "2026-10-21";
const DEFAULT_URL = "https://api.anthropic.com/v1/messages";

export class ClaudeError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.kind = kind; // "no-key" | "key" | "credit" | "limit" | "model" | "busy" | "timeout" | "other"
    this.status = status;
  }
}

function classify(status, type, message) {
  const m = (message || "").toLowerCase();
  if (m.includes("credit") || m.includes("billing")) return "credit";
  if (status === 401 || status === 403) return "key";
  if (status === 404 || (type === "not_found_error")) return "model";
  if (status === 429) return m.includes("spend") ? "credit" : "limit";
  if (status === 529 || status >= 500) return "busy";
  return "other";
}

async function post(url, key, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": API_VERSION,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") throw new ClaudeError("timeout", "Claude took too long to answer");
    throw new ClaudeError("busy", `Could not reach Claude: ${err && err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function askClaude({ system, messages, maxTokens = 400, timeoutMs = 25000 }) {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) throw new ClaudeError("no-key", "ANTHROPIC_API_KEY is not set");
  const url = process.env.CLAUDE_API_URL || DEFAULT_URL;

  const base = { model: MODEL, max_tokens: maxTokens, system, messages };

  // Short answers don't need Claude's extended thinking, so it is switched off for speed.
  let res = await post(url, key, { ...base, thinking: { type: "disabled" } }, timeoutMs);

  // If Claude rejects that setting, ask again with only the essentials.
  if (res.status === 400) {
    const first = await res.json().catch(() => null);
    const msg = (first && first.error && first.error.message) || "";
    if (classify(400, first && first.error && first.error.type, msg) === "credit") {
      throw new ClaudeError("credit", msg, 400);
    }
    res = await post(url, key, { ...base, max_tokens: Math.max(maxTokens, 1500) }, timeoutMs);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const type = data && data.error && data.error.type;
    const message = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    throw new ClaudeError(classify(res.status, type, message), message, res.status);
  }

  const text = ((data && data.content) || [])
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return {
    text,
    stop: data && data.stop_reason,
    tokensIn: (data && data.usage && data.usage.input_tokens) || 0,
    tokensOut: (data && data.usage && data.usage.output_tokens) || 0,
  };
}
