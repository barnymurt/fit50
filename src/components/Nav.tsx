'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Button from './Button';
import { useAuth } from '@/contexts/AuthContext';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth ${
        scrolled
          ? 'bg-paper/90 backdrop-blur-md border-b border-rule'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl text-ink tracking-tightest"
        >
          FIT50
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#rules" className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200">
            Rules
          </a>
          <a href="#workouts" className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200">
            Workouts
          </a>
          <a href="#tracker" className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200">
            Tracker
          </a>
          <Link
            href="/fuel"
            className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200"
          >
            Fuel
          </Link>
          <a href="#faq" className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors"
          >
            Account
          </Link>
          <Button href="#tracker" variant="primary" tone="light" className="!px-5 !py-2.5 !text-xs">
            Start
          </Button>
        </div>
      </div>
    </header>
  );
}
