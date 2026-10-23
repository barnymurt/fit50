import type { Metadata } from 'next';

/**
 * /certificate is a client component, so its metadata lives here.
 */
export const metadata: Metadata = {
  title: 'Completion certificate',
  description:
    'Your FIT50 completion certificate: every rule, every day, with a banana for each streak-protection pass you spent.',
  alternates: { canonical: '/certificate' },
};

export default function CertificateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}