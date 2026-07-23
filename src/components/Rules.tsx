'use client';

import { useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import Icon, { IconName } from './Icon';
import Button from './Button';

interface Rule {
  id: number;
  icon: IconName;
  title: string;
  description: string;
  tip: string;
}

const rules: Rule[] = [
  {
    id: 1,
    icon: 'chill-out',
    title: 'Chill Out',
    description: 'Take a cold shower every day. End your regular shower with 30 seconds of cold water.',
    tip: 'Start with 10 seconds and work your way up. The discomfort is temporary, the benefits are lasting.',
  },
  {
    id: 2,
    icon: 'fuel-right',
    title: 'Fuel Right',
    description: 'Track your macros every day. Hit your protein, carb, and fat targets.',
    tip: 'Use a free app like MyFitnessPal. Consistency matters more than perfection.',
  },
  {
    id: 3,
    icon: 'crispy-clarity',
    title: 'Crispy Clarity',
    description: 'No alcohol for 50 days. Complete sobriety during the challenge.',
    tip: 'Find alternative celebrations. Laughter is better than liquor anyway.',
  },
  {
    id: 4,
    icon: 'fresh-lungs',
    title: 'Fresh Lungs',
    description: 'No smoking or vaping. Zero nicotine during the 50 days.',
    tip: 'Cravings last about five minutes. Drink water, walk, or chew gum when they hit.',
  },
  {
    id: 5,
    icon: 'open-mind',
    title: 'Open Mind',
    description: 'Meditate for 10 minutes every day. Sit in silence and breathe.',
    tip: 'Use an app like Headspace or Calm. Start with just 5 minutes if 10 feels hard.',
  },
  {
    id: 6,
    icon: 'move-body',
    title: 'Move Your Body',
    description: 'Complete one workout from the four lines (A, B, C, D) every day.',
    tip: "Do something every day, even if it's light. Motion creates emotion.",
  },
  {
    id: 7,
    icon: 'wet-lips',
    title: 'Wet The Lips',
    description: 'Drink 2.5 litres of water every day. Stay hydrated, stay focused.',
    tip: "Get a marked bottle. Sip throughout the day, don't chug at the end.",
  },
  {
    id: 8,
    icon: 'keep-walking',
    title: 'Keep Walking',
    description: 'Walk 10,000 steps every day. Your body was made to move.',
    tip: 'Park further away, take the stairs, or walk while you talk on the phone.',
  },
  {
    id: 9,
    icon: 'feed-brain',
    title: 'Feed Your Brain',
    description: 'Read 10 pages every day. Feed your mind with knowledge.',
    tip: 'Keep a book everywhere. Waiting becomes reading time.',
  },
];

export default function Rules() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <Section id="rules" tone="white" className="py-section" contained>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 md:mb-20">
        <div className="md:col-span-5">
          <p className="font-body text-caption uppercase text-ink/50 mb-4">
            The Rules · 01—09
          </p>
          <Heading as="h2" size="display-2">
            Nine<br />
            non&#8209;negotiables.
          </Heading>
        </div>
        <div className="md:col-span-6 md:col-start-7 flex items-end">
          <p className="font-body text-lg text-ink/70 max-w-lg">
            Every day, every one. No substitutions, no skip days, no compromises. That&apos;s the point.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-rule">
        {rules.map((rule) => {
          const isOpen = expandedId === rule.id;
          return (
            <div
              key={rule.id}
              className="border-r border-b border-rule p-6 md:p-8 group hover:bg-paper transition-colors duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="font-display text-2xl text-teal tabular-nums">
                  {String(rule.id).padStart(2, '0')}
                </span>
                <Icon name={rule.icon} className="text-ink" size={24} />
              </div>

              <h3 className="font-display text-h3 text-ink mb-3">
                {rule.title}
              </h3>

              <p className="font-body text-body text-ink/70 mb-4">
                {rule.description}
              </p>

              <button
                onClick={() => setExpandedId(isOpen ? null : rule.id)}
                className="font-body text-caption uppercase text-ink/50 hover:text-coral transition-colors duration-200 inline-flex items-center gap-2"
                aria-expanded={isOpen}
              >
                {isOpen ? 'Hide tip' : 'Show tip'}
                <span
                  className={`inline-block transition-transform duration-300 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                >
                  <Icon name="arrow-right" size={14} />
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-smooth ${
                  isOpen ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="font-body text-sm text-ink/60 italic border-l-2 border-coral pl-4">
                    {rule.tip}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 md:mt-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <p className="font-display text-h2 text-ink max-w-md">
          Ready to commit to all nine?
        </p>
        <Button href="#tracker" variant="primary" tone="light">
          Take the Challenge
        </Button>
      </div>
    </Section>
  );
}
