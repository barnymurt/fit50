'use client';

import { useSearchParams } from 'next/navigation';

export function ErrorBanner() {
  const params = useSearchParams();
  const error = params?.get('error');
  if (error !== 'wrong_password') return null;
  return (
    <p
      role="alert"
      style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        color: '#E88B5A',
        margin: '0 0 12px',
      }}
    >
      Wrong password. Try again.
    </p>
  );
}
