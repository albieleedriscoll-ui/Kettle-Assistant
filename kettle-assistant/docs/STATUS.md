# Status

Last updated: 11 November 2026, by the Claude session that built the first version (in Cowork, not Claude Code).

## Current stage: 1, go live. Waiting on Albie.

- The website assistant is built and tested locally. **It has never run live.** No real Claude answer and no real enquiry email has been seen yet.
- If you are reading this inside the GitHub repository, the upload (Part 1 of the setup guide) is done.
- Not known: whether Albie has a Claude API key, a Netlify site, form detection switched on, or an email notification set.

**First thing to do in a new session:** ask Albie which of the four Stage 1 checks in `docs/PLAN.md` pass, and what his Netlify address is. Write the address here once you know it.

- Netlify address: not known yet
- Restaurants live: none (only the demo, `copper-kettle`)

## Waiting on Albie

1. Finish the setup guide: https://claude.ai/artifact/UpUmYHw848kRPFovfqWHEH
2. Twilio: open an account, upgrade it to paid, and submit the UK number registration (Phone Numbers, Regulatory Compliance, Bundles: United Kingdom, Mobile, Individual, with ID and proof of address). Not started as of 11 November. Approval time is unknown.
3. The decisions listed in `docs/PLAN.md`.

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

- **11 Nov 2026.** First version built: chat endpoint, safety checks, venue files with deploy-time validation, chat page, website widget, health check. 35 unit tests, a clean `netlify build`, and 12 browser checks in Netlify's local runtime with a stand-in for Claude. Not tested: real Claude answers, real Netlify Forms emails. Found that the earlier "live demo" was a scripted Claude artifact, not a hosted product, so this is the first real one.
