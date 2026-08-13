import Link from 'next/link';

export default function Story() {
  return (
    <section
      id="story"
      className="bg-paper text-ink"
      style={{ paddingTop: 'clamp(7.5rem, 15vw, 12rem)', paddingBottom: 'clamp(7.5rem, 15vw, 12rem)' }}
    >
      <div className="max-w-[480px] mx-auto px-6 md:px-8">
        <h2 className="font-display text-h1 text-ink mb-8 leading-[1.1]">
          Blame us.
        </h2>

        <div className="font-display text-base text-ink/85 leading-[1.7] space-y-5">
          <p>
            We were on a flight to Australia and one of us had just finished 75
            Hard. The other was three weeks into a no-drink January that kept
            accidentally stretching into February. By the time the wheels
            touched down we&apos;d sketched FIT50 on a sick bag.
          </p>
          <p>
            Nine disciplines, fifty days, no coaching upsell. Just the rules,
            the tools, and a fridge full of things you can actually cook.
          </p>
        </div>

        <p className="font-display italic text-base text-coral mt-10">
          — B
        </p>

        <Link
          href="/about"
          className="inline-block mt-6 font-display text-base text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral transition-colors"
        >
          Read the full story — 75 Hard hijinks on a flight to Australia →
        </Link>
      </div>
    </section>
  );
}