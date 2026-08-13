'use client';

import Link from 'next/link';
import { Caveat } from 'next/font/google';
import Marquee from './Marquee';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-handwritten',
  display: 'swap',
});

export default function Story() {
  return (
    <section
      id="story"
      className={`bg-paper text-ink overflow-hidden ${caveat.variable}`}
    >
      {/* Marquee band — matches other marquees on the site */}
      <div
        style={{
          backgroundColor: 'var(--color-teal, #4A9B9B)',
          padding: '2.5rem 0',
          marginBottom: 'clamp(3rem, 8vw, 5rem)',
        }}
      >
        <Marquee
          text="THE SHORT STORY ✦ FRESH MIND & BODY"
          separator="✦"
          speed={200}
          textClassName="text-paper/35"
        />
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
          <h2 className="font-display font-light text-display-2 text-ink mb-10 leading-[0.95]">
            Blame us.
          </h2>

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
              Thanks to a good mate I finished 75 Hard — like the idiot I am,
              I was training for a backyard ultra at the same time. Great for
              the endurance mindset. I finished slightly slimmer with
              crystal-clear pee and not much else to show for it. The moment
              day 75 rolled past I stuffed my face with Aussie junk food to
              celebrate.
            </p>
            <p>
              By month two it had become a mental slog, and for my ADHD brain
              the creative juices had dried up. It got joyless.
            </p>
            <p
              style={{
                fontWeight: 700,
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
              fontFamily: 'var(--font-handwritten), cursive',
              fontWeight: 400,
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              color: 'var(--color-coral, #E88B5A)',
              marginTop: '2.5rem',
              marginBottom: '2rem',
            }}
          >
            — Barny
          </p>

          <Link
            href="/about"
            className="inline-block text-ink no-underline border-b border-ink pb-[3px] transition-colors duration-200 hover:text-coral hover:border-coral"
            style={{
              fontFamily: 'var(--font-handwritten), cursive',
              fontSize: '1.25rem',
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
    </section>
  );
}