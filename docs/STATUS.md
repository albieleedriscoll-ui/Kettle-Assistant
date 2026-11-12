# Status

Last updated: 12 November 2026, by a Claude Code session running on Albie's Mac (not a cloud session).

## Current stage: 1, go live. The site is up. Claude's answers are blocked by a bug in the code.

- Netlify address: https://deluxe-creponne-e1f060.netlify.app
- GitHub repository: https://github.com/albieleedriscoll-ui/Kettle-Assistant (public)
- Restaurants live: none (only the demo, `copper-kettle`)
- Albie got it live by uploading the project folder straight to Netlify. Whether the Netlify site is linked to the GitHub repository is **not known**.

### The four Stage 1 checks, as seen on the live site on 12 November

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

### The bug to fix next

`lib/claude.mjs` sends the key as `Authorization: Bearer <key>`. A Claude API key goes in an `x-api-key` header. Bearer is for a different kind of login, which is why Claude answers `Invalid bearer token`. Albie's key is very likely fine, and he should not paste it again or make a new one.

The fix, **not made yet**: change that one header in `lib/claude.mjs`, change the matching check in `tests/chat.test.mjs` (the line that expects `Bearer test-key`), and correct the "Claude API" row in the facts table in `docs/PLAN.md`. It can only be proved by deploying it and reloading `/api/check`.

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

1. One pull request that puts the GitHub repository back into folders. **Open, waiting for Albie to merge** (branch `tidy/restore-folders`). Proposed, not yet agreed: add the bug fix above to the same pull request, so one deploy covers both.
2. Check that Netlify is linked to the repository, and link it if not. **Don't link until that pull request is merged**, or Netlify will try to build the untidy copy.
3. Look at the whole thing as an owner would on a phone and give Albie five ranked improvements. He chooses. Don't build them all.

## Waiting on Albie

1. Say whether the key bug fix should go into the tidy-up pull request, then merge that pull request on GitHub.
2. In Netlify, look at Project configuration, Developer settings, Continuous deployment, Repository, and say whether it shows a "Link repository" button or a repository name. If it is not linked, link it only after the pull request is merged.
3. Still to finish from the setup guide (https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH): form detection and the email notification, unless already done.
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

- **12 Nov 2026.** Session on Albie's Mac. No code changed. Looked at the live site in a browser at phone size and found why Claude isn't answering (the key is sent in the wrong header). Confirmed the Desktop folder has the right layout. Later the same day, with Albie's agreement, installed Node 22 and GitHub's command-line tool in `~/kettle-tools`, then ran the build and the 35 tests on a copy of the Desktop folder: all passed. Albie approved the GitHub sign-in. Found the repository held the project twice (loose files, plus a laid-out copy inside a `kettle-assistant/` folder), connected the Desktop folder to it, and opened the tidy-up pull request from `tidy/restore-folders`. Build and 35 tests passed on that branch. Not tested: real Claude answers, the enquiry form and its email, and whether a merge reaches the live site.
- **11 Nov 2026.** First version built: chat endpoint, safety checks, venue files with deploy-time validation, chat page, website widget, health check. 35 unit tests, a clean `netlify build`, and 12 browser checks in Netlify's local runtime with a stand-in for Claude. Not tested: real Claude answers, real Netlify Forms emails. Found that the earlier "live demo" was a scripted Claude artifact, not a hosted product, so this is the first real one.
