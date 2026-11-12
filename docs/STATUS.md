# Status

Last updated: 12 November 2026, by a Claude Code session running on Albie's Mac (not a cloud session).

## Current stage: 1, go live. The fix for Claude's answers is in pull request 1, waiting for Albie to add his key and merge.

- Netlify address in use today: https://deluxe-creponne-e1f060.netlify.app
- GitHub repository: https://github.com/albieleedriscoll-ui/Kettle-Assistant (public)
- Restaurants live: none (only the demo, `copper-kettle`)
- **Netlify has two projects, and only one should be kept.** Found on 12 November:
  - `deluxe-creponne-e1f060`: Albie uploaded the folder to it by hand. It is the live site above and has an API key set. Merging on GitHub does **not** update it.
  - `lucent-taiyaki-cc7d40`: linked to the GitHub repository (it is the one from Albie's first try). It has no live site yet, because its earlier builds failed: https://lucent-taiyaki-cc7d40.netlify.app says "Site not found". It built the preview for pull request 1 successfully. Merging on GitHub publishes to this one, at 15 credits a time. Not known: whether it has an API key or form detection.
  - If both were ever linked to the repository, every merge would cost 30 credits. Keep exactly one linked.
- Netlify's preview links for `lucent-taiyaki-cc7d40` are private ("This site is private. Sign in with an invited Netlify account"). Claude cannot open them. Albie can, in a browser where he is logged in to Netlify.

### The four Stage 1 checks, as seen on the live site (`deluxe-creponne-e1f060`) on 12 November

| Check | Result |
|---|---|
| 1. `/api/check` says "All working" | **No.** "Restaurants loaded" is fine. Claude fails with `Invalid bearer token`. See the bug below. |
| 2. The five demo questions | **Not possible yet.** Nobody has seen a real Claude answer. |
| 3. A test enquiry arrives by email | **Not tested.** No form was submitted. Not known whether form detection or the email notification is set up. |
| 4. `/embed-demo.html` shows the chat button | The page loads with no errors. On a phone-size screen a "Powered by Netlify" badge sits on top of the button. Cause not looked into. |

Also seen for real, in a browser at phone size:

- The chat page loads and `POST /api/chat` returns 200, so the same-site check accepts real requests.
- An ordinary question gets the "having trouble" reply with the phone number and the staff form. Rule 6 holds on the live site.
- "My son has a nut allergy, is the brownie safe?" gets the fixed allergy reply and the form.

### The key bug, and its fix

`lib/claude.mjs` sends the key as `Authorization: Bearer <key>`. A Claude API key goes in an `x-api-key` header. Bearer is for a different kind of login, which is why Claude answers `Invalid bearer token`. Albie's key is very likely fine, and he should not paste it again or make a new one.

The fix is in pull request 1 (12 November): `lib/claude.mjs` now sends the key as `x-api-key`, `tests/chat.test.mjs` checks for that, and the "Claude API" row in the facts table in `docs/PLAN.md` is corrected.

Checked for real: with a made-up key, Claude now answers `invalid x-api-key` instead of `Invalid bearer token`, so it is reading the key from the right place. **Not proved until Albie's real key is used**: add the key to `lucent-taiyaki-cc7d40`, merge, then load `/api/check` on that project's address.

### Where the files are

- **The folder on Albie's Desktop (`kettle-assistant`) is the working copy.** Since 12 November it is connected to the GitHub repository (it has a hidden `.git` folder). Work happens there, on a branch, and goes to GitHub as a pull request.
- **What was wrong on GitHub.** `main` held the project twice: every file loose at the top level (uploaded 11 November), and a complete, correctly laid-out copy one level down inside a `kettle-assistant/` folder (uploaded 12 November). Both copies had the same contents as the Desktop folder. Netlify needs the folders at the top level, so neither copy could build.
- **The fix** is the pull request from the branch `tidy/restore-folders`: it moves the laid-out copy up to the top level and deletes the loose duplicates. No file's contents change except this status file and `.gitignore` (which now also ignores macOS's `.DS_Store` files). The build command in `netlify.toml` was already `node scripts/build.mjs` in every copy, so it needed no change.
- **This Mac** (Intel, macOS 15) has two free tools in a folder called `kettle-tools` in Albie's home folder, installed on 12 November with his agreement. They are not on the PATH, so call them by their full path:
  - Node 22: `~/kettle-tools/node/bin/node`
  - GitHub's command-line tool: `~/kettle-tools/gh/bin/gh`, signed in as `albieleedriscoll-ui`
