# Status

Last updated: 12 November 2026, by a Claude Code session running on Albie's Mac (not a cloud session).

## Current stage: 1, go live. The live site works and gives real answers. Left to prove: an enquiry reaching Albie's email.

- **Live address: https://lucent-taiyaki-cc7d40.netlify.app** Pull request 2 was merged at 7:05pm on 12 November. `/api/check` there says "All working", a real question got a correct answer, and Netlify has picked up the enquiry form (the live `forms.html` shows Netlify's own changes to it). The "Powered by Netlify" badge is still on top of the chat button on a phone; switching it off needs no deploy.
- This file is ahead of `main`: it is on the branch `next/after-go-live`, with no pull request, so the update costs no credits. Put the next piece of work on that branch and merge them together.

- GitHub repository: https://github.com/albieleedriscoll-ui/Kettle-Assistant (public). `main` has the right folder layout and the key fix (pull request 1, merged 12 November).
- Restaurants live: none (only the demo, `copper-kettle`).
- **Real answers seen for the first time on 12 November, 7pm**, on https://deploy-preview-2--lucent-taiyaki-cc7d40.netlify.app after Albie added his own key to `lucent-taiyaki-cc7d40`. `/api/check` there says "All working". The live address still runs the build from before the key was added, so it stays broken until the next merge.
- Asked on that preview, each as a fresh conversation, all behaving as the plan expects:
  - Last table on Saturday: 9:15pm, with the booking button.
  - Gluten-free: general information, no promise, phone number, and an urgent form for the team.
  - 12 people on 12 December: team confirms groups of 9 or more, with the group booking form.
  - Parking: no car park, pay-and-display nearby, free after 6pm.
  - "Book me a table for 2 tonight": says it can't make bookings, with the booking button.
  - A nut allergy question: the fixed allergy reply and the urgent form.
  - "So my table is booked for 7pm then?": says it can't see or confirm bookings and passes it to the team.
- This is seven questions, once each. It is not the Stage 2 stress test.

### Netlify: two projects, neither usable as it stands

| Project | What it is | State on 12 November |
|---|---|---|
| `lucent-taiyaki-cc7d40` | Linked to the GitHub repository. Merging to `main` publishes to it (15 credits each time). | **Public since 12 November** (Albie changed the setting): https://lucent-taiyaki-cc7d40.netlify.app. It runs pull request 1's code. It **has a key saved, but Claude rejects it**: the health check says `invalid x-api-key`. Netlify's badge sits on top of the chat button on a phone. |
| `deluxe-creponne-e1f060` | Albie uploaded the folder to it by hand. Not updated by merging. | Public, and has an API key, but still runs the **old code** with the key bug, so Claude answers "Invalid bearer token". |

- **Decided 12 November: keep `lucent-taiyaki-cc7d40` and fix it**, rather than start again. `deluxe-creponne-e1f060` is to be deleted once the other one works.
- Whatever he chooses: exactly one Netlify project should be linked to the repository, or every merge costs 30 credits.
- Netlify settings a session cannot change, all free, all Albie's to click (menu names from Netlify's help pages, not seen on his screen):
  - Make a project public: Project configuration, General, Visitor access, Project visibility. New projects start private.
  - Remove the "Powered by Netlify" badge, which sits on top of the chat button on a phone: Project configuration, General, Powered by Netlify badge.
  - API key: Project configuration, Environment variables, Add a variable. Name `ANTHROPIC_API_KEY`. It takes effect at the next deploy.
  - Form detection: Forms, Enable form detection. It takes effect at the next deploy.
- Netlify's preview links for pull requests are public as well now, so a session on this Mac can open them. **Previews are free, so test there before merging**: push to the pull request's branch, wait for Netlify to build it, then open `https://deploy-preview-<number>--lucent-taiyaki-cc7d40.netlify.app/api/check`. A change to the key in Netlify only shows up after a new build.

### The key bug (fixed in the code, not yet proved live)

The first version sent the key as `Authorization: Bearer <key>`. A Claude API key goes in an `x-api-key` header. Fixed in pull request 1. With a made-up key, Claude now answers `invalid x-api-key` instead of `Invalid bearer token`, so it is reading the key from the right place. **Proved live on 12 November as far as it can be without a good key**: `lucent-taiyaki-cc7d40` now answers `invalid x-api-key`. So the code is right and the value saved in Netlify is not a key Claude accepts. Likely causes: not the whole key, quotes or other characters around it, a key from another service, or a key that was deleted in the Claude Console. The fix is Albie's: make a new key in the Claude Console and replace the value in Netlify.

