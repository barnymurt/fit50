'use client';

import { useState } from 'react';
import Section from './Section';
import Marquee from './Marquee';
import Modal from './Modal';
import FridgeChecklist from './FridgeChecklist';

interface ResourcesItem {
  category: string;
  title: string;
  description: string;
  href?: string;
  modal?: 'fridge-checklist';
}

const RESOURCES: ResourcesItem[] = [
  {
    category: 'Nutrition',
    title: 'Fridge checklist',
    description: 'A one-page printable of what to keep on hand for the 50 days. Drop your email, download the PDF.',
    modal: 'fridge-checklist',
  },
  {
    category: 'Smoking cessation',
    title: 'Quit resources',
    description: 'Forty tobacco-cessation services across six continents. Phone lines, online programmes, apps, and clinic networks — most are free.',
    href: '/account/quit-list',
  },
  {
    category: 'Drinking less',
    title: 'Non-alcoholic recipes',
    description: 'Fifty zero-proof cocktails, mocktails, and infusions so the "no alcohol" rule never feels like a punishment. Download each as a recipe card.',
    href: '/account/drinks',
  },
  {
    category: 'Meditation',
    title: '10 minutes',
    description: 'Eight meditation apps and sites that do great 10-minute sessions. Four free, four premium with structure.',
    href: '/account/meditation',
  },
];

export default function Resources({ id }: { id?: string }) {
  const [openModal, setOpenModal] = useState<ResourcesItem['modal'] | null>(null);

  return (
    <Section
      id={id}
      className="relative text-ink overflow-hidden pt-40 md:pt-56"
      tone="paper"
    >
      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="Freebies - Curated Links - Tasty Drinks"
          separator="✦"
          speed={200}
          textClassName="text-ink/10"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display text-display-1 text-ink mb-6 leading-[0.95]">
            On the house
          </h2>
          <p className="font-display text-h2 text-ink/80 max-w-2xl mx-auto leading-tight">
            Four resources that make the hardest rules easier. Free, no challenge required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/15">
          {RESOURCES.map((item, i) => {
            const cardClass = `p-6 md:p-8 group hover:bg-cream/40 transition-colors block text-left w-full ${
              i % 2 === 0 ? 'border-r border-ink/15' : ''
            } ${i < RESOURCES.length - 2 ? 'border-b border-ink/15' : ''}`;

            const inner = (
              <>
                <p className="font-body text-caption uppercase text-ink/50 mb-2">
                  {item.category}
                </p>
                <h3 className="font-display text-h3 text-ink mb-2 flex items-center gap-2">
                  {item.title}
                  <span className="text-ink/30 group-hover:text-coral group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </h3>
                <p className="font-body text-sm text-ink/70">
                  {item.description}
                </p>
              </>
            );

            if (item.modal) {
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setOpenModal(item.modal ?? null)}
                  className={cardClass}
                >
                  {inner}
                </button>
              );
            }

            return (
              <a
                key={item.title}
                href={item.href}
                className={cardClass}
              >
                {inner}
              </a>
            );
          })}
        </div>

        <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-12 text-center">
          Feeling baller? Get streak protection, a detailed macro food tracker, the multi-purpose timer, an editable project board and a water tracker.
        </p>
      </div>

      <Modal
        open={openModal === 'fridge-checklist'}
        onClose={() => setOpenModal(null)}
        title="Fridge checklist"
        ariaLabel="On the house"
      >
        <FridgeChecklist onSubmitted={() => {}} compact />
      </Modal>
    </Section>
  );
}