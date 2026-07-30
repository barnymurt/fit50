# Email Setup (Resend SMTP)

Supabase's built-in email sender is generic and not branded. To make the magic-link email come from **FIT50** with proper styling, set up Resend as a custom SMTP provider.

## Why Resend

- **Built for developers** — clean API, great docs, fast setup
- **Free tier**: 3,000 emails/month, 100/day (plenty for magic links)
- **Great deliverability** — proper SPF/DKIM/DMARC setup
- **EU hosting available** (fits the PT/UK audience)
- **Custom HTML templates** — full control over branding

Alternatives: Postmark, SendGrid, AWS SES. Resend is the easiest to set up.

## Setup

### 1. Create a Resend account

1. Go to https://resend.com → **Sign up**
2. Free tier is enough for FIT50

### 2. Add and verify your domain

1. **Domains** → **Add Domain** → type `fit50challenge.io`
2. Resend will show you the DNS records to add at your registrar:

| Type | Host | Value |
|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` |
| TXT | `resend._domainkey` | (long string Resend gives you) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

3. Add these in Namecheap (Advanced DNS) — same place you set up the Vercel records
4. Back in Resend, click **Verify** — usually takes 5–10 minutes

### 3. Configure Supabase to use Resend SMTP

1. In Supabase: **Project Settings** → **Auth** → **SMTP Settings**
2. Toggle **Enable Custom SMTP** ON
3. Fill in:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_...` (your Resend API key) |
| Sender email | `hello@fit50challenge.io` |
| Sender name | `FIT50` |

4. Save

### 4. Customise the email template

Two options:

**Option A — Quick (Supabase dashboard):**
1. **Authentication** → **Email Templates** → **Magic Link**
2. Set Subject: `Your FIT50 sign-in link`
3. Set Body to your branded HTML (use the template below)

**Option B — Full control (use Resend's API directly):**
Use Resend's Broadcasts API for all auth emails. Requires moving auth emails out of Supabase entirely (more work). Stick with Option A for now.

### 5. Test

1. Trigger a magic link from your site
2. Check the email arrives in inbox (not spam)
3. The "From" should show `FIT50 <hello@fit50challenge.io>`
4. The email body should be branded HTML

## Branded email template

Drop this into Supabase's Magic Link template body. Simple, clean, on-brand:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #FAF6EE; font-family: Georgia, serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #FAF6EE; padding: 48px 24px;">
<tr>
<td align="center">

  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background: #FAF6EE; max-width: 560px;">
  
    <!-- Logo / wordmark -->
    <tr>
      <td align="center" style="padding: 0 0 32px 0;">
        <h1 style="margin: 0; font-family: Georgia, serif; font-weight: 400; font-size: 32px; letter-spacing: -0.02em; color: #1A1A1A;">FIT50</h1>
        <p style="margin: 8px 0 0 0; font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #1A1A1A; opacity: 0.6;">50 days. 9 habits. 1 fresh start.</p>
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td style="background: #FEFEFE; border: 1px solid rgba(26, 26, 26, 0.12); padding: 40px;">

        <p style="margin: 0 0 24px 0; font-family: -apple-system, sans-serif; font-size: 16px; line-height: 1.5; color: #1A1A1A;">
          Sign in to <strong style="font-weight: 600;">FIT50</strong>.
        </p>

        <p style="margin: 0 0 32px 0; font-family: -apple-system, sans-serif; font-size: 16px; line-height: 1.5; color: #1A1A1A;">
          Click the button below to access your tracker, streak protection, and the rest of your premium tools. The link expires in 1 hour.
        </p>

        <!-- Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
          <tr>
            <td align="center" style="background: #1A1A1A;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #FEFEFE; text-decoration: none;">Sign in to FIT50</a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 8px 0; font-family: -apple-system, sans-serif; font-size: 13px; line-height: 1.5; color: #1A1A1A; opacity: 0.6;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0; font-family: monospace; font-size: 11px; line-height: 1.4; color: #1A1A1A; opacity: 0.6; word-break: break-all;">
          {{ .ConfirmationURL }}
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding: 32px 0 0 0;">
        <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 11px; line-height: 1.5; color: #1A1A1A; opacity: 0.4;">
          You received this email because you signed in (or tried to) at fit50challenge.io.
          <br>If you didn't request this, you can safely ignore it.
        </p>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>
```

The `{{ .ConfirmationURL }}` is a Supabase template variable — Supabase replaces it with the actual magic link URL.

## After setup

1. Trigger a magic link from the deployed site
2. Check inbox — should arrive in seconds
3. Click the button — should land on `https://fit50challenge.io/account` signed in
4. If you see "redirect URL not allowed", check Supabase → URL Configuration → Redirect URLs

## Env vars

No new env vars needed in Vercel for the email setup itself — the SMTP credentials are configured in Supabase, not Vercel.

## Pricing

Resend free tier: 3,000 emails/month, 100/day. For FIT50's magic link volume (maybe 100–500 sign-ins/month), this is more than enough. If you ever exceed it, the paid plan starts at $20/month for 50k emails.
