'use client';

import { useState, useEffect } from 'react';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import PremiumGate from '@/components/PremiumGate';
import AnalyticsScreen from '@/components/analytics/AnalyticsScreen';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fit50-tracker-v2');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.data?.startDate) setStartDate(parsed.data.startDate);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <Section tone="paper" contained className="py-8">
      <div className="mb-6">
        <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
          Premium
        </p>
        <Heading size="h1">Food &amp; exercise analytics.</Heading>
      </div>

      <PremiumGate
        feature="Food &amp; exercise analytics"
        description="See exactly how your daily food and workouts add up — under or over budget, macro trends, and the days you nailed it."
      >
        <AnalyticsScreen startDate={startDate} />
      </PremiumGate>
    </Section>
  );
}
