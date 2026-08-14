'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Button from './Button';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: '/#story', label: 'Blame us' },
  { href: '/#rules', label: 'Rules' },
  { href: '/#resources', label: 'On the House' },
  { href: '/#workouts', label: 'Workouts' },
  { href: '/#tracker', label: 'Tracker' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#sign-up', label: 'Keep the tools' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth ${
        scrolled || mobileOpen
          ? 'bg-paper/95 backdrop-blur-md border-b border-rule'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl text-ink tracking-tightest"
          onClick={() => setMobileOpen(false)}
        >
          FIT50
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) =>
            l.href.startsWith('#') ? (
              <a
                key={l.href}
                href={l.href}
                className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors duration-200"
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            {!loading && user && (
              <>
                <Link
                  href="/account"
                  className="hidden md:inline font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors"
                >
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden md:inline font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
            {!loading && !user && (
              <Link
                href="/account"
                className="hidden md:inline font-body text-caption uppercase text-ink/70 hover:text-ink transition-colors"
              >
                Account
              </Link>
            )}
            <Button
              href="/#sign-up"
              variant="primary"
              tone="light"
              className="!px-5 !py-2.5 !text-xs"
            >
              Buy us a beer
            </Button>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden -mr-2 p-2 text-ink/70 hover:text-ink"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {mobileOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
          {!loading && user && (
            <div
              className="hidden md:block max-w-[280px] truncate text-right font-body text-[11px] uppercase tracking-widest text-ink/40"
              title={user.email}
            >
              {user.email}
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Site navigation"
          className="md:hidden border-t border-rule bg-paper"
        >
          <ul className="max-w-7xl mx-auto px-6 py-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                {l.href.startsWith('#') ? (
                  <a
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink border-b border-rule"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink border-b border-rule"
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <a
                href="/#sign-up"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-3 font-body text-caption uppercase tracking-widest text-coral hover:text-ink border-b border-rule"
              >
                Buy us a beer
              </a>
            </li>
            {!loading && user && (
              <li>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink border-b border-rule"
                >
                  Account
                </Link>
              </li>
            )}
            {!loading && !user && (
              <li>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink border-b border-rule"
                >
                  Account
                </Link>
              </li>
            )}
            {user && (
              <li>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-2 py-3 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink"
                >
                  Sign out
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
