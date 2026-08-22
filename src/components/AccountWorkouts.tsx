'use client';

import { useEffect, useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface Exercise {
  slot: string;
  name: string;
  reps: string;
  description: string;
}

type Line = 'A' | 'B' | 'C' | 'D';

const workoutLines: Record<Line, { name: string; subtitle: string; exercises: Exercise[] }> = {
  A: {
    name: 'The Base',
    subtitle: 'Foundations',
    exercises: [
      {
        slot: '01',
        name: 'Push-ups',
        reps: '5 × 10',
        description:
          'Hands shoulder-width, elbows tracking back at ~45°. Lower your chest to the floor with a straight line from head to heels, then press back up. Don\'t let your hips sag or pike up — keep your core braced throughout. Breathe out on the way up.',
      },
      {
        slot: '02',
        name: 'Supermans',
        reps: '5 × 10',
        description:
          'Lie face down, arms extended overhead. Lift your arms, chest, and legs off the floor at the same time, squeezing your lower back and glutes at the top. Hold for a second, then lower with control. Keep your neck neutral — look at the floor, not forward.',
      },
      {
        slot: '03',
        name: 'Bodyweight Squats',
        reps: '5 × 10',
        description:
          'Feet shoulder-width, toes pointed slightly out. Push your hips back like you\'re sitting in a chair, knees tracking over your toes. Go as deep as comfortable — aim for thighs parallel to the floor or lower. Drive through your heels to stand.',
      },
      {
        slot: '04',
        name: 'Bird Dogs',
        reps: '5 × 10/side',
        description:
          'On all fours, wrists under shoulders, knees under hips. Extend your right arm forward and left leg back at the same time, keeping your spine neutral and hips level. Hold briefly, return with control. Alternate sides. The slower you go, the harder it works your core.',
      },
      {
        slot: '05',
        name: 'Plank',
        reps: '5 × 50s',
        description:
          'Forearms on the floor, elbows under shoulders, toes tucked. Body in a straight line from head to heels — squeeze your glutes, brace your abs, and don\'t let your hips sag or pike up. Hold the position. Breathe shallowly through it.',
      },
    ],
  },
  B: {
    name: 'Wide Angles',
    subtitle: 'Chest & full-body',
    exercises: [
      {
        slot: '01',
        name: 'Wide Push-ups',
        reps: '5 × 10',
        description:
          'Same as push-ups but with hands placed wider than shoulders. Targets chest more than triceps. Lower with control, press up, keep core braced. If too hard, drop to knees — same movement, less load.',
      },
      {
        slot: '02',
        name: 'Reverse Snow Angels',
        reps: '5 × 10',
        description:
          'Lie face down, arms extended overhead. Lift your arms and legs, then sweep your arms out wide and back down to your sides like making a snow angel. Keep the lift the whole time. Squeeze your back at the bottom of the arc.',
      },
      {
        slot: '03',
        name: 'Lunges',
        reps: '5 × 10',
        description:
          'Step forward with one leg, lower until your back knee nearly touches the floor (front knee at 90°). Push back to standing. Alternate or do all one side then switch. Keep your torso upright and front knee tracking over your toes.',
      },
      {
        slot: '04',
        name: 'Plank Shoulder Taps',
        reps: '5 × 10/side',
        description:
          'Hold a high plank position (hands, not forearms). Without rocking your hips, lift one hand and tap the opposite shoulder. Alternate sides. The less you wobble, the harder it works your core — slow and controlled wins.',
      },
      {
        slot: '05',
        name: 'Burpees',
        reps: '5 × 50s',
        description:
          'Squat down, plant your hands, jump your feet back to a plank. Do a push-up, jump your feet back to your hands, then jump up with arms overhead. One rep. Move at a steady pace for the full 50 seconds.',
      },
    ],
  },
  C: {
    name: 'Ground Floor',
    subtitle: 'Posterior chain',
    exercises: [
      {
        slot: '01',
        name: 'Tricep Dips (floor)',
        reps: '5 × 10',
        description:
          'Seated on the floor, hands by your hips, fingers pointing forward. Lift your hips off the floor, lower them by bending your elbows back at 90°, then press up. Keep your back close to the bench or floor, elbows pointing straight back.',
      },
      {
        slot: '02',
        name: 'Prone Y-Raises',
        reps: '5 × 10',
        description:
          'Lie face down, arms extended. Lift your arms into a Y position (45° out), lower, then lift into an R position (90° out). 10 total or 5/5. Squeeze your upper back at the top. Light weight or none.',
      },
      {
        slot: '03',
        name: 'Glute Bridges',
        reps: '5 × 10',
        description:
          'Lie on your back, knees bent, feet flat on the floor hip-width apart. Drive through your heels, lift your hips toward the ceiling, squeeze your glutes hard at the top. Hold a second, lower with control. Don\'t arch your lower back — drive up with the glutes.',
      },
      {
        slot: '04',
        name: 'Flutter Kicks',
        reps: '5 × 10',
        description:
          'Lie on your back, hands under your glutes, head and shoulders off the floor. Alternate kicking your legs up and down in small, controlled scissor kicks. Keep your core engaged and lower back pressed into the floor.',
      },
      {
        slot: '05',
        name: 'Mountain Climbers',
        reps: '5 × 50s',
        description:
          'Start in a high plank. Drive one knee toward your chest, then switch — fast, like running in place horizontally. Keep your hips low and core tight. Move at a steady pace for the full 50 seconds.',
      },
    ],
  },
  D: {
    name: 'Isolation',
    subtitle: 'Fine control',
    exercises: [
      {
        slot: '01',
        name: 'Tricep Push-ups',
        reps: '5 × 10',
        description:
          'Push-ups with hands close together, elbows hugging your ribs. Targets the triceps much more than a standard push-up. Lower with control, full lockout at the top. If your form breaks, drop to knees.',
      },
      {
        slot: '02',
        name: 'Wall Slides',
        reps: '5 × 10',
        description:
          'Stand with your back against a wall, feet about 6 inches out. Press your lower back, upper back, and head into the wall. Slide your arms up the wall in a Y shape, then back down. Keep contact with the wall the entire time. Slow.',
      },
      {
        slot: '03',
        name: 'Single-Leg Glute Bridge',
        reps: '5 × 10/leg',
        description:
          'Lie on your back, knees bent. Lift one leg off the floor. Drive through the heel of the other foot, lift your hips, squeeze the glute hard at the top. Lower with control. Alternate or do all one side then switch.',
      },
      {
        slot: '04',
        name: 'Dead Bugs',
        reps: '5 × 10/side',
        description:
          'On your back, arms pointing at the ceiling, knees and hips at 90°. Press your lower back into the floor. Extend your right arm back and left leg out at the same time, then return. Alternate sides. The lower back stays glued to the floor — no arching.',
      },
      {
        slot: '05',
        name: 'Russian Twists',
        reps: '5 × 50s',
        description:
          'Sit on the floor, knees bent, lean back about 45°. Lift your feet off the floor for harder, leave them down for easier. Twist your torso side to side, tapping the floor beside your hips. Keep your core braced, move from the torso, not the arms.',
      },
    ],
  },
};

const TOTAL_SETS = 5;
const LINES: Line[] = ['A', 'B', 'C', 'D'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const LOCAL_KEY = (date: string) => `fit50-workout-${date}`;

function loadWorkoutLocal(date: string) {
  if (typeof window === 'undefined') return { line: 'A' as Line, sets: {} as Record<string, number> };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY(date));
    if (!raw) return { line: 'A' as Line, sets: {} as Record<string, number> };
    return JSON.parse(raw);
  } catch {
    return { line: 'A' as Line, sets: {} as Record<string, number> };
  }
}

