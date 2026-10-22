# Supabase config — manual steps

This doc tracks the dashboard-side configuration for the
password-reset flow.

> **State as of Oct 2026:** Code is shipped. Email body templates
> are pasted via [TEMPLATES_SETUP.md](./TEMPLATES_SETUP.md). SMTP
> is **not** configured — Supabase's built-in mailer still sends the
> email, so the `From:` line is `noreply@supabase.com` (or whatever
> the region's default is) until you do the SMTP setup below.

What's left for the email to be fully branded end-to-end (i.e. with a
FIT50 **sender**, not just a FIT50 **body**):

## Step 1 — turn on Resend SMTP (whenever you create a Resend account)

In the Supabase dashboard for djblhxwdsazksgubhlrn:

- **Project Settings → Auth → SMTP Settings**
- Toggle **Enable Custom SMTP** ON
- Fill in:

  | Field            | Value |
  |------------------|-------|
  | Host             | `smtp.resend.com` |
  | Port             | `465` |
  | Username         | `resend` |
  | Password         | `re_...` (your Resend API key) |
  | Sender email     | `hello@fit50challenge.io` |
  | Sender name      | `FIT50` |

- Click **Save**.

DNS for `fit50challenge.io` is documented in
[EMAIL_SETUP.md](./EMAIL_SETUP.md) — make sure the three records
(SPF, DKIM, DMARC) are still in place at your registrar, and that
Resend shows the domain as **Verified**.

## Step 2 — paste the branded email templates (already covered)

Done via [TEMPLATES_SETUP.md](./TEMPLATES_SETUP.md). Once you do
Step 1 above, the sender changes from Supabase's default to
`FIT50 <hello@fit50challenge.io>` but the **body** you've already
pasted stays exactly the same.

## Step 3 — confirm the redirect URL allowlist (already done)

**Authentication → URL Configuration → Redirect URLs** must include
the reset destination. The wildcard `https://fit50challenge.io/**`
covers `/account/reset-password` automatically. If you ever tighten
the allowlist, add this entry explicitly:

```
https://fit50challenge.io/account/reset-password
```

## Why this isn't fully automated

DNS records, Resend API keys, and the Resend domain-verification
process are all credentials/domain ownership checks that have to be
done by a human in their respective dashboards. Everything in this
repo runs the moment the SMTP toggle is on and the templates are
pasted in.
