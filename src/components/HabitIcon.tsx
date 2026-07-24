import React from 'react';

export type HabitIconName =
  | 'chill-out'
  | 'fuel-right'
  | 'crispy-clarity'
  | 'fresh-lungs'
  | 'open-mind'
  | 'move-body'
  | 'wet-lips'
  | 'step-it-up'
  | 'feed-brain';

interface HabitIconProps {
  name: HabitIconName;
  size?: number;
  className?: string;
  tone?: 'light' | 'dark';
}

const ICON_MAP: Record<HabitIconName, string> = {
  'chill-out': '/icons/chill-out.png',
  'fuel-right': '/icons/fuel-right.png',
  'crispy-clarity': '/icons/crispy-clarity.png',
  'fresh-lungs': '/icons/fresh-lungs.png',
  'open-mind': '/icons/open-mind.png',
  'move-body': '/icons/move-body.png',
  'wet-lips': '/icons/wet-lips.png',
  'step-it-up': '/icons/step-it-up.png',
  'feed-brain': '/icons/feed-brain.png',
};

export default function HabitIcon({
  name,
  size = 24,
  className = '',
  tone = 'dark',
}: HabitIconProps) {
  const invert = tone === 'light';

  return (
    <img
      src={ICON_MAP[name]}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: invert ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  );
}
