# Paste the two branded templates — step-by-step

Total time: about 5 minutes. Nothing else needs to change in the
dashboard for this session.

> **Note (Oct 2026):** SMTP credentials aren't actually configured
> in this project yet — the form fields are blank. We are deliberately
> **not** turning on SMTP this session, so emails will continue to
> arrive from Supabase's default sender. We're only replacing the
> **email body templates** so the message inside looks branded.
> Once you set up Resend (free account + DNS records), the only
> remaining work is to flip on SMTP in
> [EMAIL_SETUP.md](./EMAIL_SETUP.md) Step 1 — the templates will
> already be in place.

This doc reflects the **templates-only** path. If you ever come back
to enable SMTP, follow [EMAIL_SETUP.md](./EMAIL_SETUP.md) first, then
skip Step 1 in this doc.

## Open this in one tab

https://supabase.com/dashboard/project/djblhxwdsazksgubhlrn/auth/templates

You'll see four templates: Confirmation, Email Change, Magic Link,
Reset Password, and Reauthentication.

## 1. Reset Password (the active flow)

This is the one that actually matters — every "Forgot password?" tap
on `/account` sends this template.

Click **Reset Password**.

### Subject

Replace the existing subject with:

```
Your FIT50 password reset
```

### Body

Open the file `supabase/EMAIL_SETUP.md` in this repo. Scroll to the
section called **Reset Password template** (it's the second big HTML
block — after the Magic Link one). The block starts with `<!DOCTYPE html>`
and ends with `</html>`.

Copy the **entire** HTML block (everything between the two outer
triple-backtick fences — the `<!DOCTYPE html>` line through the
closing `</html>`). Don't include the surrounding markdown or the
backticks.

Paste it into the **Message** / body field of the Reset Password
template, replacing whatever is in there.

Click **Save**.

## 2. Magic Link (legacy fallback — keep branded too)

The Magic Link template isn't actively used for sign-in anymore (see
[AUTH_SETUP.md](./AUTH_SETUP.md)), but if it ever fires we want it
to look the same. Same procedure:

Click **Magic Link**.

### Subject

```
Your FIT50 sign-in link
```

### Body

In `supabase/EMAIL_SETUP.md`, scroll to the section called **branded
email template** (the first big HTML block). Copy everything from
`<!DOCTYPE html>` through the closing `</html>`. Paste into the
Magic Link template body.

Click **Save**.

## 3. (Optional) Confirmation template

The Confirmation template fires when "Confirm email" is ON in your
Providers settings — currently OFF per `supabase/AUTH_SETUP.md`, so
this email never actually sends. Skip unless you ever turn
confirmation back on.

## Verify it's actually branded

The fastest sanity check is to **trigger a reset from the live site**
and look at the inbox:

1. In another tab, open https://fit50challenge.io/account (or your
   local dev URL).
2. Make sure you're signed out.
3. Tap **Forgot password?**, enter your email.
4. Wait ~30s.
5. Open the email in Gmail (or wherever), click the kebab →
   **Show original**.
6. Confirm the top of the raw message shows:
   - `From: FIT50 <hello@fit50challenge.io>`
   - `Subject: Your FIT50 password reset`
7. Click the **Set a new password** button in the email body.
8. Confirm it lands on `/account/reset-password` (NOT `/account`)
   and shows the **Set a new password.** form with two password
   fields.
9. Type a new password, submit, expect to land on `/account` signed
   in.
10. Sign out, sign back in with the new password. Should succeed.
11. Sign in with the old password. Should fail with "Email or
    password is incorrect."

If step 6 shows a different `From:` or different subject, the SMTP
sender configuration was changed at some point and you'll want to
re-check it against `supabase/EMAIL_SETUP.md`.
