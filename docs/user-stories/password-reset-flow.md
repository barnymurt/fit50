# Password reset flow

When a user clicks the "Forgot password?" link on `/account`, receives the
branded Resend email, and clicks the link in that email, they land on a
dedicated "Set a new password" page that lets them actually set a new
password — not the current behaviour, where the link silently signs them
back into their existing account on the same password they forgot.

## User story

As an **account-management user** building cohort features, I want
**to receive a branded reset email, click the link, and be prompted to
set a new password that replaces the one I forgot**, so that **I can
sign back in on a password I actually know** — without the current
bug where the reset link just signs me straight back into the
forgotten-password account.

Secondary: as a **branded-experience user**, I want **every email from
FIT50 to look like it comes from the FIT50 team**, so that **I trust
the link and click it** (today the reset email arrives from
`noreply@supabase.com` or the region's default sender, which is a
phishing-shaped first impression).

## Acceptance criteria

### A — Request the reset

- [ ] On `/account` while signed out, the "Forgot password?" link
      toggles the auth card to reset mode (existing behaviour,
      unchanged).
- [ ] Submitting reset mode calls `supabase.auth.resetPasswordForEmail`
      with `redirectTo: ${window.location.origin}/account/reset-password`
      (currently `/account` — that's the bug).
- [ ] On success, the existing "Check your email ✓" confirmation card
      renders. Copy is updated to reference the new destination URL.

### B — Arrive from the email link

- [ ] The user clicks the link in the email and lands on
      `/account/reset-password`.
- [ ] Supabase's `detectSessionInUrl` creates a short-lived recovery
      session; `useAuth()` reports a non-null `user` and a
      `session.user.recovery_session === true` (or equivalent
      `email_action_type === 'recovery'` check).
- [ ] The page renders the "Set a new password" form with: a password
      input (min 8 chars, with show/hide toggle matching the existing
      `/account` sign-in form), a confirm-password input, and a
      "Update password" coral primary button.
- [ ] If `user` is null on first render (the URL was opened in a
      different browser, the link expired, or someone navigated here
      cold), the page renders an "Expired or missing link" state with
      a "Send me a new link" button that re-fires A above using the
      email the user types.
- [ ] No other `/account` content (cohort section, tracker, account
      nav) renders on this page. It is a single-purpose screen.

### C — Submit the new password

- [ ] "Update password" calls `supabase.auth.updateUser({ password })`
      with the validated new password. On success, the session is
      refreshed; `useAuth()` keeps the user signed in.
- [ ] The button shows a loading state ("Updating…") and is disabled
      while the request is in flight.
- [ ] On success: a green confirmation card renders ("Password updated
      ✓") with a "Continue to account →" link to `/account`.
- [ ] On error: an inline error renders below the button with the
      Supabase message plus the existing hint pattern. The form stays
      populated so the user can retry.

### D — Branded template (body)

- [ ] **Authentication → Email Templates → Reset Password** has its
      Subject set to `Your FIT50 password reset` and its Body set to
      the branded HTML template (added in this build, modelled on the
      existing Magic Link template in `EMAIL_SETUP.md`).
- [ ] **Authentication → Email Templates → Magic Link** still has its
      branded template body (legacy path; not in active use but
      should look the same if it ever fires).
- [ ] The "Did you request this?" footer line is present so a
      third-party recipient knows they can ignore the email.

### D-branded-sender — Branded From line (deferred)

- [ ] Supabase **Project Settings → Auth → SMTP Settings** has "Enable
      Custom SMTP" ON, pointing at `smtp.resend.com:465` with
      `hello@fit50challenge.io` as Sender email and `FIT50` as Sender
      name (per `supabase/EMAIL_SETUP.md`).
- [ ] Triggering a reset from `/account` produces an email whose
      `From:` line is `FIT50 <hello@fit50challenge.io>` (verify in
      Gmail's "Show original").

> **Known gap (Oct 2026):** This criterion is *deferred*, not done.
> SMTP creds are still empty in the Supabase dashboard. The branded
> **body** ships; the branded **From** waits for a Resend account +
> DNS records. The checklist for when that happens is in
> `supabase/RESET_PASSWORD_SETUP.md` and `supabase/TEMPLATES_SETUP.md`.
>
> **This is a config-only item**, not a code change. When SMTP is
> finally set up, paste the Resend creds into the Supabase SMTP
> settings (per `EMAIL_SETUP.md` Step 1) and these checkboxes tick
> themselves — no code, no migrations, no rebuild.

### E — Link validity

- [ ] The recovery link expires after 1 hour (Supabase default;
      confirmed in EMAIL_SETUP.md and not changed).
- [ ] Visiting `/account/reset-password` after expiry with no session
      still falls through to the "Expired or missing link" state from B.

## UX/UI risks

- **Anonymous vs signed-in** — the page is signed-in-only by the time
  it renders (Supabase has already exchanged the recovery token for a
  session). If the session is missing, we render the expired-link
  fallback rather than the form. The "signed-in but on a reset page"
  state is intentionally odd — the user is signed in without having
  set a password via this device. The copy must say "Set your new
  password" not "Reset your password" to avoid the loop
  "reset… reset… reset…".
- **Free vs premium** — n/a. Password reset is available to every
  account.
- **Mobile vs desktop** — same form layout as the existing `/account`
  sign-in card; one column, ~448px max width. Password input is
  type=password with the existing show/hide toggle.
- **Empty / loading** — `useAuth().loading` gates the form render
  with a neutral "Loading…" state (mirrors the existing
  `src/app/account/page.tsx:153` pattern). `supabase.auth.updateUser`
  in flight shows "Updating…" button state.
- **Error states** —
  - `AuthSessionMissingError` / no user → expired-link fallback.
  - Password < 8 chars → inline client validation, button disabled.
  - Passwords don't match → inline client validation.
  - `updateUser` server error → inline below button with hint;
    form stays populated.
- **Edge of the data model** —
  - User clicks the reset link on a different device than the one
    they typed the email on. The recovery session only exists in the
    clicking browser. That's fine — they set the password here, sign
    in on the other device with the new password.
  - User clicks the reset link while already signed in. Supabase
    will sign the recovery session in *over* the existing session in
    the same browser; this is expected and harmless. On the other
    device they're still signed in on the old password until they
    sign out and back in.
  - User opens the reset URL directly (no token). The page renders
    the expired-link fallback.
- **Design system fit** —
  - Section tone: `paper` (matches existing `/account`).
  - Container: same `max-w-md mx-auto` and 8px-padded `bg-paper`
    border card as the existing sign-in / sign-up / forgot card.
  - Heading: Fraunces 400 `display-2` "Set a new password."
  - Copy: Inter `caption` for the eyebrow, `body` for prose.
  - Coral is the single action colour: the "Update password" button
    uses `bg-coral hover:bg-coral-deep text-paper`, matching the
    cohort join CTA shape (full radius, uppercase 0.12em tracking).
  - No shadows. No rounded panel. No new colours.
- **Accessibility** —
  - The password input has a visible label and a matching show/hide
    toggle with `aria-label` and `aria-pressed`.
  - The button has `aria-busy="true"` while the update is in flight.
  - The error region has `role="alert"`.
  - Focus is the design-system coral ring (2px outline at 3px
    offset), applied to every interactive element.

## Out of scope

- **Email-template localisation / locale variants.** The reset
  template is English-only, same as the Magic Link template today.
  We can iterate later.
- **Password strength meter.** Supabase's defaults are the source of
  truth; we surface "min 8 chars" client-side and trust the server for
  the rest. A strength meter is a future feature, not a bug fix.
- **Account-deletion / email-change / phone flows.** Out of scope —
  this story is only the reset-password path.
- **Two-factor / TOTP enrolment.** Out of scope. WebAuthn passkey
  already covers the frictionless-second-device use case and is free.
- **API-rate-limiting / abuse protection.** Supabase applies defaults.
  If reset-email abuse becomes a real signal, that's a separate story.
- **Phishing-protection DMARC enforcement on `fit50challenge.io`.**
  DNS records are documented in `EMAIL_SETUP.md` but the enforcement
  policy (`p=quarantine`, `p=reject`) is a separate DNS-policy story.

## Test plan

- **Unit / integration**:
  - `AuthContext.resetPassword` redirect target is now
    `/account/reset-password`, not `/account`. Snapshot the function.
  - The new `/account/reset-password` page calls
    `supabase.auth.updateUser({ password })` with the validated value
    and surfaces server errors inline. Component test with mocked
    supabase client.
- **Manual — happy path**:
  - From `/account` (signed out), tap "Forgot password", enter an
    email, confirm the email arrives within 30 seconds from
    `FIT50 <hello@fit50challenge.io>`.
  - Click the link in a fresh browser. Confirm the "Set a new
    password" form renders. Type a new password, submit, confirm the
    green confirmation card and the redirect to `/account`.
  - Sign out, sign back in with the new password. Confirm it works.
  - Sign back in with the old password. Confirm it fails with the
    standard "Email or password is incorrect" error.
- **Manual — expired link**:
  - Trigger a reset, wait 65 minutes, click the link. Confirm the
    expired-link fallback renders.
  - Trigger a reset, click the link in a different browser. Confirm
    the form still renders (the recovery session lives in whichever
    browser opened the link).
- **Manual — branded sender**:
  - Trigger a reset, open the email in Gmail, click the kebab →
    "Show original". Confirm `From: FIT50 <hello@fit50challenge.io>`
    and `Subject: Your FIT50 password reset`.
  - Trigger a reset, click the link, confirm the page is
    `/account/reset-password` and renders the new form (not the
    existing account dashboard).
- **Visual**:
  - Form matches the existing `/account` sign-in card at 375px and
    1280px — same border, padding, font weights, focus ring.
  - Coral button matches the cohort join CTA shape.
- **Accessibility**:
  - Keyboard-only path: Tab through email → password → confirm →
    button → back link. Focus rings visible at every step.
  - VoiceOver: form fields announce label and current value; the
    show/hide button announces "Show password" / "Hide password".

## Shipped

(filled in after the commit lands)

## Cross-references

- `supabase/AUTH_SETUP.md` — the auth provider / redirect-URL /
  passkey docs that need a one-line update for the new reset
  destination.
- `supabase/EMAIL_SETUP.md` — the SMTP and email-template docs. The
  Reset Password template needs authoring in this build; the SMTP
  itself was never turned on, so this build also turns it on.
- `docs/user-stories/happy-path-free-user.md` — the only existing
  story that mentions the reset flow. Currently it says *"the
  password reset flow uses Resend email"* on line 118, which is the
  intent this story finally implements.