**Found later on 12 November: the rejected value is not Albie's key at all.** The health check now describes the saved value without showing it. On the preview of pull request 2 it reports a value 366 characters long that does not start with `sk-ant-`, and that `ANTHROPIC_BASE_URL` is set. That is Netlify's AI Gateway putting in its own token, which only works through Netlify's own address (and would be billed in Netlify credits, so don't switch to it without asking Albie). Albie bought Claude API credits, made a key and says he added it to Netlify, but it is not reaching the site. Most likely: it was saved in the other project (`deluxe-creponne-e1f060`), or under a slightly different name, or only for some deploy contexts or without the Functions scope. Next step: Albie reads back what the Environment variables page of `lucent-taiyaki-cc7d40` shows (names, scopes and contexts, never the value). If his own variable is definitely there and Netlify still overrides it, the fallback is to read the key from a differently named variable such as `KETTLE_CLAUDE_KEY`.

**The key never goes in the chat, in a file, or on this Mac.** Albie offered it on 12 November to help with the build. It was not needed and was not taken. It lives only in Netlify.

### The four Stage 1 checks

| Check | Result on 12 November |
|---|---|
| 1. `/api/check` says "All working" | **Yes, on the live address.** |
| 2. The five demo questions | **Pass on the preview** of the same code (see the list near the top). One repeated on the live address. |
| 3. A test enquiry arrives by email | **Not tested.** Form detection is on. The email notification is not known to be set. |
| 4. `/embed-demo.html` shows the chat button | On `deluxe-creponne-e1f060` the page loads, with Netlify's badge on top of the button on a phone. |

Seen for real on `deluxe-creponne-e1f060` (old code) at phone size: the chat page loads, `POST /api/chat` returns 200 so the same-site check accepts real requests, an ordinary question gets the "having trouble" reply with the phone number and the staff form, and an allergy question gets the fixed reply and the form.

### Work in progress: a cleaner, more professional look

Albie asked on 12 November for the product to look "cleaner and more professional" before any fresh start. That is the pull request from the branch `polish/first-impression`. **Open, not merged.** It changes how things look and nothing about what the assistant is allowed to say: `lib/guard.mjs` and `lib/prompt.mjs` are untouched.

- Chat page: fills the screen on a phone, suggested questions sit in the conversation, round send button, tidier forms, the restaurant's phone number is a tap-to-call link, and a new answer opens at its first line instead of its last.
- Chat button and pop-up: smoother opening, the button turns into a close button, and the page behind stops scrolling while the chat fills a phone screen.
- Stand-in website: looks like a real homepage with the restaurant's name on it. It shows no made-up facts about the restaurant.
- Health check page: a clear status at the top, and for each restaurant the links to its chat page and stand-in page plus the one line for its website.
- New: `node scripts/dev.mjs` runs the whole site on this Mac at http://localhost:8788 with a stand-in for Claude, so a change can be looked at without deploying.

Checked: build clean, 37 tests pass (35 before, plus 2 new ones for the health check page), and every screen looked at in a browser at phone size (375 and 320 wide) and desktop size on the local preview, including sending a test enquiry form (thrown away locally). Also seen on Netlify's own preview of the pull request at phone size: the new stand-in page and health check load correctly. **Not checked:** real Claude answers, a real enquiry email, or a real phone.

Albie said "dashboard". Claude took that to mean the screens an owner and a guest see. If he meant something else, such as a page of numbers for owners, that is Stage 5 in the plan and has not been started.

### Where the files are

- **The folder on Albie's Desktop (`kettle-assistant`) is the working copy.** It is connected to the GitHub repository. Work happens there on a branch and goes to GitHub as a pull request.
- **This Mac** (Intel, macOS 15) has two free tools in a folder called `kettle-tools` in Albie's home folder, installed on 12 November with his agreement. They are not on the PATH, so call them by their full path:
  - Node 22: `~/kettle-tools/node/bin/node`
  - GitHub's command-line tool: `~/kettle-tools/gh/bin/gh`, signed in as `albieleedriscoll-ui`
- A session on this Mac can open public sites in a browser, which the cloud sessions described in `CLAUDE.md` cannot.
- There is an older copy of the project in Downloads called `kettle-assistant 2`. Ignore it.

## Waiting on Albie

1. Set the enquiry form's email notification (Forms, Submission notifications, Add notification), send himself a test enquiry from the chat, and say whether the email arrived.
2. Switch off the badge (Project configuration, General, Powered by Netlify badge), then delete the `deluxe-creponne-e1f060` project. Then Claude rebuilds the preview and checks it. After that: switch on form detection, switch off the Netlify badge, merge pull request 2, set the form's email notification, send a test enquiry, delete `deluxe-creponne-e1f060`.
3. Decide whether the GitHub repository should stay public. Anyone can read it today, including the plan and prices in `docs/PLAN.md`. There are no keys in it.
4. Twilio: open an account, upgrade it to paid, and submit the UK number registration (Phone Numbers, Regulatory Compliance, Bundles: United Kingdom, Mobile, Individual, with ID and proof of address). Not started as of 11 November. Approval time is unknown.
5. The decisions listed in `docs/PLAN.md`.
6. The setup guide (https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH) was written before the two-project mix-up. Read its Netlify steps with the table above in mind.

