# Kettle and Co website assistant

A chat assistant for restaurant websites. It answers guests' questions from the restaurant's own information, sends bookings to the booking page they already use, and passes allergies, complaints and big groups to staff by email.

Setup guide (step by step): https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH

## What's in here

| Folder or file | What it is | Do you edit it? |
|---|---|---|
| `venues/` | One file per restaurant. `copper-kettle.mjs` is the demo. `_template.mjs` is the one to copy. | Yes |
| `public/index.html` | The chat page guests see. | No |
| `public/widget.js` | The chat button a restaurant adds to its own website. | No |
| `public/embed-demo.html` | A stand-in restaurant homepage, to show owners the button. | No |
| `public/stress.html` | The stress test. Open `/stress.html?venue=ID` and click Run before a restaurant goes live. | No |
| `netlify/functions/chat.mjs` | Answers each guest message. | No |
| `netlify/functions/check.mjs` | The health check page at `/api/check`. | No |
| `lib/prompt.mjs` | The instructions Claude is given. | No |
| `lib/guard.mjs` | The safety checks that don't rely on Claude. | No |
| `lib/claude.mjs` | Sends the question to Claude. | No |
| `scripts/build.mjs` | Runs on every deploy. Checks the restaurant files. | No |
| `scripts/dev.mjs` | Shows the site on your own computer, without deploying. Not live. | No |
| `netlify.toml` | Netlify's settings. | No |
| `tests/` | Automated tests. | No |
| `CLAUDE.md` | Instructions Claude Code reads at the start of every session. | No |
| `docs/PLAN.md` | What gets built next, stage by stage. | No |
| `docs/STATUS.md` | Where things stand. Claude Code keeps it up to date. | No |
| `drafts/` | Unfinished code that isn't live yet. | No |

Written automatically on every deploy, so never edit these: `venues/_index.mjs`, `public/forms.html`, `public/venues/`.

## Addresses once it's live

Replace `YOUR-NAME` with your Netlify project name and `ID` with a restaurant's file name (without `.mjs`).

- Chat page: `https://YOUR-NAME.netlify.app/?venue=ID`
- On a stand-in website: `https://YOUR-NAME.netlify.app/embed-demo.html?venue=ID`
- Health check: `https://YOUR-NAME.netlify.app/api/check`

## The one line a restaurant adds to its website

```html
<script src="https://YOUR-NAME.netlify.app/widget.js" data-venue="ID" async></script>
```

## The one secret

`ANTHROPIC_API_KEY` is set in Netlify (Project configuration, Environment variables). It must never be written in any file here.

## Running the tests (for developers)

```
node scripts/build.mjs
node --test tests/*.test.mjs
node scripts/dev.mjs     # see the site on your own computer at http://localhost:8788
```
