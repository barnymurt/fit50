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
  // Two ice cubes with splash drips
  'chill-out': (
    <>
      <path d="M3 4 L11 4 L11 11 L3 11 Z" />
      <line x1="3" y1="7" x2="11" y2="7" />
      <line x1="7" y1="4" x2="7" y2="11" />
      <path d="M11 9 L20 9 L20 18 L11 18 Z" />
      <line x1="11" y1="13" x2="20" y2="13" />
      <line x1="15.5" y1="9" x2="15.5" y2="18" />
      <path d="M5 13 Q5 15 4 15" />
      <path d="M18 20 Q19 21 18 22" />
      <path d="M21 16 Q22 17 21.5 18" />
    </>
  ),

  // Petrol pump with curved hose
  'fuel-right': (
    <>
      <path d="M4 3 L4 21 L14 21 L14 3 Z" />
      <rect x="6" y="5" width="6" height="3" />
      <path d="M14 8 Q17 8 17 11 L17 14" />
      <rect x="16" y="14" width="2.5" height="3.5" rx="0.3" />
      <line x1="3" y1="21" x2="20" y2="21" />
      <line x1="6" y1="13" x2="12" y2="13" />
    </>
  ),

  // Glass with foam and bubbles
  'crispy-clarity': (
    <>
      <path d="M3 8 Q4.5 5 6 7 Q7.5 5 9 7 Q10.5 5 12 7 Q13.5 5 15 7 Q16.5 5 18 7 Q19.5 6 20 8" />
      <path d="M4 8 L5 20 Q5 21 6 21 L14 21 Q15 21 15 20 L16 8" />
      <path d="M15 11 L17 11 Q19 11 19 14 Q19 17 17 17 L15 17" />
      <circle cx="8" cy="13" r="0.6" fill="currentColor" />
      <circle cx="10" cy="16" r="0.6" fill="currentColor" />
      <circle cx="12" cy="11.5" r="0.5" fill="currentColor" />
      <circle cx="9" cy="18" r="0.5" fill="currentColor" />
    </>
  ),

  // Pair of lungs with bronchi
  'fresh-lungs': (
    <>
      <path d="M12 3 L12 10" />
      <path d="M10 6 L14 6" />
      <path d="M12 10 Q7 10 5 13 Q2 17 3.5 20 Q4.5 21.5 6.5 21 Q9 21 10 19 L10 12" />
      <path d="M12 10 Q17 10 19 13 Q22 17 20.5 20 Q19.5 21.5 17.5 21 Q15 21 14 19 L14 12" />
      <path d="M8 15 L7 17" />
      <path d="M16 15 L17 17" />
      <path d="M7 13 L6 14" />
      <path d="M17 13 L18 14" />
    </>
  ),

  // Brain with squiggly folds
  'open-mind': (
    <>
      <path d="M12 4 Q7 4 6 7 Q3 8 3 11 Q2 14 5 15 Q5 18 8 19 Q10 20 12 19" />
      <path d="M12 4 Q17 4 18 7 Q21 8 21 11 Q22 14 19 15 Q19 18 16 19 Q14 20 12 19" />
      <path d="M12 4 L12 19" />
      <path d="M7 9 Q8 10 7 11" />
      <path d="M9 13 Q10 14 9 15" />
      <path d="M6 12 Q7 13 6 14" />
      <path d="M17 9 Q16 10 17 11" />
      <path d="M15 13 Q14 14 15 15" />
      <path d="M18 12 Q17 13 18 14" />
    </>
  ),

  // Chunky dumbbell
  'move-body': (
    <>
      <line x1="8" y1="12" x2="16" y2="12" />
      <rect x="2" y="8" width="3" height="8" rx="0.5" />
      <rect x="5" y="10" width="3" height="4" />
      <rect x="16" y="10" width="3" height="4" />
      <rect x="19" y="8" width="3" height="8" rx="0.5" />
    </>
  ),

  // Organic lips
  'wet-lips': (
    <>
      <path d="M3 11 Q5 9 7 10 Q9 7 12 8 Q15 7 17 10 Q19 9 21 11" />
      <path d="M3 11 Q5 12 7 12 Q9 13 12 13 Q15 13 17 12 Q19 12 21 11" />
      <path d="M4 12 Q4 16 12 18 Q20 16 20 12" />
    </>
  ),

  // Two footprints with toes
  'step-it-up': (
    <>
      <ellipse cx="7" cy="9" rx="2.5" ry="3.5" />
      <circle cx="5.5" cy="4.5" r="0.6" fill="currentColor" />
      <circle cx="7" cy="3.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="4.5" r="0.5" fill="currentColor" />
      <ellipse cx="17" cy="15" rx="2.5" ry="3.5" />
      <circle cx="15.5" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="17" cy="9.5" r="0.5" fill="currentColor" />
      <circle cx="18.5" cy="10.5" r="0.5" fill="currentColor" />
    </>
  ),

  // Open book with page lines
  'feed-brain': (
    <>
      <path d="M3 6 Q3 5 4 5 L11 5 L11 19 L4 18 Q3 18 3 17 Z" />
      <path d="M21 6 Q21 5 20 5 L13 5 L13 19 L20 18 Q21 18 21 17 Z" />
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
