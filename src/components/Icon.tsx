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
  // Ice cubes — three clustered cubes
  'chill-out': (
    <>
      <rect x="2" y="3" width="9" height="9" rx="0.5" />
      <line x1="2" y1="6" x2="11" y2="6" />
      <line x1="5" y1="3" x2="5" y2="12" />
      <rect x="7" y="8" width="9" height="9" rx="0.5" />
      <line x1="7" y1="11" x2="16" y2="11" />
      <line x1="10" y1="8" x2="10" y2="17" />
      <rect x="13" y="13" width="9" height="9" rx="0.5" />
      <line x1="13" y1="16" x2="22" y2="16" />
      <line x1="16" y1="13" x2="16" y2="22" />
    </>
  ),

  // Petrol pump
  'fuel-right': (
    <>
      <rect x="4" y="3" width="10" height="18" rx="0.5" />
      <rect x="6" y="6" width="6" height="3" />
      <line x1="6" y1="13" x2="12" y2="13" />
      <line x1="6" y1="16" x2="12" y2="16" />
      <path d="M14 8 L17 8 L17 14 L20 14" />
      <rect x="19" y="14" width="3" height="3" rx="0.3" />
      <line x1="3" y1="21" x2="22" y2="21" />
    </>
  ),

  // Beer mug
  'crispy-clarity': (
    <>
      <path d="M3 9 Q5 6 7 8 Q9 6 11 8 Q13 6 15 8 Q17 6 19 9 L19 11 L3 11 Z" />
      <path d="M5 11 L5 20 Q5 21 6 21 L14 21 Q15 21 15 20 L15 11" />
      <path d="M15 13 Q19 13 19 16 Q19 19 15 19" />
      <line x1="7" y1="14" x2="7" y2="18" />
      <line x1="10" y1="14" x2="10" y2="18" />
      <line x1="13" y1="14" x2="13" y2="18" />
    </>
  ),

  // Pair of lungs
  'fresh-lungs': (
    <>
      <path d="M12 3 L12 9" />
      <path d="M10 6 L14 6" />
      <path d="M12 9 Q8 9 6 12 Q3 16 4 19 Q5 21 7 21 L9 21 Q11 20 11 17 L11 11" />
      <path d="M12 9 Q16 9 18 12 Q21 16 20 19 Q19 21 17 21 L15 21 Q13 20 13 17 L13 11" />
    </>
  ),

  // Brain with central fissure
  'open-mind': (
    <>
      <path d="M12 4 Q7 4 6 7 Q4 8 4 11 Q3 13 5 14 Q4 17 7 18 Q8 20 11 20 Q12 20 12 19" />
      <path d="M12 4 Q17 4 18 7 Q20 8 20 11 Q21 13 19 14 Q20 17 17 18 Q16 20 13 20 Q12 20 12 19" />
      <line x1="12" y1="4" x2="12" y2="19" />
      <path d="M7 10 Q8 11 7 12" />
      <path d="M9 14 Q10 15 9 16" />
      <path d="M17 10 Q16 11 17 12" />
      <path d="M15 14 Q14 15 15 16" />
    </>
  ),

  // Dumbbell
  'move-body': (
    <>
      <line x1="8" y1="12" x2="16" y2="12" />
      <rect x="2" y="8" width="3" height="8" rx="0.5" />
      <rect x="5" y="9" width="3" height="6" rx="0.3" />
      <rect x="16" y="9" width="3" height="6" rx="0.3" />
      <rect x="19" y="8" width="3" height="8" rx="0.5" />
    </>
  ),

  // Set of lips
  'wet-lips': (
    <>
      <path d="M3 11 Q5 9 7 10 Q9 8 12 9 Q15 8 17 10 Q19 9 21 11" />
      <path d="M3 11 Q5 12 7 12 Q9 13 12 13 Q15 13 17 12 Q19 12 21 11" />
      <path d="M4 12 Q5 16 12 17.5 Q19 16 20 12" />
      <path d="M12 9 L12 13" />
    </>
  ),

  // Two footprints
  'step-it-up': (
    <>
      <ellipse cx="7" cy="7" rx="3" ry="4" />
      <circle cx="5.5" cy="3" r="0.9" fill="currentColor" />
      <circle cx="8" cy="2.5" r="0.7" fill="currentColor" />
      <circle cx="6.5" cy="4.5" r="0.6" fill="currentColor" />
      <ellipse cx="17" cy="17" rx="3" ry="4" />
      <circle cx="15.5" cy="13" r="0.9" fill="currentColor" />
      <circle cx="18" cy="12.5" r="0.7" fill="currentColor" />
      <circle cx="16.5" cy="14.5" r="0.6" fill="currentColor" />
    </>
  ),

  // Open book
  'feed-brain': (
    <>
      <path d="M3 6 Q3 5 4 5 L11 6 L11 19 L4 18 Q3 18 3 17 Z" />
      <path d="M21 6 Q21 5 20 5 L13 6 L13 19 L20 18 Q21 18 21 17 Z" />
      <line x1="5" y1="9" x2="9" y2="9.5" />
      <line x1="5" y1="12" x2="9" y2="12.5" />
      <line x1="5" y1="15" x2="9" y2="15.5" />
      <line x1="15" y1="9.5" x2="19" y2="9" />
      <line x1="15" y1="12.5" x2="19" y2="12" />
      <line x1="15" y1="15.5" x2="19" y2="15" />
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
