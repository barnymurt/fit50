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
            We were on a flight to Australia and one of us had just finished
            75 Hard. The other was three weeks into a no-drink January that
            kept accidentally stretching into February. Somewhere over the
            Indian Ocean, between the second gin and the third episode of a
            podcast neither of us can now name, the conversation turned, as
            these conversations always do, to the question: could we keep
            this going?
          </p>
          <p>
            75 Hard is brutal in a way that works for a fortnight and
            collapses in week three. We wanted the discipline without the
            punishment. By the time the wheels touched down in Sydney
            we&apos;d sketched nine rules on the back of a sick bag — feed
            the brain, move the body, fuel right, crispy clarity, fresh
            lungs, open mind, step it up, wet the lips, chill out — and
            an honest fifty-day window in which to actually try them.
          </p>
          <p>
            The tools came second. A tracker that didn&apos;t shout at you.
            A kanban for the project you keep promising yourself. A water
            counter because &quot;drink more water&quot; stops working as
            advice the moment you hear it. A macro calculator that didn&apos;t
            want your email, your phone number, and the next twelve months
            of your attention. We built them for us, then we cleaned them
            up for everyone else.
          </p>
          <p>
            Fifty days, nine disciplines, yours forever. The whole toolkit is
            a one-time €5.99 — the price of a caneca in Lisbon — and we
            use the money to keep the lights on and the servers paid for.
            No subscription, no coaching tier, no upsell. Blame us if we
            ever add one.
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