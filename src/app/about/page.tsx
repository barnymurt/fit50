import Link from 'next/link';

export const metadata = {
  title: 'About — FIT50',
  description:
    'How a sketch on a sick bag became nine disciplines, fifty days, and one of the most honest challenge apps on the internet.',
};

export default function AboutPage() {
  return (
    <main className="bg-paper text-ink">
      <article
        className="mx-auto"
        style={{
          maxWidth: '1200px',
          paddingTop: 'clamp(5rem, 10vw, 7rem)',
          paddingBottom: 'clamp(5rem, 10vw, 7rem)',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <p className="font-body text-caption uppercase text-coral mb-6">
          The story
        </p>

        <h1 className="font-display font-light text-display-2 text-ink leading-[1.05] mb-8">
          Blame us.
        </h1>

        <div
          className="space-y-4"
          style={{
            fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
            fontSize: '1.375rem',
            lineHeight: '1.5',
            color: 'var(--ink-soft, #4C4568)',
          }}
        >
          <p>
            Thanks to a good mate, I started and finished 75 Hard — like the
            idiot I am, I was training for a backyard ultra at the same time,
            more on that later. Ultimately I finished slightly slimmer with
            crystal-clear pee but not much else to show for it. The moment
            day 75 rolled past I stuffed my face with Aussie junk food to
            celebrate.
          </p>
          <p>
            Basically by month two it had become a pure mental slog, and for
            my ADHD brain the creative juices had dried up. The journey
            became joyless.
          </p>
          <p>
            Six months later my mate and I wanted a fresh challenge — one
            that pushed the body and fed the mind, gave us something to
            build, and made the hard days feel like progress instead of
            just enduring.
          </p>
          <p
            style={{
              fontWeight: 500,
              color: 'var(--color-ink, #1A1A1A)',
            }}
          >
            So we made this. Fifty days, nine disciplines, and something
            tangible waiting for you on the other side.
          </p>
        </div>

        <p
          className="leading-none text-right"
          style={{
            fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            color: 'var(--color-coral, #E88B5A)',
            letterSpacing: '-0.01em',
            marginTop: '2rem',
          }}
        >
          — Barny
        </p>

        <div className="mt-12 pt-8 border-t border-ink/15 text-right">
          <Link
            href="/#rules"
            className="font-body text-caption uppercase text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral transition-colors"
          >
            ← Back to the nine rules
          </Link>
        </div>
      </article>
    </main>
  );
}