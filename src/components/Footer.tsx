'use client';

import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#2A2A2A] py-16">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <h2 className="font-display text-3xl text-[#FEFEFE] mb-4">
          FIT50
        </h2>
        <p className="font-body text-[#FEFEFE]/60 text-sm mb-8">
          Art by <span className="text-[#E88B5A]">@tommygraingerart</span>
        </p>

        <div className="mb-8">
          <p className="font-body text-[#FEFEFE]/80 mb-4">
            Stay updated with the challenge
          </p>
          {submitted ? (
            <p className="font-body text-[#4A9B9B]">
              Thanks for subscribing! We'll be in touch.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 p-3 bg-[#FEFEFE] text-[#2A2A2A] font-body rounded"
                required
              />
              <button
                type="submit"
                className="bg-[#E88B5A] text-[#FEFEFE] font-display text-sm px-6 py-3 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        <div className="flex justify-center gap-8 mb-8">
          <a href="#" className="font-body text-[#FEFEFE]/60 hover:text-[#FEFEFE] text-sm">
            Instagram
          </a>
          <a href="#" className="font-body text-[#FEFEFE]/60 hover:text-[#FEFEFE] text-sm">
            Twitter
          </a>
          <a href="#" className="font-body text-[#FEFEFE]/60 hover:text-[#FEFEFE] text-sm">
            Contact
          </a>
        </div>

        <p className="font-body text-[#FEFEFE]/40 text-xs">
          © 2026 FIT50. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
