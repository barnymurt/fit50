'use client';

import Section from './Section';
import Heading from './Heading';
import Timer from './Timer';
import { usePremium } from '@/hooks/usePremium';

/**
 * Premium-only multi-purpose timer. Sits as its own section in
 * /account between Feed Your Brain and Workouts so the workout
 * loop is right next to the workout itself (the user can fire
 * the 1-minute "between sets" timer without scrolling through the
 * books list).
 */
export default function WorkoutTimer() {
  const { isPremium } = usePremium();
  if (!isPremium) return null;

  return (
    <Section
      id="timer"
      className="relative pt-12 md:pt-16 pb-section"
      tone="paper"
      contained
    >
      <div className="max-w-5xl mx-auto">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
          The timer
        </p>
        <Heading>30 minutes a day.</Heading>
        <p className="font-body text-base text-ink/70 mt-3 mb-8 max-w-2xl">
          Start the timer, get to work. Use it for the book or the
          project — either way, you walk out of the 50 days with
          something you can hold, open, or point at.
        </p>
        <div className="flex justify-center">
          <Timer
            defaultMinutes={30}
            purposes={[
              {
                key: 'project',
                durationMinutes: 30,
                buttonLabel: 'Project time',
                heading: 'Feed Your Brain.',
                lede: "Read a book or work on a project for 30 minutes. Walk out of the 50 days with something you can hold, open, or point at.",
              },
              {
                key: 'meditate',
                durationMinutes: 10,
                buttonLabel: 'Meditate',
                heading: 'Open Mind.',
                lede: "Sit, breathe, notice for 10 minutes. Start at 5 if 10 feels hard — the minutes get easier faster than you think.",
              },
              {
                key: 'workout',
                durationMinutes: 1,
                buttonLabel: 'Workout loop',
                heading: 'Move Your Body.',
                lede: "One minute of core or cardio between sets — motion creates emotion.",
              },
            ]}
          />
        </div>
      </div>
    </Section>
  );
}