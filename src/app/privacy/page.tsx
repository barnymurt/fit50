import type { Metadata } from 'next';
import Section from '@/components/Section';

export const metadata: Metadata = {
  title: 'Privacy — FIT50',
  description: 'How FIT50 collects, uses, and protects your data. Applies to EU, UK, US, AU, BR, IN, and APAC users.',
};

export default function PrivacyPage() {
  return (
    <Section className="relative py-section" tone="paper" contained>
      <div className="max-w-2xl mx-auto">
        <p className="font-body text-caption uppercase text-coral mb-3">Privacy</p>
        <h1 className="font-display text-display-2 text-ink mb-8 leading-tight">
          Privacy notice.
        </h1>

        <p className="font-body text-base text-ink/70 mb-8">
          Last updated: today. This is the legal copy. The plain-English summary is at the top
          of each section.
        </p>

        <Section2 title="What we collect">
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>Plain English:</strong> Your email, your display name, your password (stored
            hashed), and the food log, water log, and tracker entries you create. We use cookies
            for the auth session. We use your IP address for country detection so we can show
            prices in the right currency.
          </p>
          <p className="font-body text-base text-ink/80">
            <strong>Legal:</strong> We collect only the data needed to operate the service.
            We do not sell your data. We do not show you ads. We do not share your data with
            third parties except Stripe (payment processing), Supabase (database and auth),
            Resend (transactional email), and Vercel (hosting) — and only the minimum data
            each processor needs.
          </p>
        </Section2>

        <Section2 title="Buddy purchase">
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>Plain English:</strong> When you buy FIT50 for a buddy, we create a
            pending account for them with just their name and email. The account is inactive
            until they activate it (set a password). If they don&apos;t activate within 14 days,
            we delete the account and convert your seat to a gift code.
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>GDPR:</strong> We create the pending account on the basis of legitimate
            interest (enabling the gift purchase). The data subject can object at any time by
            emailing us and we will delete the account immediately.
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>CCPA:</strong> You have the right to know what personal data we collect
            (this page), right to delete it (email us), and right to opt out of any sale
            (we don&apos;t sell data).
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>LGPD (Brazil):</strong> You have the right to confirmation of the existence
            of processing, access to your data, correction of incomplete or inaccurate data,
            and elimination of unnecessary, excessive, or treated data.
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>DPDP (India):</strong> You have the right to access, correction, erasure,
            and grievance redressal. Complaints can be addressed to the Data Protection Board
            of India.
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>PDPA (Singapore/Thailand):</strong> You have the right to access and correct
            your personal data, and to withdraw consent at any time.
          </p>
          <p className="font-body text-base text-ink/80">
            <strong>What your buddy sees:</strong> Only their first name is shown to the
            purchaser. Their email is never revealed to the purchaser (and vice versa).
          </p>
        </Section2>

        <Section2 title="Email">
          <p className="font-body text-base text-ink/80">
            We send transactional email only: account confirmation, password reset, and
            buddy-pair invitations. We do not send marketing email unless you&apos;ve signed
            up for the newsletter. You can unsubscribe from newsletter at any time. Each
            transactional email you receive contains your unique opt-out preferences.
          </p>
        </Section2>

        <Section2 title="Cookies">
          <p className="font-body text-base text-ink/80">
            We use a single first-party session cookie for authentication. No third-party
            trackers, no analytics that track you across sites, no advertising cookies.
          </p>
        </Section2>

        <Section2 title="Data retention">
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>Active accounts:</strong> kept indefinitely while your account is active.
            You can request deletion at any time.
          </p>
          <p className="font-body text-base text-ink/80 mb-3">
            <strong>Pending buddy accounts:</strong> deleted after 14 days if not activated.
          </p>
          <p className="font-body text-base text-ink/80">
            <strong>Tracker entries:</strong> kept while your account is active. Deleted
            when you delete your account.
          </p>
        </Section2>

        <Section2 title="Your rights">
          <p className="font-body text-base text-ink/80 mb-3">
            Request access, correction, or deletion of your data by emailing
            <span className="block font-mono text-coral">support@fit50challenge.io</span>
          </p>
          <p className="font-body text-base text-ink/80">
            We respond to verified requests within 30 days (GDPR/CCPA/LGPD timeline).
          </p>
        </Section2>

        <Section2 title="Data processor">
          <p className="font-body text-base text-ink/80">
            Data is hosted on Supabase (database, auth) and Vercel (hosting). Both run on
            AWS infrastructure. Supabase servers are physically located in the EU
            (Frankfurt) by default; we may add US regions for latency as user geography
            shifts. Stripe processes payment data on their own servers and is PCI-DSS compliant.
          </p>
        </Section2>

        <Section2 title="Contact">
          <p className="font-body text-base text-ink/80">
            Email: <span className="font-mono text-coral">support@fit50challenge.io</span>
          </p>
        </Section2>
      </div>
    </Section>
  );
}

function Section2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink/10 pt-8 mt-12">
      <h2 className="font-display text-h2 text-ink mb-4 leading-tight">{title}</h2>
      {children}
    </section>
  );
}
