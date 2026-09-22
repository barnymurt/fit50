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
import WorkoutStatsCard from '@/components/analytics/WorkoutStatsCard';

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
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
          Daily balance
        </p>
        <p className="font-body text-sm text-ink/40 mb-4">
          Your calorie balance each day. The dashed teal line adds back workout burn — use it to see your real energy position if you train hard and want to account for what you burned.
        </p>
        <DailyBalanceChart days={days} totals={totals} loaded={loaded} />
      </Section>

      {/* Macro breakdown bars */}
      <Section tone="teal" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/70 mb-1">
          Macro balance vs target
        </p>
        <p className="font-body text-sm text-paper/50 mb-4">
          Protein, carbs and fat as a percentage of your total calories. The goal band (95–105%) is marked in teal. Protein is the priority — it&apos;s what keeps your muscle while you cut.
        </p>
        <MacroBreakdownBars totals={totals} loaded={loaded} />
      </Section>

      {/* Macro split donut */}
      <Section tone="lavender" className="py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
              Average macro split
            </p>
            <p className="font-body text-sm text-ink/40 mb-4">
              How your protein, carbs and fat actually split across logged days — compared to your macro target. The donut shows the ratio; the bars above show how close you are to each gram target.
            </p>
            <MacroSplitDonut totals={totals} loaded={loaded} />
          </div>
          <div className="flex-1 w-full">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
              Workout impact
            </p>
            <p className="font-body text-sm text-ink/40 mb-4">
              How much your FIT50 sessions add to your daily burn. Toggle between eating back the calories or keeping them as a deficit — depends on your training load and goals.
            </p>
            <WorkoutImpactCard totals={totals} loaded={loaded} />
          </div>
        </div>
      </Section>

      {/* Deficit streak calendar */}
      <Section tone="ink" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-1">
          Budget calendar
        </p>
        <p className="font-body text-sm text-paper/40 mb-4">
          Each square is one day. Green means you were under your calorie budget — good for a deficit. Orange means you went over. Each colour shift is a day you chose differently.
        </p>
        <DeficitStreakCalendar days={days} loaded={loaded} />
      </Section>

      {/* Workout consistency */}
      <Section tone="paper" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
          Workout consistency
        </p>
        <p className="font-body text-sm text-ink/40 mb-4">
          Your FIT50 workout log for this period. Tracks completed sessions and rows — every session completed brings you closer to the finish.
        </p>
        <WorkoutStatsCard
          totals={totals}
          loaded={loaded}
          currentDay={startDateProp ? Math.ceil((Date.now() - new Date(startDateProp).getTime()) / 86400000) + 1 : null}
        />
      </Section>
    </div>
  );
}
