# FIT50 email brand voice

Every renderer in `src/email/*.tsx` should match this. If you're adding
a new email type, read this first.

## Who writes this

**Barny.** Founder of FIT50. The emails come from him, not "the FIT50
team" as an anonymous brand voice — though the sign-off reads "and the
FIT50 team" because that's what the existing emails do.

## Tone — three words

**Honest. Useful. Brief.**

- **Honest**: mention the hard parts. Day 14. The slip. The streak that
  breaks. Don't pretend the 50 days are a straight line. Pretending
  loses trust; acknowledging earns it.
- **Useful**: every email should give the reader one thing they can
  *do* in the next five minutes, or one thing they now understand that
  they didn't before. If neither, the email doesn't need to exist.
- **Brief**: respect their inbox. Three short paragraphs beats one long
  one. The signature is one line.

## Structure that works

The existing `welcome.tsx` and `buddy-invite.tsx` use this shape — copy it:

1. **Subject line** — specific, often includes a number or a name.
   Avoid emojis. Avoid "Quick question" / "Just checking in" / "Hey!".
2. **Greeting** — "Hi [first name or email-local-part]."
3. **One-paragraph context** — what's happening on their side, in their
   words. No marketing recap.
4. **"Three things to do / know / remember"** — a short numbered list
   when the email has more than one point.
5. **One CTA button** — coral, uppercase, ends with an arrow.
   "Open my tracker →" / "Use my streak protection →" / "View my certificate →".
6. **One muted line** + the signature in italic. That's it.

## What to avoid

- "We're excited to…" / "We hope this finds you well" / "Just wanted to…"
  — empty openers that signal mass email.
- Buzzwords: "leverage", "unlock", "journey", "deep dive", "transformative".
  If the existing UI uses a word (see `Rules.tsx`, `Nav.tsx`, `PremiumGate.tsx`
  for the vocabulary), use that word. If not, plain English.
- Bullet salads. If you have more than three points, you've lost.
- Multiple CTAs per email. The brand's rule: "one thing per view".
- Emojis in the subject line. In the body, the only emoji we use is
  🍌 — and only for streak protection / banana days. See `Tracker.tsx`
  for the source of truth.

## Visual language

- Coral (`#E88B5A`) is the only action colour. One button per email.
- Background `paper` (`#F6F1E5`), card white, border `#E5E0D0`.
- Display font Georgia for headings; system stack for body. Same as
  the web app — the email should feel like a screenshot of the site
  in spirit.
- No images. Inline emoji (🍌) only. If we ever add a header image,
  use the mark (`public/icons/mark.svg`) — square, ink-on-paper, no
  background.

## Subject lines that fit the brand

Real examples from this codebase and the existing emails:

- "You're in. First day is on you, whenever you say."
- "[Name] just bought you a seat — and you're in"
- "Day one. Don't miss day two."
- "🍌 Banana day. Tomorrow's still yours."
- "Halfway. The hard part is behind you."

What they have in common: specific, low-promise, conversational.

## Send window

All outreach emails fire between **12:30 and 13:30 in the user's
local timezone**. The dispatcher needs each user's timezone
(`profiles.timezone` is the column to add — see
`src/hooks/useTrackerState.ts` for the timezone pattern).

## Frequency cap

Milestone + retention emails may stack on the same day if the user
qualifies for both. We don't artificially space them. Each email is
still scannable on its own.

Transactional emails (welcome, activated, buddy invite, buddy expired,
order confirmations) fire immediately and bypass the cadence rules.

## Unsubscribe

Outreach emails include a footer link: "Don't want these emails? Unsubscribe."
The link hits `/api/email/unsubscribe` which writes to
`email_unsubscribes` and respects it on the next dispatch.

Transactional emails never include the unsubscribe link.

## Versioning

When you edit copy, also bump `subject` if you're changing the framing.
A diff that changes the body but not the subject line is suspicious.