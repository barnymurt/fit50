'use client';

import { EmailProvider } from '@/components/EmailCaptureContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return <EmailProvider>{children}</EmailProvider>;
}
