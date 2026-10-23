import type { Metadata } from 'next';

/**
 * /redeem is a client component, so its metadata lives here.
 */
export const metadata: Metadata = {
  title: 'Redeem a code',
  description:
    'Enter a FIT50 code to unlock premium access to cloud sync, streak protection, photo proof and your completion certificate.',
  alternates: { canonical: '/redeem' },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RedeemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}