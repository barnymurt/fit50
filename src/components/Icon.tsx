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
  // Two ice cubes — soft rounded shapes, single facet line each
  'chill-out': (
    <>
      <path d="M3 6 Q3 4 5 4 L11 4 Q13 4 13 6 L13 13 Q13 15 11 15 L5 15 Q3 15 3 13 Z" />
      <path d="M3 9.5 L13 9.5" />
      <path d="M12 10 Q12 8 14 8 L20 8 Q22 8 22 10 L22 17 Q22 19 20 19 L14 19 Q12 19 12 17 Z" />
      <path d="M12 13.5 L22 13.5" />
    </>
  ),

  // Petrol pump — tall body, display, curved hose
  'fuel-right': (
    <>
      <path d="M4 4 Q4 3 5 3 L12 3 Q13 3 13 4 L13 21 L4 21 Z" />
      <path d="M5.5 5.5 L11.5 5.5 L11.5 9 L5.5 9 Z" />
      <path d="M13 8 Q16 8 16 11 L16 13" />
      <path d="M16 13 L18.5 13 L18.5 17.5" />
      <line x1="2.5" y1="21" x2="20.5" y2="21" />
    </>
  ),

  // Martini glass — V-bowl, thin stem, oval base, cherry on rim, olive on pick
  'crispy-clarity': (
    <>
      <path d="M3.5 4 L20.5 4" />
      <path d="M3.5 4 L12 13.5 L20.5 4" />
      <path d="M12 13.5 L12 19" />
      <path d="M8 20.5 Q12 19 16 20.5" />
      <circle cx="18.5" cy="2.5" r="1.5" />
      <path d="M19.5 1.5 Q20.5 0.5 21.5 0" />
      <circle cx="12" cy="8" r="1" />
      <line x1="12" y1="8" x2="14.5" y2="5.5" />
    </>
  ),

  // Pair of lungs in circle with branching bronchi
  'fresh-lungs': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 5.5 L12 9" />
      <path d="M12 9 Q8 9 6 12 Q3.5 15.5 5 18.5 Q6 20 8 19 Q10 18 10 15.5 L10 11" />
      <path d="M12 9 Q16 9 18 12 Q20.5 15.5 19 18.5 Q18 20 16 19 Q14 18 14 15.5 L14 11" />
      <path d="M8.5 13 L7.5 15" />
      <path d="M8.5 13 L9.5 15" />
      <path d="M7.5 15 L6.5 17" />
      <path d="M9.5 15 L10.5 17" />
      <path d="M15.5 13 L14.5 15" />
      <path d="M15.5 13 L16.5 15" />
      <path d="M14.5 15 L13.5 17" />
      <path d="M16.5 15 L17.5 17" />
    </>
  ),

  // Brain — organic outline with flowing cerebral folds
  'open-mind': (
    <>
      <path d="M12 4 Q7 4 6 7.5 Q3 8.5 3 12 Q3 15 5 16 Q5.5 19 8 20 Q10 21 12 19.5" />
      <path d="M12 4 Q17 4 18 7.5 Q21 8.5 21 12 Q21 15 19 16 Q18.5 19 16 20 Q14 21 12 19.5" />
      <path d="M12 4 Q12 11 12 19.5" />
      <path d="M7 9 Q8.5 10.5 7 12" />
      <path d="M9 14 Q10.5 15.5 9 17" />
      <path d="M6 13.5 Q7.5 14.5 8 16" />
      <path d="M17 9 Q15.5 10.5 17 12" />
      <path d="M15 14 Q13.5 15.5 15 17" />
      <path d="M18 13.5 Q16.5 14.5 16 16" />
      <path d="M8 11 Q9 12 8 13" />
      <path d="M16 11 Q15 12 16 13" />
    </>
  ),

  // Dancing figure — round head, curved body, arms up, legs apart
  'move-body': (
    <>
      <circle cx="12" cy="4" r="1.7" />
      <path d="M12 5.7 Q11.5 10 12 14.5" />
      <path d="M12 8.5 Q10 7 8.5 5.5" />
      <path d="M12 8.5 Q14 7 16 4.5" />
      <path d="M12 14.5 Q10.5 17 9 20.5" />
      <path d="M12 14.5 Q13.5 17 15.5 19.5" />
    </>
  ),

  // Lips with lipstick wand applicator
  'wet-lips': (
    <>
      <path d="M5.5 10 Q7 8.5 9 9.5 Q11 7.5 12 9 Q13 7.5 15 9.5 Q17 8.5 18.5 10" />
      <path d="M5.5 10 Q5.5 12.5 9 13.5 Q12 14.5 15 13.5 Q18.5 12.5 18.5 10" />
      <line x1="3" y1="21" x2="9.5" y2="14.5" />
      <path d="M9 14 L11.5 16 L10 17 Z" />
    </>
  ),

  // Two footprints with toes
  'step-it-up': (
    <>
      <path d="M7 5 Q4.5 5 4.5 8 Q4.5 10 5.5 11 Q4.5 12.5 4.5 14.5 Q4.5 17 7 17 Q9.5 17 9.5 14.5 Q9.5 12.5 8.5 11 Q9.5 10 9.5 8 Q9.5 5 7 5 Z" />
      <circle cx="5.5" cy="3.5" r="0.7" fill="currentColor" />
      <circle cx="7" cy="2.5" r="0.6" fill="currentColor" />
      <circle cx="8.5" cy="3.5" r="0.6" fill="currentColor" />
      <path d="M17 12 Q14.5 12 14.5 15 Q14.5 17 15.5 18 Q14.5 19.5 14.5 21.5 Q14.5 24 17 24 ... " />
    </>
  ),

  // Stack of books — bottom closed, middle open, top closed with pages
  'feed-brain': (
    <>
      <path d="M3 17 L3 21 L21 21 L21 17 Z" />
      <line x1="5" y1="19" x2="5" y2="21" />
      <path d="M4 11 L4 16 L12 15 L12 10 Z" />
      <path d="M20 11 L20 16 L12 15 L12 10 Z" />
      <line x1="6" y1="13" x2="10" y2="13" />
      <path d="M6 5 L6 9 L18 9 L18 5 Z" />
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
