import React from 'react';

type Size = 'display-1' | 'display-2' | 'h1' | 'h2' | 'h3';

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';
  size?: Size;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
}

const sizeMap: Record<Size, string> = {
  'display-1': 'text-display-1',
  'display-2': 'text-display-2',
  'h1': 'text-h1',
  'h2': 'text-h2',
  'h3': 'text-h3',
};

const defaultTag: Record<Size, 'h1' | 'h2' | 'h3' | 'h4' | 'span'> = {
  'display-1': 'h1',
  'display-2': 'h2',
  'h1': 'h2',
  'h2': 'h3',
  'h3': 'h4',
};

export default function Heading({
  as,
  size = 'h1',
  children,
  className = '',
  align = 'left',
  italic = false,
}: HeadingProps) {
  const Tag = (as ?? defaultTag[size]) as keyof JSX.IntrinsicElements;
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const italicClass = italic ? 'italic' : '';
  return (
    <Tag className={`font-display ${sizeMap[size]} ${alignClass} ${italicClass} ${className}`}>
      {children}
    </Tag>
  );
}
