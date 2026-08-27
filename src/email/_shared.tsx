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

// Most-used HTML skeleton. Renderers can use this or build their own
// (welcome + buddy-invite have one CTA, milestones may want two).
export function emailShell(opts: {
  subject: string;
  preheader?: string;
  bodyHtml: string;
}): string {
  const { subject, preheader, bodyHtml } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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