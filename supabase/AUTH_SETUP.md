# Supabase Auth Setup

The site now uses **email + password** as the primary auth, with **passkeys (WebAuthn)** as a frictionless free option. Magic links are gone — they were the source of every auth bug we hit.

## Required Supabase settings

### 1. Enable the right providers

**Authentication → Providers**:

- **Email** — already on. Make sure "Confirm email" is **OFF** for the password sign-up (or ON if you want email verification). For now keep it **OFF** so the user is auto-signed-in after creating an account.
- **Passkeys (WebAuthn / FIDO2)** — toggle ON. This is the modern standard. Works on iOS Face ID, Android fingerprint, Windows Hello, hardware keys.

Disable magic link (no longer used).

### 2. Redirect URLs (Authentication → URL Configuration → Redirect URLs)

The password reset email and passkey flows don't need redirect URLs the way magic links did. But still add the safe set:

```
http://localhost:3000/**
https://*.vercel.app/**
https://fit50challenge.io/**
```

### 3. Email Templates (Authentication → Email Templates → Reset Password)

Customise the password reset email so it looks branded. See `EMAIL_SETUP.md` for the full HTML.

## Why this is simpler

| | Magic link (old) | Email + password (new) | Passkey (new) |
|---|---|---|---|
| Needs email deliverability? | Yes (critical) | Only for password reset | No |
| Needs Site URL config? | Yes (breaks if wrong) | No | No |
| Needs Resend SMTP? | Critical | Optional (only for reset email) | No |
| User friction | Switch to email → click | Type email + password | Tap fingerprint/face |
| Mobile UX | OK | OK (with autofill) | Best |

## Common issues

| Error | Cause | Fix |
|---|---|---|
| `Invalid login credentials` | Email or password wrong | Check spelling, or use "Create account" if new |
| `Email not confirmed` | "Confirm email" is ON in Supabase | Turn it OFF in Supabase, or verify the email before sign-in |
| `User already registered` | Trying to sign up with an email that already has an account | Use sign-in mode instead |
| Passkey not offered | Browser doesn't support WebAuthn, or user hasn't set one up | Use email + password instead |
| Passkey fails silently | User cancelled the browser prompt, or the device doesn't have biometrics enabled | Try again or use email + password |

## How to set up a passkey (user flow)

1. Sign in with email + password
2. Go to **/account**
3. Under **Security**, click **Set up passkey**
4. Browser shows the system prompt (Face ID, Touch ID, Windows Hello)
5. Approve → passkey is now stored on this device
6. Next time you visit **/account** or click "Sign in with passkey" on the sign-in form, the browser will offer the passkey automatically

Passkeys are bound to a device. If the user switches phones, they need to set up the passkey again on the new device. Email + password is the fallback.

## Free vs Premium

Both email + password and passkeys are **free**. Premium is for *what you can do once signed in* (cloud sync, streak protection, daily reminders, certificate, photo proof, data export) — not for *how you sign in*.

## Debugging

When sign-in is broken:

1. Open browser **DevTools → Console** and look for any `[auth]` logs or errors
2. Check **Supabase → Logs → Auth logs** filtered by your email
3. Verify env vars in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://djblhxwdsazksgubhlrn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_...
   ```
4. For password reset issues: check spam, verify your Resend SMTP setup (if configured), or just turn off email confirmation in Supabase temporarily to bypass
