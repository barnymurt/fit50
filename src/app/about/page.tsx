import Link from 'next/link';
import { Caveat } from 'next/font/google';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-handwritten',
  display: 'swap',
});

export const metadata = {
  title: 'About — FIT50',
  description:
    'How a sketch on a sick bag became nine disciplines, fifty days, and one of the most honest challenge apps on the internet.',
};

export default function AboutPage() {
  return (
    <main className={`bg-paper text-ink ${caveat.variable}`}>
      <article
        className="mx-auto"
        style={{
          maxWidth: '640px',
          paddingTop: 'clamp(6rem, 12vw, 9rem)',
          paddingBottom: 'clamp(6rem, 12vw, 9rem)',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <p className="font-body text-caption uppercase text-coral mb-6">
          The story
        </p>

        <h1 className="font-display font-light text-display-2 text-ink leading-[1.05] mb-12">
          Blame us.
        </h1>

        <div
          className="space-y-6"
          style={{
            fontFamily: 'var(--font-handwritten), cursive',
            fontSize: '1.5rem',
            lineHeight: '1.55',
            color: 'var(--ink-soft, #4C4568)',
          }}
        >
          <p>
            Thanks to a good mate I finished 75 Hard — like the idiot I am, I
            was training for a backyard ultra at the same time. Great for the
            endurance mindset. I finished slightly slimmer with crystal-clear
            pee and not much else to show for it. The moment day 75 rolled
            past I stuffed my face with Aussie junk food to celebrate.
          </p>
          <p>
            By month two it had become a mental slog, and for my ADHD brain the
            creative juices had dried up. It got joyless.
          </p>
          <p>
            Six months later my mate and I wanted a fresh challenge — one that
            pushed the body and fed the brain, gave us something to build, and
            made the hard days feel like progress instead of just enduring. So
            we made this.
          </p>
          <p
            style={{
              fontWeight: 700,
              color: 'var(--color-ink, #1A1A1A)',
            }}
          >
            Fifty days, nine disciplines, and something tangible waiting for
            you on the other side.
          </p>
        </div>

        <p
          className="leading-none"
          style={{
            fontFamily: 'var(--font-handwritten), cursive',
            fontWeight: 400,
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            color: 'var(--color-coral, #E88B5A)',
            marginTop: '3rem',
          }}
        >
          — Barny
        </p>

        <div className="mt-16 pt-8 border-t border-ink/15">
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