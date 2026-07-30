# Supabase Auth Setup

The magic-link sign-in flow needs three things configured in the Supabase dashboard. If any is wrong, the link either doesn't send, redirects to the wrong place, or shows "redirect URL not allowed".

## The three required settings

### 1. Site URL (Authentication → URL Configuration → Site URL)

This is the **default** redirect URL when the `redirect_to` parameter in the magic link isn't allowed.

```
https://fit50challenge.io
```

**If this is wrong**: clicking the magic link redirects to whatever's here instead of your app.

### 2. Redirect URLs (Authentication → URL Configuration → Redirect URLs)

Wildcard list of allowed redirect destinations. The magic link's `redirect_to` parameter must match one of these.

Add these:
```
http://localhost:3000/**
https://*.vercel.app/**
https://fit50challenge.io/**
https://www.fit50challenge.io/**
```

The `**` wildcard matches any path under that origin. The `*.vercel.app` pattern covers all preview deployments even when the subdomain changes.

**If this list is wrong**: Supabase rejects the magic link click with "redirect URL not allowed" and falls back to the Site URL (which is usually `localhost:3000`).

### 3. Email Templates (Authentication → Email Templates → Magic Link)

Customise the subject and body so emails come from "FIT50" not "Supabase".

| Field | Value |
|---|---|
| Subject | `Your FIT50 sign-in link` |
| From name | `FIT50` |

The body should look branded (see `EMAIL_TEMPLATES.md` for the full HTML).

## How to check your current settings

1. Go to https://supabase.com/dashboard/project/djblhxwdsazksgubhlrn/auth/url-configuration
2. Confirm Site URL is `https://fit50challenge.io` (not `http://localhost:3000`)
3. Confirm Redirect URLs includes `https://fit50challenge.io/**`

If Site URL is wrong, that's almost certainly the bug.

## Common error messages

| Error | Cause | Fix |
|---|---|---|
| `redirect URL not allowed` | `emailRedirectTo` URL not in Redirect URLs list | Add the URL to Redirect URLs |
| Magic link redirects to `localhost:3000` | Supabase Site URL is wrong, or `redirect_to` was rejected and Supabase fell back to Site URL | Update Site URL + Redirect URLs |
| Email never arrives | Supabase email rate limit, or email in spam, or SMTP not configured | Check Supabase → Logs → Auth, or set up Resend SMTP |
| Link works but session isn't established | Cookie config issue | Check `cookies` config in Supabase client — `@supabase/ssr` handles this automatically with `createBrowserClient` |
| `Invalid API key` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing or wrong | Verify in Vercel env vars |

## Debugging checklist

When magic link sign-in is broken, work through this:

1. **Open browser DevTools → Console**. Look for:
   - `[auth] signInWithMagicLink` log — shows what `redirectTo` was set to
   - `[auth] signInWithMagicLink error` — shows Supabase error + helpful hint

2. **Check Supabase → Logs → Auth logs**. Filter by your email. Shows what Supabase received and what it tried to do.

3. **Check Vercel → Deployments → Functions → /api/creem/webhook logs** (for payment webhook, not auth, but useful pattern).

4. **Verify env vars in Vercel**:
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://djblhxwdsazksgubhlrn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = sb_publishable_...
   NEXT_PUBLIC_SITE_URL           = https://fit50challenge.io (production only)
   ```

5. **Click the magic link in your email and watch the browser URL bar**:
   - If it shows `http://localhost:3000/...` → Supabase Site URL is wrong
   - If it shows `https://fit50challenge.io/?code=...` → Site URL is correct, you're in the app
   - If it shows an error page → check the error message

## Production vs Preview

The `NEXT_PUBLIC_SITE_URL` should be set in Vercel **for Production only**. For Preview deployments, leave it unset — the code falls back to `window.location.origin` which automatically uses the Vercel preview URL.

This means:
- **Production** magic link → `https://fit50challenge.io/account` (correct)
- **Preview** magic link → `https://fit50challenge-git-feature-xxx-username.vercel.app/account` (also correct, matches the origin)

Both should work as long as the matching domain is in Supabase's Redirect URLs list (`fit50challenge.io/**` and `*.vercel.app/**`).
