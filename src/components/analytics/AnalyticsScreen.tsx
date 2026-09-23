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
import CalorieBalanceCard from '@/components/analytics/CalorieBalanceCard';
import WeightProgressCard from '@/components/analytics/WeightProgressCard';

interface AnalyticsScreenProps {
  startDate?: string | null;
}

export default function AnalyticsScreen({ startDate: startDateProp }: AnalyticsScreenProps) {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { loaded, days, totals, weightReadings, weightProjection, weightBaseline } =
    useFoodAnalytics(range, startDateProp ?? null);

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
        <DailyBalanceChart days={days} loaded={loaded} />
      </Section>

      {/* Macro breakdown bars */}
      <Section tone="teal" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/70 mb-1">
          Macro balance vs target
        </p>
        <p className="font-body text-sm text-paper/50 mb-4">
          Your average macro split compared to the FIT50 targets (Protein 33%, Carbs 40%, Fat 27%). ● means you are within 3% of the target.
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
              How your protein, carbs and fat actually split across logged days — compared to your macro target. The donut shows the ratio.
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
        <p className="font-body text-caption uppercase tracking-widest text-paper/80 mb-1">
          Budget calendar
        </p>
        <p className="font-body text-sm text-paper/60 mb-4">
          Each square is one day. Green means you were under your calorie budget — good for a deficit. Orange means you went over. Each colour shift is a day you chose differently.
        </p>
        <DeficitStreakCalendar days={days} loaded={loaded} />
      </Section>

      {/* Calorie balance: eaten vs burned */}
      <Section tone="paper" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
          Energy balance
        </p>
        <p className="font-body text-sm text-ink/40 mb-4">
          Total calories eaten from food vs total calories burned through FIT50 workouts in this period. Use this to understand whether you are in a net deficit or surplus.
        </p>
        <CalorieBalanceCard totals={totals} loaded={loaded} />
      </Section>

      {/* Weight progress: actual vs projected weight */}
      <Section tone="teal" className="py-6">
        <p className="font-body text-caption uppercase tracking-widest text-paper/70 mb-1">
          Weight progress
        </p>
        <p className="font-body text-sm text-paper/50 mb-4">
          The dashed line is your projected weight from calorie intake minus target minus workout burn
          (1 kg of body fat ≈ 7,700 kcal, smoothed over 7 days). Solid coral dots are weigh-ins you've logged
          yourself — compare those to the projection to see whether you're trending with or against the plan.
        </p>
        <WeightProgressCard
          readings={weightReadings}
          projection={weightProjection}
          baseline={weightBaseline}
          loaded={loaded}
        />
      </Section>
    </div>
  );
}
