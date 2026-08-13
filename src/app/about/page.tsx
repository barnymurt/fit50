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

        <h1 className="font-display text-display-2 text-ink leading-[1.05] mb-12">
          Blame us.
        </h1>

        <div className="font-display text-base text-ink/85 leading-[1.7] space-y-6">
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
          <p>
            Fifty days, nine disciplines, and something tangible waiting for
            you on the other side.
          </p>
        </div>

        <p className="font-display italic text-base text-coral mt-12">
          — B
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