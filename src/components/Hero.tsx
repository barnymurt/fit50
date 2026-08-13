'use client';

import Section from './Section';
import Button from './Button';
import Icon from './Icon';

export default function Hero() {
  const openChecklist = () => {
    window.dispatchEvent(new CustomEvent('open-fridge-checklist'));
  };

  return (
    <Section tone="paper" className="relative pt-32 pb-32 md:pt-40 md:pb-40 overflow-hidden" contained>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[70vh]">
        <div className="md:col-span-7 flex flex-col gap-8">
          <p className="font-body text-caption uppercase text-coral">
            50 Days · 9 Habits · 1 Finished Thing
          </p>

          <h1 className="font-display text-display-1 text-ink">
            The Fit50<br />
            Challenge.
          </h1>

          <p className="font-body text-xl text-ink/70 max-w-xl">
            Nine daily disciplines. Fifty days. More to show for it
            than just crystal clear pee.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              onClick={openChecklist}
              variant="primary"
              tone="light"
            >
              Take the Challenge
            </Button>
            <a
              href="#rules"
              className="inline-flex items-center gap-2 font-body text-caption uppercase text-ink/70 hover:text-coral transition-colors duration-200 group"
            >
              See the rules
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                <Icon name="arrow-right" size={16} />
              </span>
            </a>
          </div>
        </div>

        <div className="md:col-span-5 relative flex items-center justify-center">
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-80"
            style={{ background: 'radial-gradient(circle, #E88B5A 0%, #D8B8D0 100%)' }}
            aria-hidden="true"
          />
          <div className="relative aspect-square w-full max-w-md">
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-display leading-none"
                style={{ fontSize: 'clamp(14rem, 26vw, 22rem)', letterSpacing: '-0.06em', color: '#E88B5A' }}
              >
                50
              </span>
            </div>
            <svg
              className="absolute inset-0 w-full h-full text-ink/15"
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="95" />
              <circle cx="100" cy="100" r="75" strokeDasharray="2 4" />
              <circle cx="100" cy="100" r="55" />
            </svg>
            <p className="absolute -bottom-2 left-0 right-0 text-center font-body text-caption uppercase text-ink/50">
              days · one finished thing
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
