'use client';

import { useState } from 'react';
import Section from './Section';
import HabitIcon, { HabitIconName } from './HabitIcon';
import Button from './Button';
import Marquee from './Marquee';

interface Rule {
  id: number;
  icon: HabitIconName;
  title: string;
  description: string;
  tip: string;
}

const rules: Rule[] = [
  {
    id: 1,
    icon: 'feed-brain',
    title: 'Feed Your Brain',
    description: "Read 5 books in 50 days, or ship 30 minutes a day on a project you've been putting off.",
    tip: 'Walk out of the 50 days with something you can hold, open, or point at. Use the kanban to break the project into daily wins.',
  },
  {
    id: 2,
    icon: 'move-body',
    title: 'Move Your Body',
    description: 'Complete one workout from the four lines (A, B, C, D) every day.',
    tip: "Rotate through A → B → C → D and repeat. Something every day, even if it's the short version. Motion creates emotion.",
  },
  {
    id: 3,
    icon: 'fuel-right',
    title: 'Fuel Right',
    description: 'Track your macros every day. Hit your protein, carb, and fat targets.',
    tip: 'The macro tracker gives you over 5,000 foods from an international taste palette and totals against your targets in seconds. Consistency beats perfection.',
  },
  {
    id: 4,
    icon: 'crispy-clarity',
    title: 'Crispy Clarity',
    description: 'No alcohol for 50 days. Full sobriety, no exceptions.',
    tip: 'Fifty zero-proof recipes in the drinks library so "no" never feels like a punishment. The friendships worth keeping don\'t need a round to hold them up.',
  },
  {
    id: 5,
    icon: 'fresh-lungs',
    title: 'Fresh Lungs',
    description: 'No smoking or vaping. Zero nicotine for 50 days.',
    tip: 'Cravings pass in five minutes — grab water, walk, or open your project. The quit list has 40 free cessation services if you want backup.',
  },
  {
    id: 6,
    icon: 'open-mind',
    title: 'Open Mind',
    description: 'Meditate for 10 minutes every day. Sit, breathe, notice.',
    tip: 'Set the multi-purpose timer for 10 minutes and go. Start at 5 if 10 feels hard — the minutes get easier faster than you think.',
  },
  {
    id: 7,
    icon: 'step-it-up',
    title: 'Step It Up',
    description: 'Walk 10,000 steps every day. Your body was made to move.',
    tip: 'Park further, take the stairs, walk while you take calls. Ten thousand adds up faster than it sounds.',
  },
  {
    id: 8,
    icon: 'wet-lips',
    title: 'Wet The Lips',
    description: 'Drink 2.5 litres of water every day. Stay hydrated, stay focused.',
    tip: "Tap to log each glass in the water tracker. Sip through the day — don't chug at the end.",
  },
  {
    id: 9,
    icon: 'chill-out',
    title: 'Chill Out',
    description: 'End every shower cold. Start with 30 seconds on day 1, build toward a fully cold shower by day 50.',
    tip: 'Uncomfortable becomes bracing becomes the best part of your morning.',
  },
];

export default function Rules() {
  const [flippedId, setFlippedId] = useState<number | null>(null);

  return (
    <Section
      id="rules"
      className="relative text-paper overflow-hidden pt-40 md:pt-56"
      style={{ backgroundColor: '#4A9B9B' }}
    >
      <h2 className="sr-only">The Nine Rules</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="NINE HABITS · NON-NEGOTIABLES"
          separator="✦"
          speed={200}
          textClassName="text-paper/40"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-20">
          <div className="md:col-span-7">
            <p className="font-display text-3xl md:text-5xl text-paper/95 max-w-2xl leading-tight">
              All nine, Every day — That&apos;s the challenge.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {rules.map((rule) => {
            const isFlipped = flippedId === rule.id;
            return (
              <div
                key={rule.id}
                className="relative min-h-[200px] md:min-h-[520px]"
                style={{ perspective: '1200px' }}
              >
                <div
                  className={`relative w-full h-full transition-transform duration-700 ease-smooth ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 flex flex-col items-center p-4 md:p-8 text-center border border-paper/20 hover:bg-paper/5 transition-colors cursor-pointer"
                    style={{ backfaceVisibility: 'hidden' }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isFlipped}
                    aria-label={`${rule.title} — flip card to read the rule`}
                    onClick={() => setFlippedId(rule.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setFlippedId(rule.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full mb-2 md:mb-4">
                      <span className="font-display text-base md:text-xl text-coral tabular-nums">
                        {String(rule.id).padStart(2, '0')}
                      </span>
                      <span className="font-body text-caption uppercase text-paper/60">
                        50× reps
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center w-full min-h-0">
                      <HabitIcon
                        name={rule.icon}
                        size={120}
                        className="md:!w-[280px] md:!h-auto"
                      />
                    </div>

                    <h3 className="font-display text-base md:text-h2 text-paper mb-2 md:mb-4 text-center">
                      {rule.title}
                    </h3>

                    <span
                      className="font-body text-caption uppercase text-paper/70 group-hover:text-coral inline-flex items-center gap-2 pointer-events-none"
                      aria-hidden="true"
                    >
                      Show Rule
                      <span className="inline-block">→</span>
                    </span>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center border border-paper/20 bg-paper/5"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <span className="font-display text-base md:text-xl text-coral tabular-nums mb-3 md:mb-6">
                      {String(rule.id).padStart(2, '0')}
                    </span>

                    <p className="font-display text-base md:text-h3 text-paper leading-snug mb-2 md:mb-4 text-center">
                      {rule.title}
                    </p>

                    <p className="font-body text-sm md:text-body text-paper/85 mb-3 md:mb-6 text-center max-w-xs">
                      {rule.description}
                    </p>

                    <p className="hidden md:block font-body text-sm text-paper/70 italic border-l-2 border-coral pl-4 mb-6 text-left max-w-xs">
                      {rule.tip}
                    </p>

                    <button
                      onClick={() => setFlippedId(null)}
                      className="mt-auto font-body text-caption uppercase text-paper/70 hover:text-coral transition-colors duration-200 inline-flex items-center gap-2"
                      aria-expanded={isFlipped}
                    >
                      <span className="inline-block">←</span>
                      Hide Rule
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 md:mt-20 flex flex-col items-center text-center gap-8">
          <p className="font-display text-h2 text-paper max-w-md">
            Ready to commit to all nine?
          </p>
          <Button href="#tracker" variant="primary" tone="light">
            Take the Challenge
          </Button>
        </div>
      </div>
    </Section>
  );
}
