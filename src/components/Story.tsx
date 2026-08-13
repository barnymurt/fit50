'use client';

import Link from 'next/link';

export default function Story() {
  return (
    <section
      id="story"
      className="bg-paper text-ink overflow-hidden"
    >
      {/* Marquee band */}
      <div
        className="overflow-hidden select-none"
        style={{
          backgroundColor: 'var(--color-teal, #4A9B9B)',
          padding: '2.5rem 0',
          marginBottom: 'clamp(3rem, 8vw, 5rem)',
        }}
        aria-hidden="true"
      >
        <div
          className="whitespace-nowrap"
          style={{
            display: 'inline-flex',
            animation: 'story-marquee 40s linear infinite',
            width: 'max-content',
          }}
        >
          {[0, 1].map((dup) => (
            <span
              key={dup}
              className="leading-none"
              style={{
                fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
                letterSpacing: '-0.02em',
                color: 'rgba(250, 246, 238, 0.35)',
                paddingRight: '3rem',
              }}
            >
              THE SHORT STORY ✦ FRESH MIND &amp; BODY ✦ THE SHORT STORY ✦
              FRESH MIND &amp; BODY ✦
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="mx-auto"
        style={{
          maxWidth: '1200px',
          padding: '0 2rem clamp(3rem, 8vw, 5rem) clamp(3rem, 8vw, 5rem)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <h2
            className="leading-[0.95] mb-12"
            style={{
              fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
              fontWeight: 300,
              fontSize: 'clamp(4rem, 9vw, 8rem)',
              letterSpacing: '-0.03em',
            }}
          >
            Blame us.
          </h2>

          <div
            className="leading-[1.55]"
            style={{
              fontFamily: 'var(--font-body, Fraunces), Georgia, serif',
              fontSize: '1.375rem',
              color: 'var(--ink-soft, #4C4568)',
            }}
          >
            <p className="mb-6">
              Thanks to a good mate I finished 75 Hard — like the idiot I am,
              I was training for a backyard ultra at the same time. Great for
              the endurance mindset. I finished slightly slimmer with
              crystal-clear pee and not much else to show for it. The moment
              day 75 rolled past I stuffed my face with Aussie junk food to
              celebrate.
            </p>
            <p className="mb-6">
              By month two it had become a mental slog, and for my ADHD brain
              the creative juices had dried up. It got joyless.
            </p>
            <p
              className="mb-10"
              style={{
                fontWeight: 400,
                color: 'var(--color-ink, #1A1A1A)',
              }}
            >
              Six months later my mate and I wanted a fresh challenge — one
              that pushed the body and fed the brain, gave us something to
              build, and made the hard days feel like progress instead of
              just enduring. So we made this.
            </p>
          </div>

          <p
            className="leading-none"
            style={{
              fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              color: 'var(--color-coral, #E88B5A)',
              letterSpacing: '-0.01em',
              marginBottom: '2.5rem',
            }}
          >
            — Barny
          </p>

          <Link
            href="/about"
            className="inline-block text-ink no-underline border-b border-ink pb-[3px] transition-colors duration-200 hover:text-coral hover:border-coral"
            style={{
              fontFamily: 'var(--font-body, Inter), system-ui, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            Read the full story — 75 Hard hijinks on a flight to Australia
            <span
              className="inline-block ml-1.5 transition-transform duration-200"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes story-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-story-marquee] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}