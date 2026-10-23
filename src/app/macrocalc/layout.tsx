import type { Metadata } from 'next';

/**
 * /macrocalc is a client component, so its metadata cannot be exported from
 * page.tsx. The route-level layout is the supported place for it.
 */
export const metadata: Metadata = {
  title: 'Macro calculator',
  description:
    'Work out your daily calorie, protein, carbohydrate and fat targets from your weight, height and activity level, then track against them.',
  alternates: { canonical: '/macrocalc' },
};

export default function MacroCalcLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}