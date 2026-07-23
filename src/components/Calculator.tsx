'use client';

import { useState } from 'react';
import Section from './Section';
import Heading from './Heading';
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
    <Section id="calculator" tone="ink" className="relative bg-lavender/50 text-ink py-section overflow-hidden" contained>
      <div className="absolute -top-12 left-0 right-0 z-0 pointer-events-none">
        <Marquee
          text="WHEN WILL YOU FINISH · 50 DAYS · MARK THE DATE"
          separator="✦"
          speed={140}
          textClassName="text-coral/25"
        />
      </div>

      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-16">
          <div className="md:col-span-5">
            <p className="font-body text-caption uppercase text-ink/60 mb-4">
              The Calendar
            </p>
            <Heading as="h2" size="display-2" className="mb-6">
              Mark the day.<br />
              See the finish.
            </Heading>
            <p className="font-body text-lg text-ink/70 max-w-md">
              Choose your start date. We&apos;ll show you exactly when you&apos;ll emerge — 50 days later, transformed.
            </p>
          </div>

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
