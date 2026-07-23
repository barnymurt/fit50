import React from 'react';

type Tone = 'paper' | 'white' | 'cream' | 'ink';

interface SectionProps {
  children: React.ReactNode;
  tone?: Tone;
  id?: string;
  className?: string;
  contained?: boolean;
  as?: 'section' | 'div' | 'footer' | 'header' | 'main' | 'article';
}

const toneStyles: Record<Tone, string> = {
  paper: 'bg-paper text-ink',
  white: 'bg-white text-ink',
  cream: 'bg-cream/40 text-ink',
  ink: 'bg-ink text-paper',
};

export default function Section({
  children,
  tone = 'paper',
  id,
  className = '',
  contained = false,
  as: Tag = 'section',
}: SectionProps) {
  return (
    <Tag id={id} className={`${toneStyles[tone]} ${className}`}>
      {contained ? (
        <div className="max-w-7xl mx-auto px-6 md:px-10">{children}</div>
      ) : (
        children
      )}
    </Tag>
  );
}
