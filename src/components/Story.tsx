'use client';

import Link from 'next/link';
import Marquee from './Marquee';

export default function Story() {
  return (
    <section
      id="story"
      className="bg-paper text-ink overflow-hidden"
    >
      {/* Marquee band — matches other marquees on the site */}
      <div
        style={{
          backgroundColor: 'var(--color-teal, #4A9B9B)',
          padding: '2.5rem 0',
          marginBottom: '3rem',
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
          padding: '0 2rem 4rem 2rem',
        }}
      >
        <h2 className="font-display font-light text-display-2 text-ink mb-8 leading-[0.95]">
          Blame us.
        </h2>

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
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            color: 'var(--color-coral, #E88B5A)',
            letterSpacing: '-0.01em',
            marginTop: '2rem',
          }}
        >
          — Barny
        </p>

        <div className="text-right">
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
    </section>
  );
}