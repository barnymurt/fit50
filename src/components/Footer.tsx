'use client';

import Image from 'next/image';
import Section from './Section';

const FOOTER_LINKS = [
  { href: '/#story', label: 'Blame us' },
  { href: '/#rules', label: 'Rules' },
  { href: '/#resources', label: 'On the House' },
  { href: '/#workouts', label: 'Workouts' },
  { href: '/#tracker', label: 'Tracker' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#sign-up', label: 'Keep the tools' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/redeem', label: 'Redeem code' },
];

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/fit50challenge/', label: 'Instagram' },
];

export default function Footer() {
  return (
    <Section
      as="footer"
      className="text-paper py-20 md:py-24"
      contained
      style={{ backgroundColor: '#1A1A1A' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-5">
          <Image
            src="/logos/fit50-challenge-logo-mono-white.svg"
            alt="FIT50 challenge"
            width={220}
            height={52}
            className="h-12 w-auto"
          />
          <p className="font-body text-paper/50 mt-4 max-w-sm">
            50 Days · 9 Habits · 1 Finished Thing
          </p>
        </div>
      </div>

      <div className="pt-8 border-t border-paper/15 flex flex-col md:flex-row md:items-center gap-4">
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="mt-10 font-body text-xs text-paper/40">
        © FIT50Challenge. All rights reserved.
      </p>
    </Section>
  );
}
