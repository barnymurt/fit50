import React from 'react';

export type IconName =
  | 'chill-out'
  | 'fuel-right'
  | 'crispy-clarity'
  | 'fresh-lungs'
  | 'open-mind'
  | 'move-body'
  | 'wet-lips'
  | 'step-it-up'
  | 'feed-brain'
  | 'arrow-right';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  // Snowflake
  'chill-out': (
    <>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3.5" y1="7.5" x2="20.5" y2="16.5" />
      <line x1="20.5" y1="7.5" x2="3.5" y2="16.5" />
      <path d="M10 5 L12 3 L14 5" />
      <path d="M10 19 L12 21 L14 19" />
      <path d="M5.5 9.5 L3.5 7.5 L5.5 5.5" />
      <path d="M18.5 9.5 L20.5 7.5 L18.5 5.5" />
      <path d="M5.5 14.5 L3.5 16.5 L5.5 18.5" />
      <path d="M18.5 14.5 L20.5 16.5 L18.5 18.5" />
    </>
  ),

  // Petrol pump
  'fuel-right': (
    <>
      <path d="M4 21 L4 5 Q4 3 6 3 L12 3 Q14 3 14 5 L14 21" />
      <line x1="14" y1="21" x2="4" y2="21" />
      <path d="M14 8 L17 8 L17 13 L20 13" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </>
  ),

  // Beer mug with foam
  'crispy-clarity': (
    <>
      <path d="M3 9 L17 9" />
      <path d="M5 9 L5 20 L14 20 L14 9" />
      <path d="M14 12 L17 12 Q19 12 19 14.5 Q19 17 17 17 L14 17" />
    </>
  ),

  // Pair of lungs
  'fresh-lungs': (
    <>
      <path d="M12 4 L12 10" />
      <path d="M12 10 Q8 10 6 13 Q3 17 4 20 Q5 21 7 21 Q9 21 10 19 L10 12" />
      <path d="M12 10 Q16 10 18 13 Q21 17 20 20 Q19 21 17 21 Q15 21 14 19 L14 12" />
    </>
  ),

  // Brain
  'open-mind': (
    <>
      <path d="M12 4 Q7 4 6 7 Q4 8 4 11 Q3 14 6 15 Q6 18 9 19 Q11 20 12 19" />
      <path d="M12 4 Q17 4 18 7 Q20 8 20 11 Q21 14 18 15 Q18 18 15 19 Q13 20 12 19" />
      <line x1="12" y1="4" x2="12" y2="19" />
    </>
  ),

  // Dumbbell
  'move-body': (
    <>
      <line x1="8" y1="12" x2="16" y2="12" />
      <rect x="3" y="9" width="3" height="6" rx="0.5" />
      <rect x="6" y="10" width="2" height="4" />
      <rect x="16" y="10" width="2" height="4" />
      <rect x="18" y="9" width="3" height="6" rx="0.5" />
    </>
  ),

  // Set of lips
  'wet-lips': (
    <>
      <path d="M3 11 Q5 9 7 10 Q9 8 12 9 Q15 8 17 10 Q19 9 21 11" />
      <path d="M3 11 Q5 12 7 12 Q9 13 12 13 Q15 13 17 12 Q19 12 21 11" />
      <path d="M4 12 Q5 16 12 17.5 Q19 16 20 12" />
    </>
  ),

  // Two footprints
  'step-it-up': (
    <>
      <ellipse cx="7" cy="8" rx="2.5" ry="4" />
      <ellipse cx="17" cy="16" rx="2.5" ry="4" />
    </>
  ),

  // Open book
  'feed-brain': (
    <>
      <path d="M3 6 L3 19 L12 17 L12 5 L4 5 Q3 5 3 6 Z" />
      <path d="M21 6 L21 19 L12 17 L12 5 L20 5 Q21 5 21 6 Z" />
    </>
  ),

  'arrow-right': (
    <>
      <path d="M4 12h16" />
      <path d="M14 6l6 6-6 6" />
    </>
  ),
};

export default function Icon({
  name,
  className = '',
  size = 24,
  strokeWidth = 1.5,
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