## The Stage 3 phone test (for when the Twilio number is approved)

No code or hosting is needed. Twilio answers the call itself and its call log shows which number it saw.

1. Buy a UK mobile number with Voice and SMS.
2. At twilio.com/console/twiml-bins create a bin called "call test" containing:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Response>
     <Pause length="1"/>
     <Say>This is the Kettle and Co test line. Your call got through. Goodbye.</Say>
   </Response>
   ```
3. Open the number's settings. Under "A call comes in" choose TwiML Bin, pick "call test", save.
4. Ring the Twilio number from any phone. The message should play. In the Console's call log (Monitor, Logs, Calls) the newest call's "From" should be that phone.
5. On Albie's mobile, dial `*#61#` and write down the number shown (his voicemail), so it can be put back.
6. Dial `**61*<Twilio number starting 07>*11*20#` and press call. This diverts unanswered calls after 20 seconds.
7. Ring Albie's mobile from a second phone and don't answer. The second phone should hear the test message.
8. Read "From" on the newest call in the log. **Pass:** the second phone's number. **Fail:** Albie's own number, or anonymous.
9. Undo with `##61#`. If voicemail stops working, dial `**61*<the number from step 5>#`.

The Console menu names in steps 3 and 4 were written from memory and not checked against Twilio's current pages. If step 6 gives an error, his network may block diverts to ordinary numbers on that plan.

## Session log

Add a dated entry at the top for each session: what changed, what was tested, what is waiting.

- **12 Nov 2026, 7:05pm.** Albie merged pull request 2. Live address checked: health check "All working", one real answer correct, enquiry form detected by Netlify, badge still showing. Not tested: the enquiry email, a real phone.
- **12 Nov 2026, 7pm.** Albie added his own key to the right project. Rebuilt the free preview: health check says "All working", and seven questions asked of the real Claude all behaved correctly. Not tested: the enquiry form and its email, a real phone, the live address (waiting on the merge).
- **12 Nov 2026, evening.** Albie bought API credits, made a key and added it in Netlify. Rebuilt the free preview twice; Claude still rejects the key. Added a line to the health check that describes the saved value without showing it, which showed the value is Netlify's AI Gateway token, not Albie's key. 37 tests pass. Pull request 2 still open, not merged.
- **12 Nov 2026, later.** Albie merged pull request 1 without adding the key. Netlify published it to `lucent-taiyaki-cc7d40`, which turned out to be private, so nothing is visible to guests. He asked to start over after a better-looking build. Built the visual polish on `polish/first-impression` with a local preview script; 37 tests pass; opened as a pull request, not merged. He offered his API key in the chat; it was not needed and not taken.
- **12 Nov 2026.** Session on Albie's Mac. No code changed. Looked at the live site in a browser at phone size and found why Claude isn't answering (the key is sent in the wrong header). Confirmed the Desktop folder has the right layout. Later the same day, with Albie's agreement, installed Node 22 and GitHub's command-line tool in `~/kettle-tools`, then ran the build and the 35 tests on a copy of the Desktop folder: all passed. Albie approved the GitHub sign-in. Found the repository held the project twice (loose files, plus a laid-out copy inside a `kettle-assistant/` folder), connected the Desktop folder to it, and opened the tidy-up pull request from `tidy/restore-folders`. Build and 35 tests passed on that branch. Netlify built the pull request's preview successfully, which showed that the repository is linked to a second Netlify project, `lucent-taiyaki-cc7d40`. Not tested: real Claude answers, the enquiry form and its email, the preview itself (it is private), and whether a merge reaches the live site. Albie then chose to keep `lucent-taiyaki-cc7d40` and to add the key bug fix to pull request 1. Fix made, build and 35 tests pass, and a real request with a made-up key now gets `invalid x-api-key`.
- **11 Nov 2026.** First version built: chat endpoint, safety checks, venue files with deploy-time validation, chat page, website widget, health check. 35 unit tests, a clean `netlify build`, and 12 browser checks in Netlify's local runtime with a stand-in for Claude. Not tested: real Claude answers, real Netlify Forms emails. Found that the earlier "live demo" was a scripted Claude artifact, not a hosted product, so this is the first real one.
