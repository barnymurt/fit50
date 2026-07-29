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
}

const ICON_MAP: Record<HabitIconName, string> = {
  'chill-out': '/icons/chill-out.webp',
  'fuel-right': '/icons/fuel-right.webp',
  'crispy-clarity': '/icons/crispy-clarity.webp',
  'fresh-lungs': '/icons/fresh-lungs.webp',
  'open-mind': '/icons/open-mind.webp',
  'move-body': '/icons/move-body.webp',
  'wet-lips': '/icons/wet-lips.webp',
  'step-it-up': '/icons/step-it-up.webp',
  'feed-brain': '/icons/feed-brain.webp',
};

export default function HabitIcon({
  name,
  size = 24,
  className = '',
}: HabitIconProps) {
  return (
    <img
      src={ICON_MAP[name]}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
      }}
    />
  );
}
