'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EmailCaptureContextType {
  email: string | null;
  setEmail: (email: string | null) => void;
  isCaptured: boolean;
  captureEmail: (email: string) => void;
}

const EmailCaptureContext = createContext<EmailCaptureContextType | undefined>(undefined);

const STORAGE_KEY = 'fit50_email';

export function EmailProvider({ children }: { children: ReactNode }) {
  const [email, setEmailState] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEmailState(stored);
      setIsCaptured(true);
    }
  }, []);

  const setEmail = (newEmail: string | null) => {
    setEmailState(newEmail);
    if (newEmail) {
      localStorage.setItem(STORAGE_KEY, newEmail);
    }
  };

  const captureEmail = (newEmail: string) => {
    setEmail(newEmail);
    setIsCaptured(true);
  };

  return (
    <EmailCaptureContext.Provider value={{ email, setEmail, isCaptured, captureEmail }}>
      {children}
    </EmailCaptureContext.Provider>
  );
}

export function useEmailCapture() {
  const context = useContext(EmailCaptureContext);
  if (!context) {
    throw new Error('useEmailCapture must be used within EmailProvider');
  }
  return context;
}
