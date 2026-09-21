'use client';

import { useState } from 'react';
import { useFoodAnalytics, type AnalyticsRange } from '@/hooks/useFoodAnalytics';
import Section from '@/components/Section';
import RangePicker from '@/components/analytics/RangePicker';
import AnalyticsHero from '@/components/analytics/AnalyticsHero';
import DailyBalanceChart from '@/components/analytics/DailyBalanceChart';
import MacroBreakdownBars from '@/components/analytics/MacroBreakdownBars';
import MacroSplitDonut from '@/components/analytics/MacroSplitDonut';
import WorkoutImpactCard from '@/components/analytics/WorkoutImpactCard';
import DeficitStreakCalendar from '@/components/analytics/DeficitStreakCalendar';
import HabitCorrelationCard from '@/components/analytics/HabitCorrelationCard';

interface AnalyticsScreenProps {
  startDate?: string | null;
}

export default function AnalyticsScreen({ startDate: startDateProp }: AnalyticsScreenProps) {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { loaded, days, totals } = useFoodAnalytics(range, startDateProp ?? null);

  return (
    <div className="space-y-8">
      {/* Range picker + hero */}
      <div className="space-y-4">
        <RangePicker value={range} onChange={setRange} />
        <AnalyticsHero totals={totals} loaded={loaded} />
      </div>

      {/* Daily balance chart */}
      <Section tone="paper" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
          Daily balance
        </p>
        <DailyBalanceChart days={days} totals={totals} loaded={loaded} />
      </Section>

      {/* Macro breakdown bars */}
      <Section tone="teal" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/70 mb-4">
          Macro balance vs target
        </p>
        <MacroBreakdownBars totals={totals} loaded={loaded} />
      </Section>

      {/* Macro split donut */}
      <Section tone="lavender" className="py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
              Average macro split
            </p>
            <MacroSplitDonut totals={totals} loaded={loaded} />
          </div>
          <div className="flex-1 w-full">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
              Workout impact
            </p>
            <WorkoutImpactCard totals={totals} loaded={loaded} />
          </div>
        </div>
      </Section>

      {/* Deficit streak calendar */}
      <Section tone="ink" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-4">
          Budget calendar
        </p>
        <DeficitStreakCalendar days={days} loaded={loaded} />
      </Section>

      {/* Habit correlation */}
      <Section tone="paper" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
          Workout correlation
        </p>
        <HabitCorrelationCard days={days} loaded={loaded} />
      </Section>
    </div>
  );
}
