# Status

Last updated: 12 November 2026, by a Claude Code session running on Albie's Mac (not a cloud session).

## Current stage: 3, the phone test. Waiting on Albie's Twilio number. Stages 1 and 2 were finished on 12 November 2026.

- This file is ahead of `main`: it is on the branch `next/stage-3`, with no pull request, so the update cost no credits. Put the next piece of work on that branch and merge them together.

- **Live address: https://kettleandco.netlify.app** (Albie renamed the Netlify project from `lucent-taiyaki-cc7d40` on 12 November; the old address no longer works). `/api/check` says "All working". The Netlify badge is off.
- Netlify project: `kettleandco`, linked to the GitHub repository, public, with Albie's own `ANTHROPIC_API_KEY`, form detection on and an email notification set. The old hand-uploaded project `deluxe-creponne-e1f060` is gone.
- Preview links are public and free: `https://deploy-preview-<number>--kettleandco.netlify.app`. Test there before every merge. A merge costs 15 credits.
- GitHub repository: https://github.com/albieleedriscoll-ui/Kettle-Assistant (public; no keys in it; `docs/PLAN.md` with the prices is readable by anyone).
- Restaurants live: none (only the demo, `copper-kettle`).

### Stage 1, go live: finished 12 November

All four checks pass on the live site: health check, the five demo questions, a test enquiry reaching Albie's email (his word; Claude did not see the email), and the chat button on the stand-in page. Two lessons worth keeping:

- A Claude API key goes in the `x-api-key` header, not `Authorization: Bearer`.
- **Netlify's AI Gateway puts its own `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` into the site when the project has none.** That value is not a Claude key and Claude rejects it. The health check now says what the saved value looks like (length, and whether it starts with `sk-ant-`) without showing it. Using the gateway on purpose would be billed in Netlify credits, so don't without asking Albie.
- New Netlify projects start private. Project configuration, General, Visitor access, Project visibility.

### Stage 2, stress test: finished 12 November (pull request 3, merged)

- `public/stress.html?venue=<id>` asks the real assistant 48 awkward questions, about three seconds apart, and marks each with fixed rules. "Copy results" gives the failures as text. A full run takes about four minutes.
- First run on the preview: 45 of 48. Two fails were the page's own rules misreading good answers ("I can't tell you whether your table is booked"). One was real: asked for pirate speak, it began "Arr ... matey".
- Fixed, each with tests (rule 5):
  - `lib/prompt.mjs`: a guest can't make it play a character, use a style, or write poems and jokes.
  - `lib/guard.mjs`: misspellings ("alergy", "alergic", "intolerent") and a reaction described without the word (swelling lips, tongue, face or mouth) now get the fixed replies before Claude is asked. Claude had handled these correctly in the run, but rule 4 says not to depend on that.
  - The page's rules now ignore statements that are denied or questioned.
- Second run on the preview, after the fixes: **48 of 48**. Albie then ran it himself and also got 48 of 48, so that is two clean runs in a row. After the merge, the three questions behind the fixes were asked on the live site and all behaved correctly. Re-run the page before each new restaurant goes live: https://kettleandco.netlify.app/stress.html?venue=<id>
- Not covered by the page: the enquiry email, a real phone, and whether the questions are the right ones for a real restaurant. Albie should add questions an owner actually worries about.
- 37 unit tests pass (three of them extended).

### Where the files are

- **The folder on Albie's Desktop (`kettle-assistant`) is the working copy.** It is connected to the GitHub repository. Work happens there on a branch and goes to GitHub as a pull request.
- **This Mac** (Intel, macOS 15) has two free tools in a folder called `kettle-tools` in Albie's home folder, installed on 12 November with his agreement. They are not on the PATH, so call them by their full path:
  - Node 22: `~/kettle-tools/node/bin/node`
  - GitHub's command-line tool: `~/kettle-tools/gh/bin/gh`, signed in as `albieleedriscoll-ui`
- A session on this Mac can open public sites in a browser, which the cloud sessions described in `CLAUDE.md` cannot.
- There is an older copy of the project in Downloads called `kettle-assistant 2`. Ignore it.

