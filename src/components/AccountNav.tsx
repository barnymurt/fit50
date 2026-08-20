'use client';

import { useEffect, useState } from 'react';

interface NavSection {
  id: string;
  label: string;
  href?: string;
}

function linkFor(s: NavSection): string {
  return s.href ?? `#${s.id}`;
}

export default function AccountNav({ sections }: { sections: NavSection[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const anchorIds = sections.filter((s) => !s.href).map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    anchorIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      {/* Mobile: sticky horizontal bar below the nav */}
      <nav
        aria-label="Account sections"
        className="md:hidden sticky top-16 z-30 bg-paper/95 backdrop-blur border-b border-ink/10"
      >
        <div className="overflow-x-auto">
          <ul className="flex gap-1 px-4 py-2 whitespace-nowrap">
            {sections.map((s) => {
              const isActive = activeId === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={linkFor(s)}
                    className={`inline-block px-3 py-1 font-body text-caption uppercase tracking-widest transition-colors ${
                      isActive ? 'text-coral' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Desktop: fixed vertical menu on the right side */}
      <nav
        aria-label="Account sections"
        className="hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-paper border border-ink/10 p-3 max-h-[70vh] overflow-y-auto"
      >
        <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-2 px-2">
          Jump to
        </p>
        <ul className="space-y-1">
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <li key={s.id}>
                <a
                  href={linkFor(s)}
                  className={`block px-2 py-1 font-body text-caption uppercase tracking-widest transition-colors border-l-2 ${
                    isActive
                      ? 'text-coral border-coral'
                      : 'text-ink/60 border-transparent hover:text-ink hover:border-ink/20'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