function saveWorkoutLocal(date: string, data: { line: Line; sets: Record<string, number> }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEY(date), JSON.stringify(data));
}

async function loadWorkoutRemote(supabase: ReturnType<typeof createClient>, userId: string, date: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('workout_log') as any)
    .select('line, sets')
    .eq('user_id', userId)
    .eq('date_key', date)
    .maybeSingle();
  if (error) {
    console.error('workout_log fetch failed:', error);
    return null;
  }
  if (!data) return null;
  return {
    line: data.line as Line,
    // data.sets is a jsonb column — Supabase returns it as a parsed
    // object already.
    sets: (data.sets || {}) as Record<string, number>,
  };
}

async function saveWorkoutRemote(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  date: string,
  data: { line: Line; sets: Record<string, number> }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('workout_log') as any).upsert(
    {
      user_id: userId,
      date_key: date,
      line: data.line,
      sets: data.sets,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date_key,line' }
  );
  if (error) console.error('workout_log upsert failed:', error);
}

function TickBox({ filled, size = 28 }: { filled: boolean; size?: number }) {
  // Outlined box. Empty = grey outline + faint grey tick (hints the
  // slot is tappable). Filled = teal outline + teal fill + paper
  // tick. Tap toggles the underlying sets count.
  const teal = '#4A9B9B';
  const stroke = filled ? teal : 'rgba(26,26,26,0.30)';
  const fill = filled ? teal : 'transparent';
  const tickColor = filled ? '#FAF6EE' : 'rgba(26,26,26,0.25)';
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${stroke}`,
        backgroundColor: fill,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 150ms, border-color 150ms',
      }}
    >
      <svg
        width={Math.round(size * 0.6)}
        height={Math.round(size * 0.6)}
        viewBox="0 0 24 24"
        fill="none"
        stroke={tickColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </div>
  );
}

export default function AccountWorkouts() {
  const { user } = useAuth();
  const supabase = createClient();
  const [date, setDate] = useState<string>('');
  const [line, setLine] = useState<Line>('A');
  const [sets, setSets] = useState<Record<string, number>>({});
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const k = todayKey();
    setDate(k);
    // Try remote first, fall back to local.
    if (user && supabase) {
      loadWorkoutRemote(supabase, user.id, k).then((remote) => {
        if (remote) {
          setLine(remote.line);
          setSets(remote.sets);
          saveWorkoutLocal(k, remote);
          return;
        }
        const local = loadWorkoutLocal(k);
        setLine(local.line);
        setSets(local.sets);
      });
    } else {
      const local = loadWorkoutLocal(k);
      setLine(local.line);
      setSets(local.sets);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!date) return;
    saveWorkoutLocal(date, { line, sets });
    if (user && supabase) {
      saveWorkoutRemote(supabase, user.id, date, { line, sets });
    }
  }, [date, line, sets, user, supabase]);

  // Midnight rollover. Without this, a user who leaves the tab open
  // across midnight keeps seeing yesterday's ticked boxes because
  // `date` was set once on mount. We check every 30s + on tab focus
  // / visibility change. On a date change we save the current
  // state under the OLD date (so yesterday's workout isn't lost in
  // the void) and reset the local state for the new day. The
  // existing save effect above will then upsert the new day's
  // empty sets to the server.
  useEffect(() => {
    if (!date) return;
    const checkRollover = async () => {
      const k = todayKey();
      if (k === date) return;
      // Save current state under the OLD date before we move on, so
      // yesterday's progress is preserved on the server / in
      // localStorage.
      if (user && supabase) {
        await saveWorkoutRemote(supabase, user.id, date, { line, sets });
      } else {
        saveWorkoutLocal(date, { line, sets });
      }
      setDate(k);
      // Reset local state. The mount-effect will then load
      // whatever's in workout_log for the new date (almost always
      // empty for a fresh day, but a previously-saved session
      // would survive).
      setLine('A');
      setSets({});
      setActiveIdx(null);
    };
    const interval = setInterval(checkRollover, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkRollover();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [date, line, sets, user, supabase]);

  const exercises = workoutLines[line].exercises;
  const totalCompleted = exercises.reduce((sum, ex) => sum + (sets[ex.name] || 0), 0);
  const allDone = exercises.every((ex) => (sets[ex.name] || 0) >= TOTAL_SETS);

  const cycleSet = (name: string, index?: number) => {
    setSets((prev) => {
      const current = prev[name] || 0;
      // Tap on a specific set: filled if index < current (untick down
      // to this position), empty if index >= current (tick up to
      // here). Sets must be ticked in order, so a tap at index 2
      // with current=0 marks sets 0,1,2 as ticked (count=3).
      if (typeof index === 'number') {
        if (index < current) {
          return { ...prev, [name]: index };
        }
        return { ...prev, [name]: index + 1 };
      }
      // Tap on the exercise title (no index): cycle 0 → 1 → … →
      // TOTAL_SETS → 0. Kept for the big "Log set" button.
      const next = current >= TOTAL_SETS ? 0 : current + 1;
      return { ...prev, [name]: next };
    });
  };

  const handleActiveDone = () => {
    if (activeIdx === null) return;
    const ex = exercises[activeIdx];
    if ((sets[ex.name] || 0) < TOTAL_SETS) {
      cycleSet(ex.name);
    }
    if (activeIdx < exercises.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      setActiveIdx(null);
    }
  };

  if (!date) {
    return (
      <Section tone="paper" className="relative pt-0 md:pt-2 pb-section" contained>
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">Workouts</p>
          <p className="font-body text-sm text-ink/40">Loading…</p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      id="workouts"
      tone="paper"
      className="relative pt-0 md:pt-2 pb-section"
      contained
    >
      <div className="max-w-3xl mx-auto">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
          Workouts
        </p>
        <Heading>One line a day.</Heading>
        <p className="font-body text-base text-ink/70 mt-3 mb-6">
          Pick a line, do the row, tap a bicep for each set you finish. Sets
          cap at 5 so you don&apos;t forget where you got to mid-workout.
          {allDone && (
            <span className="block mt-3 text-teal font-medium">
              ✓ Line {line} complete for today. Move on, or go again tomorrow.
            </span>
          )}
        </p>

        {/* Download the workout PDF — free for signed-in users */}
        <a
          href="/downloads/fit50-bodyweight-four.pdf"
          download="FIT50_Bodyweight_Four.pdf"
          className="inline-flex items-center gap-2 mb-6 font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
        >
          Download the Bodyweight Four →
        </a>

        {/* Line selector */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {LINES.map((l) => {
            const active = l === line;
            const block = workoutLines[l];
            return (
              <button
                key={l}
                onClick={() => {
                  setLine(l);
                  setActiveIdx(null);
                }}
                className={`px-3 py-3 border font-body text-caption uppercase tracking-widest transition-colors ${
                  active
                    ? 'border-coral text-coral bg-coral/5'
                    : 'border-ink/20 text-ink/70 hover:border-ink/40'
                }`}
              >
                <span className="font-display text-h3 block leading-none mb-1">{l}</span>
                <span className="block text-[10px] leading-tight opacity-80">{block.name}</span>
              </button>
            );
          })}
        </div>

        {/* Exercise list — line expanded */}
        {activeIdx === null ? (
          <div className="space-y-2">
            {exercises.map((ex, i) => {
              const done = sets[ex.name] || 0;
              const complete = done >= TOTAL_SETS;
              return (
                <div
                  key={ex.name}
                  className={`w-full px-4 py-4 border transition-colors ${
                    complete
                      ? 'border-teal/40 bg-teal/5'
                      : 'border-ink/15 hover:bg-cream/30'
                  }`}
                >
                  {/* Desktop: single row with ticks inline next to the
                      name. Mobile: stacked, ticks on a second row. */}
                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums w-6 shrink-0">
                      {ex.slot}
                    </span>
                    <button
                      onClick={() => setActiveIdx(i)}
                      className="font-body text-base text-ink md:flex-1 md:min-w-0 truncate text-left hover:text-coral transition-colors"
                    >
                      {ex.name}
                    </button>
                    <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0 hidden sm:inline">
                      {ex.reps}
                    </span>
                    <span className="flex gap-1 shrink-0 order-last md:order-none md:ml-2">
                      {Array.from({ length: TOTAL_SETS }).map((_, j) => (
                        <button
                          key={j}
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleSet(ex.name, j);
                          }}
                          aria-label={
                            j < done
                              ? `Set ${j + 1} ticked — tap to untick`
                              : `Set ${j + 1} empty — tap to tick`
                          }
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <TickBox filled={j < done} size={26} />
                        </button>
                      ))}
                    </span>
                    <span className={`font-body text-caption uppercase tracking-widest tabular-nums shrink-0 ml-auto md:ml-0 ${complete ? 'text-teal' : 'text-ink/40'}`}>
                      {done}/{TOTAL_SETS}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-4 text-center">
              Tap a tick to log a set · Tap the name for how-to · {totalCompleted}/{TOTAL_SETS * exercises.length} sets today
            </p>
          </div>
        ) : (
          <div>
            {/* Back to list */}
            <button
              onClick={() => setActiveIdx(null)}
              className="font-body text-caption uppercase tracking-widest text-ink/50 hover:text-ink mb-3"
            >
              ← Back to line {line}
            </button>

            <div className="border border-ink/15 p-5 md:p-6">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                  {exercises[activeIdx].slot}
                </span>
                <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                  {exercises[activeIdx].reps}
                </span>
              </div>
              <h3 className="font-display text-h2 text-ink leading-tight mb-4">
                {exercises[activeIdx].name}
              </h3>
              <p className="font-body text-base text-ink/80 leading-relaxed mb-6">
                {exercises[activeIdx].description}
              </p>

              {/* Sets counter */}
              <div className="border-t border-ink/10 pt-5">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                  Sets completed
                </p>
                <div className="flex items-center gap-3">
                  {Array.from({ length: TOTAL_SETS }).map((_, j) => {
                    const done = sets[exercises[activeIdx].name] || 0;
                    const isFilled = j < done;
                    return (
                      <button
                        key={j}
                        onClick={() => cycleSet(exercises[activeIdx].name)}
                        aria-label={`Set ${j + 1} ${isFilled ? 'completed, tap to undo' : 'tap to log'}`}
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center"
                      >
                        <TickBox filled={isFilled} size={32} />
                      </button>
                    );
                  })}
                  <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums ml-auto">
                    {sets[exercises[activeIdx].name] || 0} / {TOTAL_SETS}
                  </span>
                </div>
                <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-3">
                  Tap a tick to log a set. Tap a filled one to undo.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleActiveDone}
                  className="flex-1 bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
                >
                  {sets[exercises[activeIdx].name] || 0 >= TOTAL_SETS
                    ? activeIdx < exercises.length - 1
                      ? 'Next exercise →'
                      : 'Done · back to list'
                    : `Log set ${(sets[exercises[activeIdx].name] || 0) + 1} →`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
