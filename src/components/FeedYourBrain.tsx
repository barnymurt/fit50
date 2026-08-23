'use client';

import { useEffect, useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import HabitIcon from './HabitIcon';
import { useBookLog, BookFormat } from '@/hooks/useBookLog';

interface FeedYourBrainProps {
  // Kept for API stability; the Timer was extracted to its own
  // WorkoutTimer section. Ignored.
  withTimer?: boolean;
}

export default function FeedYourBrain(_props: FeedYourBrainProps = {}) {
  const { currentBook, booksByTitle, hydrated, setCurrentBook, removeBook } = useBookLog();

  const [draft, setDraft] = useState('');
  const [format, setFormat] = useState<BookFormat>('read');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (currentBook) {
      setDraft(currentBook.title);
      setFormat(currentBook.format);
    }
  }, [currentBook]);

  const handleSave = () => {
    const clean = draft.trim();
    if (!clean) return;
    setCurrentBook(clean, format);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <Section
      id="feed-your-brain"
      className="relative pt-12 md:pt-16 pb-section"
      tone="paper"
      contained
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          <div className="md:col-span-7">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
              Feed Your Brain
            </p>
            <Heading>Read 5. Or start a passion project.</Heading>
            <p className="font-body text-base text-ink/70 mt-3 max-w-xl">
              Log what you&apos;re reading or listening to. When it comes to
              day 50 we&apos;ll remind you what book you picked up. Let&apos;s
              build a Fit50 library together.
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="bg-white border border-ink/15 p-5 md:p-6 mb-6">
          <label
            htmlFor="book-title"
            className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3"
          >
            Today&apos;s book
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="book-title"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="The title you&apos;re reading or listening to"
              className="flex-1 px-3 py-3 border border-ink/30 bg-paper text-ink font-body focus:border-coral outline-none"
            />
            <div className="flex">
              <button
                type="button"
                onClick={() => setFormat('read')}
                aria-pressed={format === 'read'}
                className={`px-4 py-3 font-body text-caption uppercase tracking-widest border ${
                  format === 'read'
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink/60 border-ink/30 hover:border-ink'
                }`}
              >
                Read
              </button>
              <button
                type="button"
                onClick={() => setFormat('listen')}
                aria-pressed={format === 'listen'}
                className={`px-4 py-3 font-body text-caption uppercase tracking-widest border border-l-0 ${
                  format === 'listen'
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink/60 border-ink/30 hover:border-ink'
                }`}
              >
                Listen
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim()}
              className="bg-coral hover:bg-coral/85 transition-colors px-5 py-3 font-body text-caption uppercase tracking-widest text-paper disabled:opacity-50"
            >
              {savedFlash ? 'Saved ✓' : currentBook ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        {/* Saved books list */}
        <div className="bg-white border border-ink/15">
          <div className="px-5 md:px-6 py-4 border-b border-ink/10 flex items-center justify-between">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              Books on the list
            </p>
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
              {hydrated ? `${booksByTitle.length} title${booksByTitle.length === 1 ? '' : 's'}` : '—'}
            </p>
          </div>
          {hydrated && booksByTitle.length === 0 ? (
            <div className="px-5 md:px-6 py-8 text-center">
              <div className="flex justify-center mb-3">
                <HabitIcon name="feed-brain" size={56} className="!text-ink/40" />
              </div>
              <p className="font-body text-sm text-ink/60">
                Nothing logged yet. Save your first book above and
                it&apos;ll show up here and on your certificate.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {booksByTitle.map((b) => (
                <li
                  key={`${b.title.toLowerCase()}-${b.format}`}
                  className="flex items-center justify-between gap-4 px-5 md:px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-h3 text-ink truncate">
                      {b.title}
                    </p>
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-1">
                      {b.format === 'read' ? 'Reading' : 'Listening'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBook(b.title, b.format)}
                    aria-label={`Remove ${b.title}`}
                    className="font-body text-caption uppercase tracking-widest text-ink/40 hover:text-coral transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}