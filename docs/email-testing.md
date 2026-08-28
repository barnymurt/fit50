# Email provider testing

We don't use Litmus or Email on Acid — manual inboxes are good enough
until we have more than ten live templates. This doc is the test plan
for every new outreach email before it ships.

## Test inboxes (pick what you have, otherwise provision)

For every email we ship, render it once and **send to one address on
each of these providers** (real inboxes, not Litmus / Email on Acid
previews — they miss dark-mode behaviour in some clients):

| Provider | Web | iOS app | Android app | Desktop |
|---|---|---|---|---|
| Gmail (personal) | ✓ | ✓ | — | — |
| Outlook.com | ✓ | — | — | — |
| Apple Mail / iCloud | ✓ | ✓ | — | macOS Mail |
| Yahoo Mail | ✓ | — | — | — |
| HEY | ✓ | — | — | — |

Aim for **at least Gmail + Outlook + Apple Mail**. The other two are
nice-to-haves.

If you don't have a personal inbox on each, the cheapest way to cover
them is a $1/year `gmail.com` / `outlook.com` / `yahoo.com` etc.
account. iCloud you need an Apple ID for. HEY requires their $99/year
plan, skip if not paying for it.

## How to render and send a test

1. Pull the branch (e.g. `git checkout emails`).
2. In `package.json`, add a one-off script or run inline:
   ```bash
   RESEND_API_KEY=... tsx scripts/render-email.tsx <renderer> <email>
   ```
   (We don't have this yet — first PR for the wiring adds it. For
   now, copy the renderer's args into a sandbox route or
   `console.log` the output.)

3. Resend has a **staging mode** via `RESEND_API_KEY_TEST_*` keys
   that delivers to a real inbox without leaving Resend. Useful for
   the final pre-merge sanity check.

4. If you don't want to wait for the dispatcher, you can also send
   a one-off via `curl`:
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -d '{
       "from": "FIT50 <hello@fit50challenge.io>",
       "to": ["you@gmail.com"],
       "subject": "Test — Day 50 email",
       "html": "<paste from renderer output>"
     }'
   ```

## What to check

For each inbox, on each client, look for:

### Always

- [ ] **Wordmark renders.** "FIT50" with the "50" in coral.
- [ ] **Background colour is paper (#F6F1E5).** Not flipped to
      black/white in dark mode (the `<meta name="color-scheme"
      content="light only">` should prevent this — verify).
- [ ] **Card is white with a subtle border.**
- [ ] **Ink text is readable.** Georgia heading, system-stack body.
- [ ] **Coral CTA is the only coloured thing in the body.** Coral =
      action. Anything else is a regression.
- [ ] **CTA button is a tappable size on mobile** (~44px tall).
- [ ] **All links work.** Open them in an incognito tab.

### Footer

- [ ] **Outreach footer is present** with the unsubscribe link.
- [ ] **Footer is NOT present on transactional emails** (welcome,
      buddy-invite, activated, resend, expired).
- [ ] **Unsubscribe link hits `/api/email/unsubscribe`** — 404 for
      now (wiring PR fixes that).

### Reply-to

- [ ] **Hit Reply in each client.** The reply-to address should be
      the right one for the email type:
      - `welcome@fit50challenge.io` — onboarding, milestones welcome
      - `buddy@fit50challenge.io` — buddy invite / started / finished /
        resend / expired
      - `hello@fit50challenge.io` — milestones (after day 1), banana
        days, general outreach
- [ ] **From address is `FIT50 <hello@fit50challenge.io>`** — never
      the reply-to.

### Dark mode

- [ ] **Background stays paper-coloured.** Not inverted.
- [ ] **Text stays dark.** Not inverted to white-on-light that
      becomes unreadable.

### Mobile

- [ ] **Card width is ~560px max** — doesn't overflow the viewport
      on a 320px iPhone.
- [ ] **Text is readable** without horizontal scrolling.
- [ ] **CTA button is full-width-ish** — tappable with thumb.

### Outlook desktop (if installed)

- [ ] **Layout is sane.** Outlook is the worst — anything with
  floats / flex / CSS grid breaks. Our tables-only template should
  be safe, but verify.
- [ ] **No "View this email in your browser" link needed.** All
      content is in the email itself.

## Sign-off

Before merging any outreach email:

- [ ] At least one inbox per row above verified.
- [ ] Reply-to verified.
- [ ] Footer present/absent verified.
- [ ] At least one person other than the renderer-author has read the
      copy and signed off on the tone.

## When to upgrade to Litmus / Email on Acid

- After 10 live templates.
- When we add image-based headers (the inline SVG wordmark is safe,
  but if we add a real photo header, providers differ on rendering).
- When we add AMP for Email (separate rendering surface).

The manual plan above catches 90% of issues for free. Litmus covers
the long tail — that's a $80/month decision, not a $0 decision.