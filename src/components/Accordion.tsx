'use client';

import React, { useState } from 'react';
import Icon from './Icon';

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className = '' }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`divide-y divide-rule ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-6 py-6 text-left group"
              aria-expanded={isOpen}
            >
              <span className="font-display text-h3 text-ink group-hover:text-coral transition-colors duration-200">
                {item.question}
              </span>
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full border border-ink/30 flex items-center justify-center text-ink transition-transform duration-300 ease-smooth ${
                  isOpen ? 'rotate-45' : 'group-hover:border-ink'
                }`}
                aria-hidden="true"
              >
                <Icon name="arrow-right" size={16} strokeWidth={1.5} className="rotate-45" />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-smooth ${
                isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="font-body text-body text-ink/70 max-w-2xl pr-12">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
