'use client';

import { useState } from 'react';
import { useEmailCapture } from './EmailCaptureContext';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function EmailCaptureModal({ 
  isOpen, 
  onClose,
  title = "Save Your Progress",
  message = "Enter your email to save your tracker progress and get reminders."
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [skip, setSkip] = useState(false);
  const { captureEmail } = useEmailCapture();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      captureEmail(email);
      onClose();
    }
  };

  const handleSkip = () => {
    setSkip(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2A2A]/80 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative bg-[#FEFEFE] p-8 rounded-lg max-w-md w-full mx-4 shadow-2xl">
        <h3 className="font-display text-2xl text-[#2A2A2A] mb-2">
          {title}
        </h3>
        <p className="font-body text-[#2A2A2A]/70 mb-6">
          {message}
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full p-4 bg-[#F2D9A2]/30 border-2 border-[#F2D9A2] text-[#2A2A2A] font-body rounded mb-4 focus:outline-none focus:border-[#E88B5A]"
            autoFocus
            required
          />
          
          <button
            type="submit"
            className="w-full bg-[#E88B5A] text-[#FEFEFE] font-display text-sm px-6 py-4 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors mb-3"
          >
            Save Progress
          </button>
        </form>
        
        <button
          onClick={handleSkip}
          className="w-full text-[#2A2A2A]/50 font-body text-sm hover:text-[#2A2A2A]/80 transition-colors"
        >
          Continue without saving
        </button>
        
        <p className="font-body text-xs text-[#2A2A2A]/40 mt-4 text-center">
          Join 10,000+ others building unbreakable habits. No spam, ever.
        </p>
      </div>
    </div>
  );
}
