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
  // Two ice cubes with internal facet lines
  'chill-out': (
    <>
      <rect x="2" y="5" width="9" height="9" rx="0.5" />
      <line x1="2" y1="9.5" x2="11" y2="9.5" />
      <line x1="6.5" y1="5" x2="6.5" y2="14" />
      <rect x="13" y="10" width="9" height="9" rx="0.5" />
      <line x1="13" y1="14.5" x2="22" y2="14.5" />
      <line x1="17.5" y1="10" x2="17.5" y2="19" />
    </>
  ),

  // Petrol pump with display window and nozzle
  'fuel-right': (
    <>
      <rect x="3" y="3" width="10" height="18" rx="0.5" />
      <rect x="5" y="5" width="6" height="4" />
      <path d="M13 7 L17 7 L17 12 L19 12" />
      <rect x="18" y="12" width="2.5" height="4" rx="0.3" />
      <line x1="2" y1="21" x2="21" y2="21" />
      <line x1="5" y1="13" x2="11" y2="13" />
      <line x1="5" y1="16" x2="11" y2="16" />
    </>
  ),

  // Martini glass with cherry on rim and olive on pick inside
  'crispy-clarity': (
    <>
      <line x1="4" y1="4" x2="20" y2="4" />
      <path d="M4 4 L12 13 L20 4" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <path d="M8 20 Q12 19 16 20" />
      <circle cx="18" cy="3" r="1.5" />
      <path d="M19 2 L20.5 0.5" />
      <circle cx="12" cy="8" r="1" />
      <line x1="12" y1="8" x2="14.5" y2="5.5" />
    </>
  ),

  // Pair of lungs in circle with bronchi
  'fresh-lungs': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6 L12 9" />
      <path d="M12 9 Q8 9 6 12 Q4 15 5 18 Q6 20 8 19 L9 19 Q10 18 10 16 L10 11" />
      <path d="M12 9 Q16 9 18 12 Q20 15 19 18 Q18 20 16 19 L15 19 Q14 18 14 16 L14 11" />
      <path d="M8 13 L7 15" />
      <path d="M8 13 L9 15" />
      <path d="M7 15 L6 17" />
      <path d="M9 15 L10 17" />
      <path d="M16 13 L15 15" />
      <path d="M16 13 L17 15" />
      <path d="M15 15 L14 17" />
      <path d="M17 15 L18 17" />
    </>
  ),

  // Brain with cerebral folds
  'open-mind': (
    <>
      <path d="M12 4 Q7 4 6 7 Q3 8 3 12 Q3 15 5 16 Q5 19 8 20 Q10 21 12 20" />
      <path d="M12 4 Q17 4 18 7 Q21 8 21 12 Q21 15 19 16 Q19 19 16 20 Q14 21 12 20" />
      <path d="M12 4 L12 20" />
      <path d="M7 9 Q8 10 7 12" />
      <path d="M9 14 Q10 15 9 17" />
      <path d="M6 14 Q7 15 8 16" />
      <path d="M17 9 Q16 10 17 12" />
      <path d="M15 14 Q14 15 15 17" />
      <path d="M18 14 Q17 15 16 16" />
    </>
  ),

  // Dancing figure with arms raised
  'move-body': (
    <>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M12 5.5 L12 15" />
      <path d="M8 7 L12 9 L16 5" />
      <path d="M12 15 L9 21" />
      <path d="M12 15 L15.5 20" />
    </>
  ),

  // Lips with lipstick applicator
  'wet-lips': (
    <>
      <path d="M6 10 Q8 8 10 9 Q12 7 14 9 Q16 8 18 10" />
      <path d="M6 10 Q6 12 9 13 Q12 14 15 13 Q18 12 18 10" />
      <line x1="3" y1="21" x2="10" y2="14" />
      <path d="M9 13 L11.5 15.5 L10.5 16.5 L8 14 Z" />
    </>
  ),

  // Two footprints with toe dots
  'step-it-up': (
    <>
      <ellipse cx="7" cy="9" rx="2.5" ry="4" />
      <circle cx="5.5" cy="4.5" r="0.7" fill="currentColor" />
      <circle cx="7" cy="3.5" r="0.6" fill="currentColor" />
      <circle cx="8.5" cy="4.5" r="0.6" fill="currentColor" />
      <ellipse cx="17" cy="16" rx="2.5" ry="4" />
      <circle cx="15.5" cy="11.5" r="0.7" fill="currentColor" />
      <circle cx="17" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="18.5" cy="11.5" r="0.6" fill="currentColor" />
    </>
  ),

  // Stack of books
  'feed-brain': (
    <>
      <rect x="2" y="17" width="20" height="4" rx="0.3" />
      <line x1="4" y1="19" x2="5" y2="19" />
      <line x1="4" y1="20" x2="5" y2="20" />
      <path d="M4 11 L4 16 L12 15 L12 10 Z" />
      <path d="M20 11 L20 16 L12 15 L12 10 Z" />
      <line x1="6" y1="13" x2="10" y2="13" />
      <rect x="6" y="5" width="12" height="4" rx="0.3" />
      <line x1="8" y1="7" x2="10" y2="7" />
      <line x1="8" y1="8" x2="10" y2="8" />
      <line x1="11" y1="7" x2="16" y2="7" />
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
