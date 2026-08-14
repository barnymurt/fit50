'use client';

import { useEffect, useState } from 'react';
import Section from './Section';
import Button from './Button';
import Marquee from './Marquee';
import Modal from './Modal';
import EmailGate from './EmailGate';
import { BODYWEIGHT_FOUR_CONFIG } from './emailGates';

interface Exercise {
  slot: string;
  name: string;
  reps: string;
  isFinisher?: boolean;
}

const workoutLines: Record<string, Exercise[]> = {
  A: [
    { slot: '01', name: 'Push-ups', reps: '5 × 10' },
    { slot: '02', name: 'Supermans', reps: '5 × 10' },
    { slot: '03', name: 'Bodyweight Squats', reps: '5 × 10', isFinisher: true },
  ],
  B: [
    { slot: '01', name: 'Wide Push-ups', reps: '5 × 10' },
    { slot: '02', name: 'Reverse Snow Angels', reps: '5 × 10' },
    { slot: '03', name: 'Lunges', reps: '5 × 10', isFinisher: true },
  ],
};

export default function Workouts() {
  const [openGuide, setOpenGuide] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const kind = (e as CustomEvent<{ kind: 'bodyweight-four' }>).detail?.kind;
      if (kind === 'bodyweight-four') setOpenGuide(true);
    };
    const onClose = () => setOpenGuide(false);
    window.addEventListener('open-active-modal', onOpen);
    window.addEventListener('close-active-modal', onClose);
    return () => {
      window.removeEventListener('open-active-modal', onOpen);
      window.removeEventListener('close-active-modal', onClose);
    };
  }, []);

  const openGuideModal = () => {
    window.dispatchEvent(
      new CustomEvent('open-active-modal', { detail: { kind: 'bodyweight-four' } })
    );
  };

  return (
    <Section
      id="workouts"
      tone="ink"
      className="relative bg-ink text-paper overflow-hidden pt-40 md:pt-56"
    >
      <h2 className="sr-only">The Workouts</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="THE WORKOUTS · TRAIN · MOVE · REPEAT"
          separator="✦"
          speed={200}
          textClassName="text-coral/55"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-20">
          <div className="md:col-span-8">
            <p className="font-display text-3xl md:text-5xl text-paper/95 max-w-3xl leading-tight">
              Choose a line a day, Repeat — Just show up.
            </p>
          </div>
        </div>

        <div className="space-y-0 border-t border-paper/15">
          {Object.entries(workoutLines).map(([line, exercises]) => (
            <div
              key={line}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start md:items-center py-10 md:py-12 border-b border-paper/15"
            >
              <div className="md:col-span-3">
                <span
                  className="font-display text-paper leading-none"
                  style={{ fontSize: 'clamp(6rem, 12vw, 10rem)', letterSpacing: '-0.04em' }}
                >
                  {line}
                </span>
              </div>

              <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-6">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className={`pl-4 ${
                      exercise.isFinisher
                        ? 'border-l-2 border-coral'
                        : 'border-l border-paper/15'
                    }`}
                  >
                    <p
                      className={`font-body text-caption uppercase tracking-widest mb-1.5 ${
                        exercise.isFinisher ? 'text-coral' : 'text-paper/40'
                      }`}
                    >
                      {exercise.slot}
                    </p>
                    <h4 className="font-display text-lg text-paper leading-tight mb-1">
                      {exercise.name}
                    </h4>
                    <p
                      className={`font-body text-sm ${
                        exercise.isFinisher ? 'text-coral' : 'text-paper/50'
                      }`}
                    >
                      {exercise.reps}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 md:mt-20 flex flex-col items-center text-center gap-6">
          <p className="font-display text-h2 text-paper max-w-md">
            Day 1 starts when you do.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="#tracker" variant="primary" tone="dark">
              Start tracking
            </Button>
            <button
              type="button"
              onClick={openGuideModal}
              className="inline-flex items-center justify-center gap-2 font-body text-caption uppercase tracking-widest text-paper/70 hover:text-coral border border-paper/30 hover:border-coral px-7 py-3.5 rounded-full transition-colors duration-200"
            >
              Download the Bodyweight Four →
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={openGuide}
        onClose={() => setOpenGuide(false)}
        title="The Bodyweight Four."
        ariaLabel="On the house"
      >
        <EmailGate config={BODYWEIGHT_FOUR_CONFIG} />
      </Modal>
    </Section>
  );
}