import React from 'react';

export type IconName =
  | 'chill-out'
  | 'fuel-right'
  | 'crispy-clarity'
  | 'fresh-lungs'
  | 'open-mind'
  | 'move-body'
  | 'wet-lips'
  | 'keep-walking'
  | 'feed-brain'
  | 'arrow-right';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const paths: Record<IconName, React.ReactNode> = {
  'chill-out': (
    <>
      <path d="M7 2v3M12 2v3M17 2v3" />
      <path d="M4 8h16v2a8 8 0 0 1-8 8 8 8 0 0 1-8-8V8Z" />
      <path d="M9 14v2M12 14v3M15 14v2" />
    </>
  ),
  'fuel-right': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7c-2 0-3.5 1.5-3.5 3.2 0 1.8 1.6 2.6 3.5 3.1 1.9.5 3.5 1.3 3.5 3.1 0 1.7-1.5 3.2-3.5 3.2" />
      <path d="M12 5v2M12 19v2" />
    </>
  ),
  'crispy-clarity': (
    <>
      <path d="M7 3h10l-1 4a4 4 0 0 1-1 7v6h-2v-3h-2v3H9v-6a4 4 0 0 1-1-7L7 3Z" />
      <path d="M5 3h2M17 3h2" />
    </>
  ),
  'fresh-lungs': (
    <>
      <path d="M12 4v16" />
      <path d="M8 7c-2.5 0-4 2-4 5 0 3 1.5 5 3.5 6 1 .5 1.5 1.3 1.5 2.3V21h2v-1c0-1.7-1-3.2-2.5-4C7 15.3 6 13.7 6 12c0-2.2 1-3.5 2.2-3.5" />
      <path d="M16 7c2.5 0 4 2 4 5 0 3-1.5 5-3.5 6-1 .5-1.5 1.3-1.5 2.3V21h-2v-1c0-1.7 1-3.2 2.5-4 1.5-.7 2.5-2.3 2.5-4 0-2.2-1-3.5-2.2-3.5" />
    </>
  ),
  'open-mind': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7c1.5 0 2.5 1 2.5 2.3 0 1-.6 1.7-1.5 2-.4.2-.5.4-.5.7v.5" />
      <circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  'move-body': (
    <>
      <path d="M2 12h2M20 12h2" />
      <rect x="4" y="9" width="4" height="6" rx="1" />
      <rect x="16" y="9" width="4" height="6" rx="1" />
      <path d="M8 12h8" />
    </>
  ),
  'wet-lips': (
    <>
      <path d="M12 3c-3.5 0-6 2.5-6 5.5 0 2 1 3.4 2 4.5.6.7 1 1.5 1 2.5v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3c0-1 .4-1.8 1-2.5 1-1.1 2-2.5 2-4.5C18 5.5 15.5 3 12 3Z" />
    </>
  ),
  'keep-walking': (
    <>
      <path d="M9 4c1 0 2 1 2 2.5S10 9 9 9s-2-1-2-2.5S8 4 9 4Z" />
      <path d="M8 10c-.5 1.5-1 3-1.5 4l-2 1.5" />
      <path d="M9 11l1 3v6" />
      <path d="M9 14l-2 1v4" />
      <path d="M10 12l3 1.5 3-1" />
    </>
  ),
  'feed-brain': (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h9a3 3 0 0 1 3 3v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
      <path d="M4 5v14" />
      <path d="M8 8h7M8 12h7M8 16h4" />
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
