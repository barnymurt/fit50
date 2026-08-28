// Shared helpers for the email renderers in `src/email/*.tsx`. Kept in
// a separate module so the brand voice + escapeHtml utility aren't
// duplicated per file.
//
// Each renderer returns `{ subject, html, text }`. The HTML uses
// inline styles because that's what survives Gmail / Outlook / iOS
// Mail without a build step or CSS-in-JS pipeline — we keep the
// pattern that's already working in `welcome.tsx` and `buddy-invite.tsx`.
//
// Brand voice lives in `src/email/BRAND_VOICE.md`. Read that before
// editing any of the renderer copy — the tone is the product.

const SIGNATURE = '— Barny (and the FIT50 team)';

// Shared inline style constants. Treat these as the brand's email
// design tokens. If a campaign needs a one-off colour or font size,
// add it here so the next person doesn't reinvent the palette.
export const EMAIL_STYLES = {
  // Body
  background: '#F6F1E5', // paper
  cardBackground: '#FFFFFF',
  border: '#E5E0D0',
  ink: '#1A1A1A',
  inkMuted: '#1A1A1A99',
  // Coral = the one action colour. One CTA per email.
  coral: '#E88B5A',
  coralHover: '#D47849',
  // Display + body fonts match the web stack.
  displayFamily: 'Georgia, serif',
  bodyFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

// Per-type reply-to. The from-address is always
// `FIT50 <hello@fit50challenge.io>` (verified in Resend + DNS);
// routing replies by type lets the help desk filter by category
// without standing up a new from-address per type. Each entry is
// the local-part of `…@fit50challenge.io`. Document the change in
// BRAND_VOICE.md when you add a new type.
export const EMAIL_REPLY_TO = {
  // Account-creation flow + the first nudges after signup. New users
  // bounce here when they hit reply — keep an eye on it.
  welcome: 'welcome',
  // Buddy-pair lifecycle: invite, started, finished, expired, resend.
  // Replies here are about the pair, not the platform in general.
  buddy: 'buddy',
  // Milestones + banana-day retention outreach. Replies are usually
  // a banana-day story or a "thanks for the push" — general inbox.
  outreach: 'hello',
  // Catch-all for anything new that doesn't have a dedicated type.
  // Currently unused but defined so the dispatcher has a fallback.
  general: 'hello',
} as const;

export type EmailType = keyof typeof EMAIL_REPLY_TO;

export function replyToFor(type: EmailType): string {
  return `${EMAIL_REPLY_TO[type]}@fit50challenge.io`;
}

// Most-used HTML skeleton. Renders the FIT50 wordmark in the card
// header, the colour-scheme meta in <head> (so Gmail / iOS Mail
// don't auto-flip the background in dark mode), and an empty footer
// slot the caller fills with `outreachFooter()` for non-transactional
// emails only.
export function emailShell(opts: {
  subject: string;
  preheader?: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  const { subject, preheader, bodyHtml, footerHtml } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escapeHtml(subject)}</title>
    ${preheader ? `<meta name="description" content="${escapeHtml(preheader)}" />` : ''}
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_STYLES.background};font-family:${EMAIL_STYLES.bodyFamily};color:${EMAIL_STYLES.ink};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${EMAIL_STYLES.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${EMAIL_STYLES.cardBackground};border:1px solid ${EMAIL_STYLES.border};">
            <tr>
              <td style="padding:32px;">
                ${wordmarkHtml()}
                ${bodyHtml}
              </td>
            </tr>
          </table>
          ${footerHtml ? `<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:16px 32px 32px 32px;text-align:center;">
                ${footerHtml}
              </td>
            </tr>
          </table>` : ''}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// The FIT50 wordmark. Plain HTML (not SVG) so it survives every
// client including Outlook desktop. The "50" is in coral so the
// number is the focal point — the brand promise is "fifty days",
// not "fit".
export function wordmarkHtml(): string {
  return `<p style="margin:0 0 24px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:28px;font-weight:700;letter-spacing:0.06em;line-height:1;">
  <span style="color:${EMAIL_STYLES.ink};">FIT</span><span style="color:${EMAIL_STYLES.coral};">50</span>
</p>`;
}

// Standard outreach footer. Used on every non-transactional
// email. Transactional emails (welcome, buddy-invite, activated,
// resend, expired) do NOT include a footer.
//
// The unsubscribe link points at /api/email/unsubscribe which is
// wired up in a follow-up PR — for now it 404s, which is fine
// because we're not actually sending outreach emails yet.
export function outreachFooterHtml(opts: {
  unsubscribeUrl: string;
}): string {
  return `<p style="margin:0;font-family:${EMAIL_STYLES.bodyFamily};font-size:12px;line-height:1.5;color:${EMAIL_STYLES.inkMuted};text-align:center;">
  You're getting this because you signed up for FIT50.
  <br />
  <a href="${escapeHtml(opts.unsubscribeUrl)}"
     style="color:${EMAIL_STYLES.inkMuted};text-decoration:underline;">
    Unsubscribe from outreach emails
  </a>
</p>`;
}

// Standard CTA button — coral, uppercase, generous tap target.
export function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="background:${EMAIL_STYLES.coral};">
      <a href="${escapeHtml(href)}"
         style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
        ${escapeHtml(label)} →
      </a>
    </td>
  </tr>
</table>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">${text}</p>`;
}

export function mutedParagraph(text: string): string {
  return `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;color:${EMAIL_STYLES.inkMuted};">${text}</p>`;
}

export function signature(): string {
  return `<p style="margin:24px 0 0 0;font-family:${EMAIL_STYLES.displayFamily};font-size:16px;font-style:italic;color:${EMAIL_STYLES.inkMuted};">${SIGNATURE}</p>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const emailSignature = SIGNATURE;