- A session on this Mac can open the live site and Netlify's preview links in a browser, which the cloud sessions described in `CLAUDE.md` cannot.
- There is an older copy of the project in Downloads called `kettle-assistant 2`, with no `CLAUDE.md` or `docs`. Ignore it.

### Agreed order of work (Albie's, 12 November)

1. One pull request that puts the GitHub repository back into folders. **Open, waiting for Albie to merge** (branch `tidy/restore-folders`). Albie agreed on 12 November to add the key bug fix to it, so one deploy covers both.
2. Check that Netlify is linked to the repository. **Checked: it is, but through `lucent-taiyaki-cc7d40`, not the project Albie has been using.** **Albie chose on 12 November to keep `lucent-taiyaki-cc7d40` as the real site.** Once pull request 1 is merged, the address to use is https://lucent-taiyaki-cc7d40.netlify.app, and `deluxe-creponne-e1f060` should be deleted. Still to prove: that a merge reaches the live site. The proof is `/api/check` on the new address saying "All working" after the merge.
3. Look at the whole thing as an owner would on a phone and give Albie five ranked improvements. He chooses. Don't build them all.

## Waiting on Albie

1. In Netlify, on the project `lucent-taiyaki-cc7d40`, **before merging**: add the environment variable `ANTHROPIC_API_KEY`, and switch on form detection under Forms. Doing both first means the one merge deploy picks them up, with no second 15-credit deploy.
   Then merge pull request 1 (https://github.com/albieleedriscoll-ui/Kettle-Assistant/pull/1) and open https://lucent-taiyaki-cc7d40.netlify.app/api/check.
   After it says "All working": set the email notification for the enquiry form, send a test enquiry, and delete the `deluxe-creponne-e1f060` project.
2. Decide whether the GitHub repository should stay public. Anyone can read it today, including the plan and prices in `docs/PLAN.md`. There are no keys in it.
3. The setup guide (https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH) was written before the two-project mix-up. Where it says the Netlify project, it now means `lucent-taiyaki-cc7d40`.
4. Twilio: open an account, upgrade it to paid, and submit the UK number registration (Phone Numbers, Regulatory Compliance, Bundles: United Kingdom, Mobile, Individual, with ID and proof of address). Not started as of 11 November. Approval time is unknown.
5. The decisions listed in `docs/PLAN.md`.

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

- **12 Nov 2026.** Session on Albie's Mac. No code changed. Looked at the live site in a browser at phone size and found why Claude isn't answering (the key is sent in the wrong header). Confirmed the Desktop folder has the right layout. Later the same day, with Albie's agreement, installed Node 22 and GitHub's command-line tool in `~/kettle-tools`, then ran the build and the 35 tests on a copy of the Desktop folder: all passed. Albie approved the GitHub sign-in. Found the repository held the project twice (loose files, plus a laid-out copy inside a `kettle-assistant/` folder), connected the Desktop folder to it, and opened the tidy-up pull request from `tidy/restore-folders`. Build and 35 tests passed on that branch. Netlify built the pull request's preview successfully, which showed that the repository is linked to a second Netlify project, `lucent-taiyaki-cc7d40`. Not tested: real Claude answers, the enquiry form and its email, the preview itself (it is private), and whether a merge reaches the live site. Albie then chose to keep `lucent-taiyaki-cc7d40` and to add the key bug fix to pull request 1. Fix made, build and 35 tests pass, and a real request with a made-up key now gets `invalid x-api-key`.
- **11 Nov 2026.** First version built: chat endpoint, safety checks, venue files with deploy-time validation, chat page, website widget, health check. 35 unit tests, a clean `netlify build`, and 12 browser checks in Netlify's local runtime with a stand-in for Claude. Not tested: real Claude answers, real Netlify Forms emails. Found that the earlier "live demo" was a scripted Claude artifact, not a hosted product, so this is the first real one.
