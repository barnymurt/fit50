'use client';

import { useState } from 'react';
import Section from './Section';
import Button from './Button';
import Marquee from './Marquee';

export default function Calculator() {
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState<Date | null>(null);

  const calculateFinish = () => {
    if (!startDate) return;
    const start = new Date(startDate);
    const finish = new Date(start);
    finish.setDate(finish.getDate() + 49);
    setFinishDate(finish);
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Section
      id="calculator"
      className="relative text-ink overflow-hidden pt-40 md:pt-56"
      style={{ backgroundColor: '#D8B8D0' }}
    >
      <h2 className="sr-only">Calculate your finish date</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="WHEN WILL YOU FINISH · 50 DAYS · MARK THE DATE"
          separator="✦"
          speed={220}
          textClassName="text-coral/50"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-7">
            <p className="font-display text-3xl md:text-5xl text-ink/85 max-w-2xl leading-tight">
              Pick your start date. We&apos;ll mark the finish line — 50 days to go.
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-10">
            <p className="font-body text-caption uppercase text-ink/60">
              The Calendar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 md:col-start-7">
            <div className="bg-paper border border-ink/10 p-8 md:p-10">
              <p className="font-body text-caption uppercase text-ink/50 mb-6">
                Your finish date
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setFinishDate(null);
                  }}
                  className="flex-1 px-4 py-3 bg-paper border border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
                  aria-label="Start date"
                />
                <Button
                  onClick={calculateFinish}
                  disabled={!startDate}
                  variant="primary"
                  tone="light"
                  className="!rounded-none whitespace-nowrap"
                >
                  Calculate
                </Button>
              </div>

              {finishDate ? (
                <div className="border-t border-ink/10 pt-6">
                  <p className="font-body text-caption uppercase text-ink/50 mb-2">
                    You&apos;ll finish on
                  </p>
                  <p className="font-display text-h2 text-ink mb-6">
                    {formatDate(finishDate)}
                  </p>
                  <Button href="#tracker" variant="secondary" tone="light" className="!rounded-none w-full sm:w-auto">
                    Start tracking from today
                  </Button>
                </div>
              ) : (
                <p className="font-body text-sm text-ink/50 border-t border-ink/10 pt-6">
                  Pick a date above to see your finish line.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