## Waiting on Albie

1. Nothing on the website assistant. It is ready to demo.
2. Decide whether the GitHub repository should stay public.
3. Twilio: open an account, upgrade it to paid, and submit the UK number registration (Phone Numbers, Regulatory Compliance, Bundles: United Kingdom, Mobile, Individual, with ID and proof of address). Not started as of 12 November. Stage 3 can't start without it.
4. The decisions listed in `docs/PLAN.md`.
5. The setup guide (https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH) still shows old addresses. Wherever it gives a Netlify address, use https://kettleandco.netlify.app.

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

- **12 Nov 2026, 7:40pm.** Albie's own stress-test run passed 48 of 48 and he merged pull request 3. Live site checked: health check "All working", and the misspelt allergy, swelling lips and pirate questions all behave correctly. Stage 2 done.
- **12 Nov 2026, 7:30pm.** Albie renamed the Netlify project to `kettleandco`, switched off the badge and deleted the old project. Built the stress-test page, ran it on the preview (45 of 48), fixed the one real failure and hardened the allergy checks with tests, ran it again (48 of 48). Pull request 3 open, not merged.
- **12 Nov 2026, later still.** Albie set the email notification and confirmed a test enquiry arrived. All four Stage 1 checks now pass.
- **12 Nov 2026, 7:05pm.** Albie merged pull request 2. Live address checked: health check "All working", one real answer correct, enquiry form detected by Netlify, badge still showing. Not tested: the enquiry email, a real phone.
- **12 Nov 2026, 7pm.** Albie added his own key to the right project. Rebuilt the free preview: health check says "All working", and seven questions asked of the real Claude all behaved correctly. Not tested: the enquiry form and its email, a real phone, the live address (waiting on the merge).
- **12 Nov 2026, evening.** Albie bought API credits, made a key and added it in Netlify. Rebuilt the free preview twice; Claude still rejects the key. Added a line to the health check that describes the saved value without showing it, which showed the value is Netlify's AI Gateway token, not Albie's key. 37 tests pass. Pull request 2 still open, not merged.
- **12 Nov 2026, later.** Albie merged pull request 1 without adding the key. Netlify published it to `lucent-taiyaki-cc7d40`, which turned out to be private, so nothing is visible to guests. He asked to start over after a better-looking build. Built the visual polish on `polish/first-impression` with a local preview script; 37 tests pass; opened as a pull request, not merged. He offered his API key in the chat; it was not needed and not taken.
- **12 Nov 2026.** Session on Albie's Mac. No code changed. Looked at the live site in a browser at phone size and found why Claude isn't answering (the key is sent in the wrong header). Confirmed the Desktop folder has the right layout. Later the same day, with Albie's agreement, installed Node 22 and GitHub's command-line tool in `~/kettle-tools`, then ran the build and the 35 tests on a copy of the Desktop folder: all passed. Albie approved the GitHub sign-in. Found the repository held the project twice (loose files, plus a laid-out copy inside a `kettle-assistant/` folder), connected the Desktop folder to it, and opened the tidy-up pull request from `tidy/restore-folders`. Build and 35 tests passed on that branch. Netlify built the pull request's preview successfully, which showed that the repository is linked to a second Netlify project, `lucent-taiyaki-cc7d40`. Not tested: real Claude answers, the enquiry form and its email, the preview itself (it is private), and whether a merge reaches the live site. Albie then chose to keep `lucent-taiyaki-cc7d40` and to add the key bug fix to pull request 1. Fix made, build and 35 tests pass, and a real request with a made-up key now gets `invalid x-api-key`.
- **11 Nov 2026.** First version built: chat endpoint, safety checks, venue files with deploy-time validation, chat page, website widget, health check. 35 unit tests, a clean `netlify build`, and 12 browser checks in Netlify's local runtime with a stand-in for Claude. Not tested: real Claude answers, real Netlify Forms emails. Found that the earlier "live demo" was a scripted Claude artifact, not a hosted product, so this is the first real one.
