# Kettle and Co website assistant

A chat assistant that independent restaurants put on their websites. It answers guests from the restaurant's own information, sends bookings to the booking page they already use, and passes allergies, complaints and big groups to staff by email. It runs on Netlify and uses the Claude API.

**Before you do anything, read `docs/PLAN.md`.** It says what to build and in what order. The current state is below, pulled in from `docs/STATUS.md`. Update that file at the end of every session.

@docs/STATUS.md

## Who you're working with

Albie Driscoll runs Kettle and Co on his own, in Leeds, about 10 hours a week, on a very small budget. He is not a developer. He has never used a terminal, git or a pull request before this project.

- Write to him in plain UK English. No jargon without a one-line explanation.
- When he has to do something, give numbered steps, one click per step, with the exact words on the button.
- He prefers honest and direct over polished. If something is untested, broken or a bad idea, say so plainly.
- Stop at the end of each stage. Say what now works, what you could not test, and exactly what he does next.

## What you can't do, and he must

You work in this repository only. You cannot see or change anything in Netlify, Twilio, the Claude Console or GitHub's settings, and you cannot create accounts or pay for anything. When a step needs one of those, write Albie the steps and ask him to paste back what he sees (for example the text of the health check page, or the lines after `STOPPED` in a failed Netlify deploy).

Your cloud session cannot reach the live site or outside services by default. Don't write code that depends on calling them from here. Tests use stand-ins.

## Secrets

`ANTHROPIC_API_KEY` (and later the Twilio keys) live only in Netlify's environment variables. Never ask Albie for a key, never print one, never write one into a file, a test or a commit. If he pastes a key into the chat, tell him to delete that key in the provider's console and create a new one.

## Commands

No dependencies yet, so there is nothing to install.

```
node scripts/build.mjs          # checks every restaurant file, writes the generated files
node --test tests/*.test.mjs    # 37 tests, all must pass
node scripts/dev.mjs            # the whole site on this computer, to look at a change before deploying
```

`scripts/dev.mjs` serves http://localhost:8788 with a stand-in for Claude (canned answers, no key) and throws enquiry forms away. It shows how the pages look and behave. It does not show how the real Claude answers.

Run both before every push. Node 22.

## Shipping a change

1. Work on a branch. One pull request per piece of work, not one per file.
2. In the pull request, write for Albie: what changed in plain English, how to check it on Netlify's preview link, and what he does after merging.
3. Albie merges. Merging to `main` makes Netlify publish the live site.

**Every merge to `main` costs 15 of his 300 monthly Netlify credits, and when credits hit zero every restaurant's chat goes offline until next month.** So batch small changes into one pull request. Preview deploys on pull requests are free, so that is where testing happens. Never push to `main` directly.

A deploy that fails the checks in `scripts/build.mjs` costs nothing and leaves the live site unchanged. Keep that property.

## How the code fits together

| Path | What it does |
|---|---|
| `venues/<id>.mjs` | One file per restaurant: name, phone, booking link, colour, greeting, information sheet. The file name is the restaurant's ID. `_template.mjs` is copied for new ones. |
| `scripts/build.mjs` | Runs on every deploy. Validates each venue file with `checkVenue` and exits 1 with plain-English messages if any is wrong. Writes the generated files. |
| `scripts/dev.mjs` | Not deployed. Runs the site on your own computer for looking at changes. |
| `netlify/functions/chat.mjs` | `POST /api/chat`. Same-site check, input limits, safety check 1, Claude, safety check 2. |
| `netlify/functions/check.mjs` | `GET /api/check`. Health check page in plain English, with each restaurant's links and the one line for their website. |
| `lib/prompt.mjs` | The instructions Claude is given, built from the venue file. |
| `lib/guard.mjs` | The safety checks, in ordinary code. |
| `lib/claude.mjs` | The API call. Model `claude-haiku-5-5`, plain `fetch`, no SDK. |
| `lib/venue.mjs` | `checkVenue` and `publicView` (what the browser is allowed to see). |
| `public/index.html` | The chat page, `/?venue=<id>`. With `&embed=1` it fills the widget's pop-up. |
| `public/widget.js` | One script tag on a restaurant's site adds a button and opens the chat page in an iframe. |
| `public/embed-demo.html` | A stand-in restaurant homepage for showing owners the button. |
| `drafts/` | Not deployed. The tested call-test function from the first Twilio experiment, kept as a starting point. |

**Generated on every deploy. Never edit by hand:** `venues/_index.mjs`, `public/forms.html`, `public/venues/*.json`. If you add a field the browser needs, add it to `publicView`.

Design choices that look odd but are deliberate:

- **Enquiries go through Netlify Forms**, posted by the chat page itself to `/` with `form-name=enquiry-<id>`. This needs no email service and no extra key. Albie sets an email notification per form in Netlify's UI. `public/forms.html` exists only so Netlify can detect the forms.
- **The widget is an iframe.** The chat always runs on the Netlify address, so there is no cross-site request to allow and the form post works.
- **No `package.json`.** Albie uploads and edits files through GitHub's website. Keep it dependency-free until a stage needs storage (see the plan).
- **Venue files are JavaScript modules**, not JSON or Markdown, so the bundler includes them without file-path tricks.

## Rules that must not be weakened

One bad allergy answer loses a restaurant, and could hurt someone. These rules come before helpfulness.

1. Messages about allergies, intolerances, reactions or complaints never reach Claude. `screenQuestion` in `lib/guard.mjs` returns a fixed reply and a form.
2. Every answer from Claude passes `screenReply` before the guest sees it. An answer that reads like an allergy promise or a booking, payment or refund confirmation is replaced.
3. Nothing the product says, in chat or by text message, ever confirms a booking, payment, deposit or refund, or says food is safe for an allergy.
4. When unsure, fail towards the fixed reply and the staff form. A false alarm costs nothing. A missed one is the worst outcome.
5. Any change to `lib/guard.mjs` or `lib/prompt.mjs` comes with tests for the case that prompted it. Never delete or loosen a safety test to get a pass.
6. If Claude can't be reached, guests still get the phone number and the staff form.
7. Logs hold counts and routes, never guests' words or contact details. Phone numbers in logs are masked to the last four digits.
8. A venue's information sheet contains only what the restaurant has published or told Albie.
9. The model stays `claude-haiku-5-5` unless Albie has agreed the cost of a change.
10. No new paid service, plan or subscription without asking him first.
