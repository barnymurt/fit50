'use client';

import { useEffect, useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/hooks/usePremium';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useDailySteps, stepsExtraKcal } from '@/hooks/useDailySteps';
import { createClient } from '@/lib/supabase';

interface Exercise {
  slot: string;
  name: string;
  reps: string;
  description: string;
  /** Movement category — used by the random-session picker to
   *  pick one exercise per group (push / pull / legs / core /
   *  stamina) so the daily session covers the whole body. Slot 05
   *  finishers are mostly stamina (5×50s time-based holds and
   *  cardio circuits) but a few (Plank, Russian Twists) sit
   *  better under core; the assignment below is intentional. */
  category: 'push' | 'pull' | 'legs' | 'core' | 'stamina';
  /** MET value from the 2024 Compendium of Physical Activities.
   *  Used for per-exercise kcal estimation (BMR-adjusted). */
  met?: number;
}

export const MET_BY_EXERCISE: Record<string, number> = {
  'Push-ups': 4.0,
  'Supermans': 4.0,
  'Bodyweight Squats': 4.5,
  'Bird Dogs': 3.5,
  Plank: 3.0,
  'Wide Push-ups': 3.5,
  'Reverse Snow Angels': 4.0,
  Lunges: 4.5,
  'Plank Shoulder Taps': 4.0,
  Burpees: 8.0,
  'Tricep Dips (floor)': 3.5,
  'Prone Y-Raises': 3.5,
  'Glute Bridges': 4.0,
  'Flutter Kicks': 5.0,
  'Mountain Climbers': 8.0,
  'Tricep Push-ups': 3.5,
  'Wall Slides': 2.5,
  'Single-Leg Glute Bridge': 4.5,
  'Dead Bugs': 4.0,
  'Russian Twists': 4.0,
};

export type Line = 'A' | 'B' | 'C' | 'D';

export const workoutLines: Record<Line, { name: string; subtitle: string; exercises: Exercise[] }> = {
  A: {
    name: 'The Base',
    subtitle: 'Foundations',
    exercises: [
      {
        slot: '01',
        name: 'Push-ups',
        reps: '5 × 10',
        category: 'push',
        met: 4.0,
        description:
          'Hands shoulder-width, elbows tracking back at ~45°. Lower your chest to the floor with a straight line from head to heels, then press back up. Don\'t let your hips sag or pike up — keep your core braced throughout. Breathe out on the way up.',
      },
      {
        slot: '02',
        name: 'Supermans',
        reps: '5 × 10',
        category: 'pull',
        met: 4.0,
        description:
          'Lie face down, arms extended overhead. Lift your arms, chest, and legs off the floor at the same time, squeezing your lower back and glutes at the top. Hold for a second, then lower with control. Keep your neck neutral — look at the floor, not forward.',
      },
      {
        slot: '03',
        name: 'Bodyweight Squats',
        reps: '5 × 10',
        category: 'legs',
        met: 4.5,
        description:
          'Feet shoulder-width, toes pointed slightly out. Push your hips back like you\'re sitting in a chair, knees tracking over your toes. Go as deep as comfortable — aim for thighs parallel to the floor or lower. Drive through your heels to stand.',
      },
      {
        slot: '04',
        name: 'Bird Dogs',
        reps: '5 × 10/side',
        category: 'core',
        met: 3.5,
        description:
          'On all fours, wrists under shoulders, knees under hips. Extend your right arm forward and left leg back at the same time, keeping your spine neutral and hips level. Hold briefly, return with control. Alternate sides. The slower you go, the harder it works your core.',
      },
      {
        slot: '05',
        name: 'Plank',
        reps: '5 × 50s',
        category: 'core',
        met: 3.0,
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
        category: 'push',
        met: 3.5,
        description:
          'Same as push-ups but with hands placed wider than shoulders. Targets chest more than triceps. Lower with control, press up, keep core braced. If too hard, drop to knees — same movement, less load.',
      },
      {
        slot: '02',
        name: 'Reverse Snow Angels',
        reps: '5 × 10',
        category: 'pull',
        met: 4.0,
        description:
          'Lie face down, arms extended overhead. Lift your arms and legs, then sweep your arms out wide and back down to your sides like making a snow angel. Keep the lift the whole time. Squeeze your back at the bottom of the arc.',
      },
      {
        slot: '03',
        name: 'Lunges',
        reps: '5 × 10',
        category: 'legs',
        met: 4.5,
        description:
          'Step forward with one leg, lower until your back knee nearly touches the floor (front knee at 90°). Push back to standing. Alternate or do all one side then switch. Keep your torso upright and front knee tracking over your toes.',
      },
      {
        slot: '04',
        name: 'Plank Shoulder Taps',
        reps: '5 × 10/side',
        category: 'core',
        met: 4.0,
        description:
          'Hold a high plank position (hands, not forearms). Without rocking your hips, lift one hand and tap the opposite shoulder. Alternate sides. The less you wobble, the harder it works your core — slow and controlled wins.',
      },
      {
        slot: '05',
        name: 'Burpees',
        reps: '5 × 50s',
        category: 'stamina',
        met: 8.0,
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
        category: 'push',
        met: 3.5,
        description:
          'Seated on the floor, hands by your hips, fingers pointing forward. Lift your hips off the floor, lower them by bending your elbows back at 90°, then press up. Keep your back close to the bench or floor, elbows pointing straight back.',
      },
      {
        slot: '02',
        name: 'Prone Y-Raises',
        reps: '5 × 10',
        category: 'pull',
        met: 3.5,
        description:
          'Lie face down, arms extended. Lift your arms into a Y position (45° out), lower, then lift into an R position (90° out). 10 total or 5/5. Squeeze your upper back at the top. Light weight or none.',
      },
      {
        slot: '03',
        name: 'Glute Bridges',
        reps: '5 × 10',
        category: 'legs',
        met: 4.0,
        description:
          'Lie on your back, knees bent, feet flat on the floor hip-width apart. Drive through your heels, lift your hips toward the ceiling, squeeze your glutes hard at the top. Hold a second, lower with control. Don\'t arch your lower back — drive up with the glutes.',
      },
      {
        slot: '04',
        name: 'Flutter Kicks',
        reps: '5 × 10',
        category: 'core',
        met: 5.0,
        description:
          'Lie on your back, hands under your glutes, head and shoulders off the floor. Alternate kicking your legs up and down in small, controlled scissor kicks. Keep your core engaged and lower back pressed into the floor.',
      },
      {
        slot: '05',
        name: 'Mountain Climbers',
        reps: '5 × 50s',
        category: 'stamina',
        met: 8.0,
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
        category: 'push',
        met: 3.5,
        description:
          'Push-ups with hands close together, elbows hugging your ribs. Targets the triceps much more than a standard push-up. Lower with control, full lockout at the top. If your form breaks, drop to knees.',
      },
      {
        slot: '02',
        name: 'Wall Slides',
        reps: '5 × 10',
        category: 'pull',
        met: 2.5,
        description:
          'Stand with your back against a wall, feet about 6 inches out. Press your lower back, upper back, and head into the wall. Slide your arms up the wall in a Y shape, then back down. Keep contact with the wall the entire time. Slow.',
      },
      {
        slot: '03',
        name: 'Single-Leg Glute Bridge',
        reps: '5 × 10/leg',
        category: 'legs',
        met: 4.5,
        description:
          'Lie on your back, knees bent. Lift one leg off the floor. Drive through the heel of the other foot, lift your hips, squeeze the glute hard at the top. Lower with control. Alternate or do all one side then switch.',
      },
      {
        slot: '04',
        name: 'Dead Bugs',
        reps: '5 × 10/side',
        category: 'core',
        met: 4.0,
        description:
          'On your back, arms pointing at the ceiling, knees and hips at 90°. Press your lower back into the floor. Extend your right arm back and left leg out at the same time, then return. Alternate sides. The lower back stays glued to the floor — no arching.',
      },
      {
        slot: '05',
        name: 'Russian Twists',
        reps: '5 × 50s',
        category: 'core',
        met: 4.0,
        description:
          'Sit on the floor, knees bent, lean back about 45°. Lift your feet off the floor for harder, leave them down for easier. Twist your torso side to side, tapping the floor beside your hips. Keep your core braced, move from the torso, not the arms.',
      },
    ],
  },
};

export const TOTAL_SETS = 5;
const LINES: Line[] = ['A', 'B', 'C', 'D'];
const GROUPINGS = ['bodyweight', 'kettlebell', 'band'] as const;
type Grouping = (typeof GROUPINGS)[number];
type WorkoutKey = Line;

// Premium-only equipment programs. Each line A/B/C/D has exactly
// 4 main exercises (5×10) plus 1 stamina finisher (5×50s) at the
// end — total 5 entries per line. Stamina is not its own group
// (per spec); it lives as the last row of each themed line. Lines
// draw one entry per day from the user's 5-day cycles, so each line
// pulls from 4 of the 5 days (with the remaining day's exercise
// either dropped or used as the stamina finisher).
// Bodyweight keeps its current 4-line A/B/C/D structure (the
// free-tier taster); the new equipment programs sit alongside it.
export const kettlebellLines: Record<Line, { name: string; subtitle: string; exercises: Exercise[] }> = {
  A: {
    name: 'KB Pressing',
    subtitle: 'Chest & shoulders',
    exercises: [
      {
        slot: '01',
        name: 'KB Floor Press',
        reps: '5 × 10',
        category: 'push',
        met: 4.5,
        description:
          'Lie on your back with a kettlebell in each hand at shoulder height. Press straight up until your arms lock, lower under control. Switch sides halfway through each set so each arm gets the same volume.',
      },
      {
        slot: '02',
        name: 'KB Strict Press',
        reps: '5 × 10',
        category: 'push',
        met: 4.5,
        description:
          'KB racked at shoulder height, elbows tucked. Press straight overhead without leaning back. Lower under control to the shoulder. Keep your ribs down — don\'t flare your lower back.',
      },
      {
        slot: '03',
        name: 'KB Push Press',
        reps: '5 × 10',
        category: 'push',
        met: 5.0,
        description:
          'KB racked at shoulder. Small dip through knees, drive up hard, press overhead using leg drive. Lower controlled. Switch sides.',
      },
      {
        slot: '04',
        name: 'KB Z Press',
        reps: '5 × 10',
        category: 'push',
        met: 4.5,
        description:
          'Sit on floor, legs straight in front. KB racked at shoulder. Press overhead without leaning back. Lower slow. Switch sides.',
      },
      {
        slot: '05',
        name: 'KB Halo',
        reps: '5 × 50s',
        category: 'core',
        met: 3.5,
        description:
          'KB held by the horns at chest height. Circle it around your head, close to your skull. Brace your core, no leaning. Alternate direction each rep. Slow tempo — KB swings are too ballistic for novice users, so halos give a similar shoulder-rotation stimulus at low load.',
      },
    ],
  },
  B: {
    name: 'KB Pulling',
    subtitle: 'Back & grip',
    exercises: [
      {
        slot: '01',
        name: 'KB Bent-Over Row',
        reps: '5 × 10',
        category: 'pull',
        met: 5.0,
        description:
          'Hinge hips back, flat back, KB hanging one hand. Row to hip, squeeze shoulder blade, lower slow. Switch sides halfway.',
      },
      {
        slot: '02',
        name: 'KB Single-Arm Row',
        reps: '5 × 10',
        category: 'pull',
        met: 5.0,
        description:
          'Split stance, hand on knee for support. Row KB to hip, elbow tight, squeeze back. Lower slow. Switch sides.',
      },
      {
        slot: '03',
        name: 'KB High Pull',
        reps: '5 × 10',
        category: 'pull',
        met: 6.0,
        description:
          'KB between feet, hinge down. Explosively pull up to chin, elbows high and wide. Reverse under control to start.',
      },
      {
        slot: '04',
        name: 'KB Gorilla Row',
        reps: '5 × 10',
        category: 'pull',
        met: 6.0,
        description:
          'Two KBs between feet, wide sumo stance, hinge down. Row one KB to hip while other rests, alternate arms each rep.',
      },
      {
        slot: '05',
        name: 'KB Goblet Squat Pulses',
        reps: '5 × 50s',
        category: 'stamina',
        met: 5.5,
        description:
          'Hold KB at chest, squat to parallel and pulse in the bottom third. Chest up, breath steady.',
      },
    ],
  },
  C: {
    name: 'KB Legs',
    subtitle: 'Quads, hammies & glutes',
    exercises: [
      {
        slot: '01',
        name: 'KB Goblet Squat',
        reps: '5 × 10',
        category: 'legs',
        met: 5.0,
        description:
          'Hold KB at chest, elbows tucked. Squat until thighs parallel or lower, chest up. Drive through heels to stand.',
      },
      {
        slot: '02',
        name: 'KB Romanian Deadlift',
        reps: '5 × 10',
        category: 'legs',
        met: 5.5,
        description:
          'KB in both hands. Push hips back, slight knee bend, KB slides down shins. Squeeze glutes to stand tall.',
      },
      {
        slot: '03',
        name: 'KB Reverse Lunge',
        reps: '5 × 10',
        category: 'legs',
        met: 5.0,
        description:
          'Hold KB goblet at chest. Step back, drop back knee toward floor, drive front heel to return. Alternate legs each rep.',
      },
      {
        slot: '04',
        name: 'KB Cossack Squat',
        reps: '5 × 10',
        category: 'legs',
        met: 5.5,
        description:
          'KB goblet at chest, wide stance. Shift weight fully into one leg, squat deep, other leg straight. Return, switch sides.',
      },
      {
        slot: '05',
        name: "KB Farmer's Carry",
        reps: '5 × 50s',
        category: 'stamina',
        met: 5.0,
        description:
          'One heavy KB per side, or one loaded. Walk with tall posture, ribs down, crushing grip. Turn, return.',
      },
    ],
  },
  D: {
    name: 'KB Power',
    subtitle: 'Explosive & full body',
    exercises: [
      {
        slot: '01',
        name: 'KB Clean and Press',
        reps: '5 × 10',
        category: 'pull',
        met: 6.0,
        description:
          'KB between feet. Pull up to racked shoulder position, press overhead, reverse to floor. Switch sides halfway.',
      },
      {
        slot: '02',
        name: 'KB Thruster',
        reps: '5 × 10',
        category: 'legs',
        met: 5.5,
        description:
          'KB goblet at chest. Squat deep, then drive up and press KB overhead in one motion. Lower and repeat smoothly.',
      },
      {
        slot: '03',
        name: 'KB Snatch',
        reps: '5 × 10',
        category: 'pull',
        met: 6.5,
        description:
          'KB between feet. Pull up in one motion, punch hand through overhead, lock out arm. Reverse to floor. Switch sides.',
      },
      {
        slot: '04',
        name: 'KB Clean',
        reps: '5 × 10',
        category: 'pull',
        met: 5.5,
        description:
          'KB between feet. Pull explosively to racked shoulder position, elbow tight to ribs. Lower to floor under control. Switch sides.',
      },
      {
        slot: '05',
        name: 'KB Snatches',
        reps: '5 × 50s',
        category: 'stamina',
        met: 6.5,
        description:
          'As Day 3 snatch but for time. Alternate sides every few reps, breath sharp, hips do the work — not the arm.',
      },
    ],
  },
};

export const bandLines: Record<Line, { name: string; subtitle: string; exercises: Exercise[] }> = {
  A: {
    name: 'RB Pressing',
    subtitle: 'Chest & shoulders',
    exercises: [
      {
        slot: '01',
        name: 'RB Chest Press',
        reps: '5 × 10',
        category: 'push',
        met: 4.0,
        description:
          'Anchor band behind you at chest height. Handles in hands, press forward until arms lock, return slowly with control.',
      },
      {
        slot: '02',
        name: 'RB Overhead Press',
        reps: '5 × 10',
        category: 'push',
        met: 4.0,
        description:
          'Stand on band centre, handles at shoulders. Press straight up, lock out overhead, lower under control.',
      },
      {
        slot: '03',
        name: 'RB Chest Fly',
        reps: '5 × 10',
        category: 'push',
        met: 3.5,
        description:
          'Anchor band behind at chest height. Arms wide, slight elbow bend. Bring hands together in front, control the stretch back.',
      },
      {
        slot: '04',
        name: 'RB Lateral Raise',
        reps: '5 × 10',
        category: 'push',
        met: 3.5,
        description:
          'Stand on band, handles at sides. Raise arms out to shoulder height, slight elbow bend, lower under control.',
      },
      {
        slot: '05',
        name: 'Banded High Knees',
        reps: '5 × 50s',
        category: 'stamina',
        met: 6.0,
        description:
          'Band above knees. Drive knees up alternately at pace, arms pumping, stay light on the balls of your feet.',
      },
    ],
  },
  B: {
    name: 'RB Pulling',
    subtitle: 'Back & biceps',
    exercises: [
      {
        slot: '01',
        name: 'RB Seated Row',
        reps: '5 × 10',
        category: 'pull',
        met: 4.5,
        description:
          'Sit, legs straight, band round feet. Pull handles to lower ribs, elbows tight, squeeze back. Release slow.',
      },
      {
        slot: '02',
        name: 'RB Bent-Over Row',
        reps: '5 × 10',
        category: 'pull',
        met: 4.5,
        description:
          'Stand on band, hinge at hips, flat back. Row handles to lower ribs, squeeze shoulder blades, lower slow.',
      },
      {
        slot: '03',
        name: 'RB Face Pull',
        reps: '5 × 10',
        category: 'pull',
        met: 3.5,
        description:
          'Anchor band at head height. Pull handles towards forehead, elbows flaring wide, thumbs pointing back. Pause, return slow.',
      },
      {
        slot: '04',
        name: 'RB Bicep Curl',
        reps: '5 × 10',
        category: 'pull',
        met: 3.0,
        description:
          'Stand on band, handles in hands, palms up. Curl to shoulders, elbows glued to ribs, lower slow with tension.',
      },
      {
        slot: '05',
        name: 'Banded Jumping Jacks',
        reps: '5 × 50s',
        category: 'stamina',
        met: 6.0,
        description:
          'Band above knees. Jump feet wide and narrow, arms swinging overhead. Keep band taut throughout, land softly.',
      },
    ],
  },
  C: {
    name: 'RB Legs',
    subtitle: 'Quads, hammies & glutes',
    exercises: [
      {
        slot: '01',
        name: 'RB Banded Squat',
        reps: '5 × 10',
        category: 'legs',
        met: 4.5,
        description:
          'Band above knees. Squat down, actively push knees out against band. Stand, keep tension throughout.',
      },
      {
        slot: '02',
        name: 'RB Banded Deadlift',
        reps: '5 × 10',
        category: 'legs',
        met: 4.5,
        description:
          'Stand on band, handles in hands. Hinge hips back, slight knee bend, drive through heels to stand tall, squeeze glutes.',
      },
      {
        slot: '03',
        name: 'RB Lateral Band Walk',
        reps: '5 × 10',
        category: 'legs',
        met: 4.0,
        description:
          'Band above knees, half-squat. Step sideways ten paces, keeping tension, return the other way. Chest up, feet parallel.',
      },
      {
        slot: '04',
        name: 'RB Glute Kickback',
        reps: '5 × 10',
        category: 'legs',
        met: 3.5,
        description:
          'Band around ankles, on all fours. Kick one leg straight back, squeeze glute, control return. Switch sides halfway.',
      },
      {
        slot: '05',
        name: 'Banded Skater Jumps',
        reps: '5 × 50s',
        category: 'stamina',
        met: 6.5,
        description:
          'Band above knees. Bound side to side, land soft on outside leg, tap opposite foot behind. Stay low.',
      },
    ],
  },
  D: {
    name: 'RB Power',
    subtitle: 'Full body & cardio',
    exercises: [
      {
        slot: '01',
        name: 'RB Thruster',
        reps: '5 × 10',
        category: 'legs',
        met: 5.0,
        description:
          'Stand on band, handles at shoulders. Squat deep, drive up and press overhead in one motion. Return, repeat.',
      },
      {
        slot: '02',
        name: 'RB Burpee',
        reps: '5 × 10',
        category: 'stamina',
        met: 8.0,
        description:
          'Loop band round shoulders and under feet. Drop to plank, jump feet in, stand, small hop. Repeat with band tension.',
      },
      {
        slot: '03',
        name: 'RB Clean and Press',
        reps: '5 × 10',
        category: 'push',
        met: 5.5,
        description:
          'Stand on band. Pull handles from hips to shoulders in one motion, press overhead, reverse under control.',
      },
      {
        slot: '04',
        name: 'RB Renegade Row',
        reps: '5 × 10',
        category: 'core',
        met: 5.0,
        description:
          'Plank position, one handle in each hand, band anchored ahead. Row one arm to ribs, alternate, hips stay square.',
      },
      {
      slot: '05',
      name: 'Banded Fast Punches',
      reps: '5 × 50s',
      category: 'stamina',
      met: 5.5,
      description:
        'Anchor band behind you. Handles at chest, punch forward alternating hands as fast as form allows. Rotate through hips.',
    },
    ],
  },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const LOCAL_KEY = (date: string, grouping: Grouping) => `fit50-workout-${date}-${grouping}`;

function loadWorkoutLocal(date: string, grouping: Grouping) {
  if (typeof window === 'undefined') return { line: 'A' as Line, sets: {} as Record<string, number> };
  try {
    // New key (with grouping) first.
    const raw = window.localStorage.getItem(LOCAL_KEY(date, grouping));
    if (raw) return JSON.parse(raw);
    // Backward-compat: fall back to old date-only key for users who
    // had data saved before the grouping key was added.
    const legacy = window.localStorage.getItem(`fit50-workout-${date}`);
    if (!legacy) return { line: 'A' as Line, sets: {} as Record<string, number> };
    return JSON.parse(legacy);
  } catch {
    return { line: 'A' as WorkoutKey, sets: {} as Record<string, number> };
  }
}

function saveWorkoutLocal(date: string, grouping: Grouping, data: { line: WorkoutKey; sets: Record<string, number> }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEY(date, grouping), JSON.stringify(data));
}

async function loadWorkoutRemote(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  date: string,
  grouping: Grouping
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('workout_log') as any)
    .select('line, sets')
    .eq('user_id', userId)
    .eq('date_key', date)
    .eq('grouping', grouping)
    .maybeSingle();
  if (error) {
    console.error('workout_log fetch failed:', error);
    return null;
  }
  if (!data) return null;
  return {
    line: data.line as WorkoutKey,
    // data.sets is a jsonb column — Supabase returns it as a parsed
    // object already.
    sets: (data.sets || {}) as Record<string, number>,
  };
}

async function saveWorkoutRemote(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  date: string,
  data: { line: WorkoutKey; sets: Record<string, number>; grouping: Grouping }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('workout_log') as any).upsert(
    {
      user_id: userId,
      date_key: date,
      line: data.line,
      grouping: data.grouping,
      sets: data.sets,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date_key,grouping' }
  );
  if (error) console.error('workout_log upsert failed:', error);
}

// Random-session persistence. Stored per-grouping so switching
// equipment doesn't clobber the random session ticks for another
// grouping. localStorage is enough for a single-day session; the
// randomise button can always be pressed again to roll a fresh one.
const RANDOM_SESSION_KEY = (date: string, grouping: Grouping) => `fit50-random-session-${date}-${grouping}`;

function loadRandomSessionLocal(date: string, grouping: Grouping): {
  exercises: Exercise[];
  ticks: Record<string, number>;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RANDOM_SESSION_KEY(date, grouping));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRandomSessionLocal(
  date: string,
  grouping: Grouping,
  data: { exercises: Exercise[]; ticks: Record<string, number> }
) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RANDOM_SESSION_KEY(date, grouping), JSON.stringify(data));
}

// Pull the user's last 5 days of workout_log rows and collect the
// exercise names that have a non-zero set count. Used by the
// randomise picker so the rolled session avoids exercises the user
// has done recently — they want variety, not a repeat. Excludes
// today's date so the user can still re-roll and get a fresh set
// even if their existing ticks for today are heavy on certain
// exercises.
async function loadRecentlyDoneRemote(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  daysBack: number
): Promise<Set<string>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffKey = `${cutoff.getFullYear()}-${String(
    cutoff.getMonth() + 1
  ).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const todayK = todayKey();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('workout_log') as any)
    .select('date_key, sets')
    .eq('user_id', userId)
    .gte('date_key', cutoffKey);
  if (error || !data) return new Set();
  const done = new Set<string>();
  for (const row of data as Array<{ date_key: string; sets: Record<string, number> | null }>) {
    // Skip today so the picker doesn't filter out an exercise the
    // user just ticked in the current line session.
    if (row.date_key === todayK) continue;
    const sets = row.sets || {};
    for (const [name, count] of Object.entries(sets)) {
      if (count > 0) done.add(name);
    }
  }
  return done;
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
  const { isPremium } = usePremium();
  const tracker = useTrackerState();
  const supabase = createClient();
  const [date, setDate] = useState<string>('');
  const [grouping, setGrouping] = useState<Grouping>('bodyweight');
  const [key, setKey] = useState<WorkoutKey>('A');
  // Per-grouping line. The save effect was previously saving the
  // single global `key` as the line ID for every grouping, which
  // meant switching to kettlebell and back to bodyweight silently
  // overwrote the bodyweight line ID. Track each grouping's line
  // separately so the workout_log row stays correct.
  const [lineByGrouping, setLineByGrouping] = useState<
    Record<Grouping, WorkoutKey>
  >({
    bodyweight: 'A',
    kettlebell: 'A',
    band: 'A',
  });
  // Today's steps entry + the kcal it contributes. Lives on the
  // daily_steps table so it survives across devices and feeds the
  // kcal balance in useFoodAnalytics. Weight is pulled from the
  // profile for the kcal preview — once the user has entered the
  // macro calculator, weight_kg is in their profile row.
  const [profileWeightKg, setProfileWeightKg] = useState<number>(0);
  useEffect(() => {
    if (!user || !supabase) return;
    let cancelled = false;
    // Read weight from macro_profile — that's where the macro
    // calculator writes it. profiles.weight_kg doesn't exist as a
    // column, so reading from there silently returned 0.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('macro_profile') as any)
      .select('weight_kg')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((res: { data: { weight_kg: number | null } | null; error: unknown }) => {
        if (cancelled || res.error) return;
        const w = Number(res.data?.weight_kg) || 0;
        setProfileWeightKg(w);
      });
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);
  const { steps, stepsExtraKcal, saveSteps, saveStepsForDate, history: stepsHistory, hydrated: stepsHydrated } = useDailySteps(
    date || null,
    profileWeightKg
  );
  // Manual save flow — the input drafts a string until the user
  // explicitly clicks Save, which avoids accidental write-amplification
  // (each keystroke today was firing an upsert).
  const [stepsDraft, setStepsDraft] = useState<string>('');
  // Brief "Saved ✓" indicator shown for 2s after a successful save so
  // the user gets confirmation the click landed. Without it, Save
  // re-renders into the same disabled state (stepsDraft now matches
  // String(steps)) and the user thinks nothing happened.
  const [stepsJustSaved, setStepsJustSaved] = useState(false);
  useEffect(() => {
    if (!stepsJustSaved) return;
    const t = setTimeout(() => setStepsJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [stepsJustSaved]);
  // Edit + add-past-day state. Only one row can be in edit mode at a
  // time; the "Add for past day" form is mutually exclusive with the
  // row-edit form so the user isn't juggling two open inputs.
  const [editingStepsDate, setEditingStepsDate] = useState<string | null>(null);
  const [editStepsDraft, setEditStepsDraft] = useState<string>('');
  const [addingPastDay, setAddingPastDay] = useState(false);
  const [pastDayDate, setPastDayDate] = useState<string>('');
  const [pastDayDraft, setPastDayDraft] = useState<string>('');
  // Keep the draft in sync when today's saved value changes (e.g.
  // hydration on first render).
  useEffect(() => {
    setStepsDraft(String(steps || ''));
  }, [steps]);
  // Unified per-grouping today's data. Replaces the previous `sets`
  // and `randomSessionTicks` state which were scoped to the active
  // grouping only — that's why switching tabs after tapping some
  // sets made the Done today panel seem to "lose" entries from the
  // groupings you weren't currently looking at. With the unified
  // state we hydrate all 3 groupings on mount, derive `sets` and
  // `randomSessionTicks` for the active group, and aggregate the
  // rest for the Done today panel.
  const [todaysByGrouping, setTodaysByGrouping] = useState<
    Record<
      Grouping,
      { line: Record<string, number>; random: Record<string, number> }
    >
  >({
    bodyweight: { line: {}, random: {} },
    kettlebell: { line: {}, random: {} },
    band: { line: {}, random: {} },
  });
  // Derived accessors for the active group so existing call sites
  // (which read `sets[name]` etc.) keep working unchanged.
  const sets = todaysByGrouping[grouping].line;
  const randomSessionTicks = todaysByGrouping[grouping].random;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // `hasLoaded` guards the save + rollover effects so they don't
  // run with the default state during the brief window between
  // mount and the load completion. Otherwise the save effect
  // fires once on mount with `sets: {}` and overwrites the
  // existing localStorage entry before the load has a chance to
  // read it — silently nuking the user's progress.
  const [hasLoaded, setHasLoaded] = useState(false);

  // Random-session state. The user can hit "Randomise" to roll a
  // 5-exercise session (one per movement category — push, pull,
  // legs, core, stamina) from any grouping / line / slot. The
  // exercises and per-exercise tick counts live here separately
  // from the line selector's `sets` dict, which is per-grouping
  // and gets replaced every time the user switches equipment. The
  // random session therefore can't live in `sets` (it'd get
  // clobbered) — it persists to its own localStorage key.
  const [randomSession, setRandomSession] = useState<Exercise[]>([]);
  // randomSessionTicks is derived from todaysByGrouping (above) — the
  // declared variable on line 898 — so no separate state needed.
  // Exercise names with a non-zero set count in the last 5 days
  // (excluding today). Used by the randomise picker so the user
  // doesn't get the same exercises back-to-back days in a row.
  const [recentlyDone, setRecentlyDone] = useState<Set<string>>(
    new Set()
  );

  // Persist grouping + key across sessions. Reload them on mount
  // so the user's last-selected equipment and line/day sticks.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('fit50-workout-selection');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          grouping?: Grouping;
          key?: WorkoutKey;
        };
        if (parsed.grouping && GROUPINGS.includes(parsed.grouping)) {
          setGrouping(parsed.grouping);
        }
        if (parsed.key) {
          setKey(parsed.key);
        }
      }
    } catch {
      // Ignore corrupt storage.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'fit50-workout-selection',
        JSON.stringify({ grouping, key })
      );
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [grouping, key]);

  useEffect(() => {
    const k = todayKey();
    setDate(k);
    // Load ALL groupings for today so the Done today panel can show
    // exercises completed via KB / band paths too — switching tabs
    // used to "lose" those entries because the load only fetched the
    // active grouping. Hydrate the unified `todaysByGrouping` map.
    //
    // Deps deliberately exclude `grouping`. Including `grouping`
    // here causes a race: switching the equipment tab re-runs this
    // load, the fresh fetch returns stale data (the save's upsert
    // for the just-ticked exercise hasn't landed on Supabase yet),
    // and `setTodaysByGrouping` overwrites the in-memory ticks the
    // user just made — they vanish from Done today. The grouping
    // tab handler reads `lineByGrouping` to set the line selector
    // for the new grouping, and `lineByGrouping` is already
    // populated by this load on initial mount, so we don't need to
    // refetch just to know the right line to show.
    if (user && supabase) {
      // Active-grouping line for the "back to row X" jump-back UX.
      loadWorkoutRemote(supabase, user.id, k, grouping)
        .then((active) => active ?? null)
        .then((active) => {
          // Fetch all groupings for today's projection in one query.
          return Promise.all([
            Promise.resolve(active),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from('workout_log') as any)
              .select('grouping, sets, line')
              .eq('user_id', user.id)
              .eq('date_key', k)
              .in('grouping', GROUPINGS as unknown as string[])
              .then((res: { data: Array<{ grouping: Grouping; sets: Record<string, number> | null; line: WorkoutKey | null }> | null; error: unknown }) => ({
                data: ((res.data || []) as Array<{
                  grouping: Grouping;
                  sets: Record<string, number> | null;
                  line: WorkoutKey | null;
                }>).map(
                  (r) => [r.grouping, r.sets || {}, (r.line || 'A') as WorkoutKey] as const
                ),
                error: res.error,
              })),
          ]);
        })
        .then(([active, remote]) => {
          const grouped: Record<
            Grouping,
            { line: Record<string, number>; random: Record<string, number> }
          > = Object.fromEntries(
            GROUPINGS.map((g) => [
              g,
              { line: {}, random: {} } as {
                line: Record<string, number>;
                random: Record<string, number>;
              },
            ])
          ) as Record<
            Grouping,
            { line: Record<string, number>; random: Record<string, number> }
          >;
          if (remote.data && remote.data.length > 0) {
            for (const [g, sets, remoteLine] of remote.data as Array<
              [Grouping, Record<string, number>, WorkoutKey]
            >) {
              // localStorage may have data the server doesn't yet
              // (the user clicked a tick before hydration completed
              // and the Supabase upsert hadn't landed yet). Local
              // wins on conflicts so the in-memory tick survives
              // hydration instead of being overwritten by stale
              // server data.
              const local = loadWorkoutLocal(k, g);
              const mergedSets: Record<string, number> = {
                ...sets,
                ...local.sets,
              };
              grouped[g] = { line: mergedSets, random: grouped[g].random };
              // Mirror to local so the next offline boot reads it
              // correctly. Uses the merged sets + the server-side
              // line ID (server is authoritative on which line the
              // user last used; local falls back if the server
              // never had the row).
              saveWorkoutLocal(k, g, {
                line: remoteLine ?? local.line,
                sets: mergedSets,
              });
              // Seed lineByGrouping from the server-side line ID
              // so the next save round-trips correctly.
              setLineByGrouping((prev) =>
                prev[g] === (remoteLine ?? local.line)
                  ? prev
                  : { ...prev, [g]: remoteLine ?? local.line }
              );
            }
          } else {
            // Either the fetch failed (remote.data === null) or it
            // succeeded with zero rows (remote.data === []). In
            // both cases the DB doesn't have anything for today,
            // so fall back to localStorage per grouping — the
            // empty-array path was previously truthy-checked and
            // silently overwrote the user's existing local data
            // with empty sets on every refresh.
            for (const g of GROUPINGS) {
              const local = loadWorkoutLocal(k, g);
              grouped[g] = { line: local.sets, random: grouped[g].random };
              setLineByGrouping((prev) =>
                prev[g] === local.line ? prev : { ...prev, [g]: local.line }
              );
            }
          }
          setTodaysByGrouping(grouped);
          if (active) {
            setKey(active.line);
            setLineByGrouping((prev) =>
              prev[grouping] === active.line
                ? prev
                : { ...prev, [grouping]: active.line }
            );
          }
          setHasLoaded(true);
        });
    } else {
      // Anon — assemble from localStorage only.
      const grouped = Object.fromEntries(
        GROUPINGS.map((g) => {
          const local = loadWorkoutLocal(k, g);
          return [g, { line: local.sets, random: {} as Record<string, number> }] as const;
        })
      ) as Record<Grouping, { line: Record<string, number>; random: Record<string, number> }>;
      setTodaysByGrouping(grouped);
      setHasLoaded(true);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!date) return;
    // Persist every grouping separately so the per-(user, date,
    // grouping) primary key on workout_log stays intact.
    //
    // Previously this effect had `!hasLoaded` gating, which
    // dropped user clicks that happened during the brief window
    // between mount and the hydration effect completing. On
    // mobile that window is long enough to be noticeable (slow
    // network + cold start). The fix: save localStorage
    // immediately on every state change, but skip empty groupings so
    // the initial mount doesn't clobber existing entries with
    // `{ line: {}, random: {} }`. Supabase still waits for
    // hydration so we don't upsert empty data on cold start.
    for (const [g, { line, random }] of Object.entries(todaysByGrouping)) {
      const hasAny = Object.keys(line).length > 0 || Object.keys(random).length > 0;
      if (!hasAny) continue;
      const mergedSets: Record<string, number> = { ...line };
      for (const [name, count] of Object.entries(random)) {
        // If the same exercise appears in both the line session and
        // a random session, take the higher count — the user
        // shouldn't double-count sets they've already done.
        mergedSets[name] = Math.max(mergedSets[name] || 0, count);
      }
      const groupingLine = lineByGrouping[g as Grouping] ?? key;
      saveWorkoutLocal(date, g as Grouping, { line: groupingLine, sets: mergedSets });
      if (hasLoaded && user && supabase) {
        saveWorkoutRemote(supabase, user.id, date, {
          line: groupingLine,
          sets: mergedSets,
          grouping: g as Grouping,
        });
      }
    }
  }, [date, key, lineByGrouping, todaysByGrouping, user, supabase, hasLoaded]);

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
        await saveWorkoutRemote(supabase, user.id, date, {
          line: key,
          sets,
          grouping,
        });
      } else {
        saveWorkoutLocal(date, grouping, { line: key, sets });
      }
      setDate(k);
      // Reset local state. The mount-effect will then load
      // whatever's in workout_log for the new date (almost always
      // empty for a fresh day, but a previously-saved session
      // would survive).
      // Reset the global line selector and per-grouping map to
      // 'A' so the new day starts from a clean slate. The next
      // mount-effect will repopulate lineByGrouping from whatever
      // workout_log says for each grouping.
      setKey('A');
      setLineByGrouping({ bodyweight: 'A', kettlebell: 'A', band: 'A' });
      // Clear all groupings — a fresh day starts at zero across the
      // board. The next mount-effect re-loads.
      setTodaysByGrouping({
        bodyweight: { line: {}, random: {} },
        kettlebell: { line: {}, random: {} },
        band: { line: {}, random: {} },
      });
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
  }, [date, key, sets, user, supabase]);

  // The exercise list for the active grouping+key. Stamina is
  // baked into each line as the last entry — no separate group.
  const exercises: Exercise[] = (() => {
    if (grouping === 'bodyweight')
      return workoutLines[key as Line]?.exercises ?? [];
    if (grouping === 'kettlebell')
      return kettlebellLines[key as Line]?.exercises ?? [];
    if (grouping === 'band')
      return bandLines[key as Line]?.exercises ?? [];
    return [];
  })();
  const totalCompleted = exercises.reduce((sum, ex) => sum + (sets[ex.name] || 0), 0);
  const allDone = exercises.every((ex) => (sets[ex.name] || 0) >= TOTAL_SETS);

  // Full exercise pool for the randomise picker. All groupings
  // × all lines × all slots, flattened.
  const allExercises: Exercise[] = (() => {
    const out: Exercise[] = [];
    const pushBw = (arr: Exercise[]) => arr.forEach((e) => out.push(e));
    pushBw(workoutLines.A.exercises);
    pushBw(workoutLines.B.exercises);
    pushBw(workoutLines.C.exercises);
    pushBw(workoutLines.D.exercises);
    for (const line of LINES) {
      pushBw(kettlebellLines[line]?.exercises ?? []);
      pushBw(bandLines[line]?.exercises ?? []);
    }
    return out;
  })();

  // Exercise pool scoped to the active grouping only. Used by
  // rollRandomSession so randomising only picks exercises from
  // the equipment the user has selected (KB / band / bodyweight).
  const allExercisesForGrouping: Exercise[] = (() => {
    const out: Exercise[] = [];
    const push = (arr: Exercise[]) => arr.forEach((e) => out.push(e));
    if (grouping === 'bodyweight') {
      push(workoutLines.A.exercises);
      push(workoutLines.B.exercises);
      push(workoutLines.C.exercises);
      push(workoutLines.D.exercises);
    } else if (grouping === 'kettlebell') {
      for (const line of LINES) push(kettlebellLines[line]?.exercises ?? []);
    } else if (grouping === 'band') {
      for (const line of LINES) push(bandLines[line]?.exercises ?? []);
    }
    return out;
  })();

  // Load the random session + recently-done set on mount + when
  // the date rolls over. Random-session state is keyed per-grouping
  // so switching equipment doesn't clobber another grouping's session.
  // The random-session list (the rolled exercises) is per-grouping;
  // we still load the active grouping's exercises on mount/rollover.
  // The tick counts ride on `todaysByGrouping[g].random` (shared
  // with the main load) so the Done today panel shows cross-grouping
  // ticks, but the LIST of rolled exercises is per-grouping (one
  // session at a time).
  useEffect(() => {
    if (!date) return;
    const local = loadRandomSessionLocal(date, grouping);
    if (local) {
      setRandomSession(local.exercises);
      // Restore tick counts into the unified state for this grouping.
      setTodaysByGrouping((prev) => ({
        ...prev,
        [grouping]: {
          ...prev[grouping],
          random: { ...prev[grouping].random, ...local.ticks },
        },
      }));
    }
    if (user && supabase) {
      loadRecentlyDoneRemote(supabase, user.id, 5).then(setRecentlyDone);
    }
  }, [date, user, supabase, grouping]);

  // Persist random-session state on every change. No debounce —
  // localStorage writes are cheap and the data is tiny.
  useEffect(() => {
    if (!date || randomSession.length === 0) return;
    saveRandomSessionLocal(date, grouping, {
      exercises: randomSession,
      ticks: randomSessionTicks,
    });
  }, [date, randomSession, randomSessionTicks, grouping]);

  // Roll a fresh 5-exercise session: one exercise per movement
  // category (push, pull, legs, core, stamina) from the ACTIVE
  // grouping only. Avoids any exercise the user has ticked in the
  // last 5 days. Falls back to the full active-grouping pool if
  // a category is wiped — so the user always gets 5 exercises.
  const rollRandomSession = () => {
    const categories: Exercise['category'][] = [
      'push',
      'pull',
      'legs',
      'core',
      'stamina',
    ];
    const picks: Exercise[] = [];
    for (const cat of categories) {
      const pool = allExercisesForGrouping.filter(
        (e) => e.category === cat && !recentlyDone.has(e.name)
      );
      const source =
        pool.length > 0
          ? pool
          : allExercisesForGrouping.filter((e) => e.category === cat);
      if (source.length === 0) continue;
      picks.push(source[Math.floor(Math.random() * source.length)]);
    }
    setRandomSession(picks);
    // Clear tick counts for this grouping's random session only —
    // the line workout's ticks remain untouched (separate storage).
    setTodaysByGrouping((prev) => ({
      ...prev,
      [grouping]: {
        ...prev[grouping],
        random: {},
      },
    }));
  };

  const cycleRandomSet = (name: string) => {
    setTodaysByGrouping((prev) => {
      const current = prev[grouping].random[name] || 0;
      // 0↔TOTAL_SETS toggle — same behaviour as cycleSet without
      // an index, so the Done today and random session panels share
      // the same "tap to add, tap again to delete" UX as the row UI.
      const next = current >= TOTAL_SETS ? 0 : TOTAL_SETS;
      return {
        ...prev,
        [grouping]: {
          ...prev[grouping],
          random: { ...prev[grouping].random, [name]: next },
        },
      };
    });
  };

  // Quick-add / quick-undo from the "Done today" panel. The
  // entry's grouping + source is looked up in `todaysProgress`
  // (populated from the unified `todaysByGrouping`), so a tick on
  // a kettlebell exercise routes to the kettlebell slot and a tick
  // on a bodyweight exercise routes to the bodyweight slot — even
  // when the user is viewing a different grouping right now.
  // Per-set cycle when `index` is provided, otherwise 0↔TOTAL_SETS
  // toggle for the "tap to add, tap again to delete" UX.
  const cycleTodayProgress = (name: string, index?: number) => {
    const entry = todaysProgress.find((e) => e.name === name);
    if (!entry) return;
    const { grouping: g, source } = entry;
    setTodaysByGrouping((prev) => {
      const current = prev[g][source][name] || 0;
      let next: number;
      if (typeof index === 'number') {
        next = index < current ? index : index + 1 > TOTAL_SETS ? TOTAL_SETS : index + 1;
      } else {
        next = current >= TOTAL_SETS ? 0 : TOTAL_SETS;
      }
      return {
        ...prev,
        [g]: {
          ...prev[g],
          [source]: { ...prev[g][source], [name]: next },
        },
      };
    });
  };

  // Combined "done today" view: aggregates line ticks + random
  // session ticks across ALL groupings. The previous version
  // only looked at the active grouping's `sets` and
  // `randomSessionTicks`, which meant switching tabs after
  // tapping some sets made the Done today panel seem to lose
  // those entries. Each entry also carries its grouping + source
  // so the toggle button knows where to write.
  const todaysProgress: Array<{
    name: string;
    count: number;
    grouping: Grouping;
    source: 'line' | 'random';
  }> = (() => {
    const out: typeof todaysProgress = [];
    for (const g of GROUPINGS) {
      const entry = todaysByGrouping[g];
      for (const [name, count] of Object.entries(entry.line)) {
        if (count > 0) out.push({ name, count, grouping: g, source: 'line' });
      }
      for (const [name, count] of Object.entries(entry.random)) {
        if (count > 0) out.push({ name, count, grouping: g, source: 'random' });
      }
    }
    // Dedupe by name — line session came first chronologically,
    // so an exercise completed via the line wins over a random
    // session tick for the same name.
    const seen = new Set<string>();
    return out
      .filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const cycleSet = (name: string, index?: number) => {
    // Tap on a specific tick: filled if index < current (untick down
    // to this position), empty if index >= current (tick up to
    // here). Sets must be ticked in order, so a tap at index 2
    // with current=0 marks sets 0,1,2 as ticked (count=3).
    // Tap on the exercise title (no index): 0↔TOTAL_SETS toggle — tap
    // empty tick to mark complete, tap filled tick to clear. This is
    // what the user wanted ("tap a tick to add tap it again to delete")
    // — single-tap complete / single-tap uncomplete — instead of the
    // multi-step per-set cycle that was confusing.
    if (typeof index === 'number') {
      setTodaysByGrouping((prev) => {
        const current = prev[grouping].line[name] || 0;
        const next =
          index < current ? index : index + 1 > TOTAL_SETS ? TOTAL_SETS : index + 1;
        return {
          ...prev,
          [grouping]: {
            ...prev[grouping],
            line: { ...prev[grouping].line, [name]: next },
          },
        };
      });
      return;
    }
    setTodaysByGrouping((prev) => {
      const current = prev[grouping].line[name] || 0;
      const next = current >= TOTAL_SETS ? 0 : TOTAL_SETS;
      return {
        ...prev,
        [grouping]: {
          ...prev[grouping],
          line: { ...prev[grouping].line, [name]: next },
        },
      };
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

  // Auto-tick Move Your Body when the user has 5 distinct
  // exercises at 5 sets each. Counts both the line workout and the
  // random session across ALL groupings (bodyweight + KB + RB), so
  // completing exercises in any equipment variant still triggers
  // the habit. Exercise names are globally unique across groupings
  // so there's no double-counting risk. Fires on every false→true
  // transition; if the user unticks the tile, the next time they
  // reach 5 exercises it'll re-fire.
  useEffect(() => {
    if (!hasLoaded || !user) return;
    const allCounts: number[] = [];
    for (const g of GROUPINGS) {
      const entry = todaysByGrouping[g];
      for (const count of Object.values(entry.line)) allCounts.push(count);
      for (const count of Object.values(entry.random)) allCounts.push(count);
    }
    const distinctComplete = allCounts.filter((n) => n >= TOTAL_SETS).length;
    if (
      distinctComplete >= 5 &&
      !tracker.todayTaps['move-body']
    ) {
      tracker.toggleHabit('move-body');
      window.dispatchEvent(
        new CustomEvent('fit50:auto-tick', {
          detail: { kind: 'move-body' },
        })
      );
    }
    // Watch the merged distinct-complete count instead of the raw
    // `todaysByGrouping` reference so re-evaluations only fire when
    // the number actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    todaysProgress.filter((p) => p.count >= TOTAL_SETS).length,
    hasLoaded,
    user,
    tracker,
  ]);

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
          Pick a row, do the exercises, tap a bicep for each set you finish.
          Sets cap at 5 so you don&apos;t forget where you got to mid-workout.
          {allDone && (
            <span className="block mt-3 text-teal font-medium">
              ✓ Row {key} complete for today. Move on, or go again tomorrow.
            </span>
          )}
        </p>

        {/* Download the workout PDF — free for signed-in users */}
        <a
          href="/api/download/workout"
          download="FIT50_Bodyweight_Four.pdf"
          className="inline-flex items-center gap-2 mb-6 font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
        >
          Download the Bodyweight Four →
        </a>

        {/* Today's progress — every exercise (line + random) that has
            at least one set ticked today. Pinned to the top of the
            workouts section so the user can see what they've done
            when mixing-and-matching line + random sessions. Free +
            premium — it's the same data the streak uses. */}
        {todaysProgress.length > 0 && (
          <div className="mb-6 border border-teal/30 bg-teal/5 p-4">
            <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
              <span className="font-body text-caption uppercase tracking-widest text-teal">
                Done today
              </span>
              <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                {todaysProgress.length}{' '}
                {todaysProgress.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </div>
            <ul className="space-y-2">
              {todaysProgress.map(({ name, count }) => {
                const complete = count >= TOTAL_SETS;
                return (
                  <li
                    key={name}
                    className="flex items-center gap-2 font-body text-sm"
                  >
                    <span
                      className={`truncate min-w-0 flex-1 ${
                        complete ? 'text-teal' : 'text-ink/70'
                      }`}
                    >
                      {name}
                    </span>
                    {/* Same 5-tick-box UI as the today's-session
                        panel — tap any box to cycle sets for the
                        exercise. Routes to the line `sets` dict or
                        the random-session tick dict based on which
                        pool the exercise lives in. */}
                    <span className="flex gap-1 shrink-0">
                      {Array.from({ length: TOTAL_SETS }).map((_, j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => cycleTodayProgress(name, j)}
                          aria-label={
                            j < count
                              ? `${name}: set ${j + 1} ticked — tap to untick`
                              : `${name}: set ${j + 1} empty — tap to tick`
                          }
                          className="min-w-[28px] min-h-[28px] flex items-center justify-center"
                        >
                          <TickBox filled={j < count} size={20} />
                        </button>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Randomise — roll a fresh 5-exercise session: one per
            movement category (push, pull, legs, core, stamina),
            pulling from any grouping × line × slot. Filters out
            exercises the user has ticked in the last 5 days so
            they don't get the same workout two days in a row.
            Available to free + premium — it's just a different way
            to land on the same 5×10 reps structure. */}
        <div className="mb-6 border border-ink/15 bg-paper p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
            <span className="font-body text-caption uppercase tracking-widest text-ink/50">
              Today's session
            </span>
            <button
              type="button"
              onClick={rollRandomSession}
              className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
            >
              {randomSession.length === 0 ? 'Randomise →' : 'Re-roll →'}
            </button>
          </div>
          {randomSession.length === 0 ? (
            <p className="font-body text-sm text-ink/50">
              Hit randomise for a 5-exercise session — one push, one
              pull, one legs, one core, one stamina, each from a
              different exercise you haven't done in the last 5
              days.
            </p>
          ) : (
            <ul className="space-y-2">
              {randomSession.map((ex) => {
                const done = randomSessionTicks[ex.name] || 0;
                const complete = done >= TOTAL_SETS;
                return (
                  <li
                    key={ex.name}
                    className={`w-full px-3 py-2 border ${
                      complete
                        ? 'border-teal/40 bg-teal/5'
                        : 'border-ink/15'
                    }`}
                  >
                    {/* On mobile (stacked): category + name + reps
                        sit on row 1, tick boxes + count sit on row
                        2. On desktop (sm+): everything fits on a
                        single row. The category column is wide
                        enough on desktop (w-16 = 64px) for
                        'stamina' — the longest category label —
                        with tracking-widest applied, otherwise it
                        bleeds into the exercise name. */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
                        <span className="font-body text-caption uppercase tracking-widest text-ink/40 w-16 shrink-0">
                          {ex.category}
                        </span>
                        <span
                          className={`flex-1 min-w-0 truncate font-body text-sm ${
                            complete ? 'text-teal' : 'text-ink'
                          }`}
                        >
                          {ex.name}
                        </span>
                        <span className="hidden sm:inline font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
                          {ex.reps}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 self-end sm:self-auto">
                        <span className="flex gap-1 shrink-0">
                          {Array.from({ length: TOTAL_SETS }).map((_, j) => (
                            <button
                              key={j}
                              type="button"
                              onClick={() => cycleRandomSet(ex.name)}
                              aria-label={
                                j < done
                                  ? `Set ${j + 1} ticked — tap to untick`
                                  : `Set ${j + 1} empty — tap to tick`
                              }
                              className="min-w-[28px] min-h-[28px] flex items-center justify-center"
                            >
                              <TickBox filled={j < done} size={20} />
                            </button>
                          ))}
                        </span>
                        <button
                          type="button"
                          onClick={() => cycleRandomSet(ex.name)}
                          aria-label={`${ex.name}: ${done} of ${TOTAL_SETS} sets done — tap to add another set`}
                          className={`shrink-0 px-2 py-0.5 border font-body text-caption uppercase tracking-widest tabular-nums transition-colors ${
                            complete
                              ? 'border-teal text-teal bg-teal/10'
                              : 'border-ink/20 text-ink/40 hover:border-ink/40 hover:text-ink/70'
                          }`}
                        >
                          {done}/{TOTAL_SETS}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Grouping tabs — Bodyweight is the free taster. Kettlebell
            and Resistance band are premium and unlock the full
            multi-day programs. */}
        <div className="mb-4 border border-ink/15 bg-cre-30 p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
            <span className="font-body text-caption uppercase tracking-widest text-ink/50">
              Equipment
            </span>
            {!isPremium && (
              <a
                href="/upgrade"
                className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85"
              >
                Unlock with premium →
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {GROUPINGS.map((g) => {
              const isLocked = g !== 'bodyweight' && !isPremium;
              const active = g === grouping;
              return (
                <button
                  key={g}
                  type="button"
                  // Gate the click: free users see the locked tab
                  // and 🔒 icon but the onClick short-circuits so
                  // they can't switch into KB / band. (Previously
                  // the onClick ran regardless of premium status
                  // and free users could tick KB / band exercises,
                  // which the rest of the UI surface thought was
                  // gated.)
                  onClick={() => {
                    if (isLocked) return;
                    setGrouping(g);
                    // Show the line the user last used for this
                    // grouping (loaded from server / localStorage),
                    // not the global `key` — otherwise switching to
                    // kettlebell and back to bodyweight would clobber
                    // the bodyweight line ID with whatever the
                    // user last picked in kettlebell.
                    setKey(lineByGrouping[g]);
                    setActiveIdx(null);
                  }}
                  disabled={isLocked}
                  aria-pressed={active}
                  className={`px-3 py-2 border font-body text-caption uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-coral bg-coral text-paper'
                      : isLocked
                      ? 'border-ink/20 text-ink/30 cursor-not-allowed'
                      : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {g === 'bodyweight' ? 'Bodyweight' : g === 'kettlebell' ? 'Kettlebell' : 'Resistance band'}
                  {isLocked && ' 🔒'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-selector: A/B/C/D. Each line has 4 mains + 1 stamina
            finisher (the 5th entry), no separate Stamina tab. */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {LINES.map((l) => {
            const active = l === key;
            const label = (() => {
              if (grouping === 'bodyweight') return workoutLines[l].name;
              if (grouping === 'kettlebell')
                return kettlebellLines[l]?.name ?? '';
              if (grouping === 'band')
                return bandLines[l]?.name ?? '';
              return '';
            })();
            return (
              <button
                key={l}
                onClick={() => {
                  setKey(l);
                  // Remember this line for the active grouping so the
                  // next save round-trips it correctly to workout_log.
                  setLineByGrouping((prev) =>
                    prev[grouping] === l ? prev : { ...prev, [grouping]: l }
                  );
                  setActiveIdx(null);
                }}
                className={`px-3 py-3 border font-body text-caption uppercase tracking-widest transition-colors ${
                  active
                    ? 'border-coral text-coral bg-coral/5'
                    : 'border-ink/20 text-ink/70 hover:border-ink/40'
                }`}
              >
                <span className="font-display text-h3 block leading-none mb-1">{l}</span>
                <span className="block text-[10px] leading-tight opacity-80 truncate">
                  {label}
                </span>
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
                  {/*
                   * Row layout — stacked on mobile so the KB / RB
                   * brand chip and the exercise name each get their
                   * own line, then the controls on a third line. On
                   * desktop it's a single row. The brand chip is the
                   * first thing KB / RB users see on a phone — the
                   * full name shows when there's room. Bodyweight
                   * exercises (no brand prefix) render normally.
                   */}
                  {(() => {
                    return (
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveIdx(i)}
                          className="font-body text-base text-ink md:flex-1 md:min-w-0 text-left hover:text-coral transition-colors flex items-center gap-2 self-start"
                        >
                          {/* Always render the full exercise name.
                              Earlier we hid the full name behind a
                              'KB' / 'RB' chip on mobile so the row
                              would fit a narrow viewport, but that
                              left users unable to tell which
                              kettlebell or band exercise was which
                              — the names themselves include the
                              'KB ' / 'RB ' prefix and read fine on
                              a phone. */}
                          <span className="truncate">{ex.name}</span>
                        </button>
                        <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0 hidden sm:inline">
                          {ex.reps}
                        </span>
                        <div className="flex items-center gap-2 self-end md:self-auto md:ml-auto">
                          <span className="flex gap-1 shrink-0">
                            {Array.from({ length: TOTAL_SETS }).map((_, j) => (
                              <button
                                key={j}
                                type="button"
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
                          <span
                            className={`font-body text-caption uppercase tracking-widest tabular-nums shrink-0 ml-2 ${
                              complete ? 'text-teal' : 'text-ink/40'
                            }`}
                          >
                            {done}/{TOTAL_SETS}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
              ← Back to row {key}
            </button>

            <div className="border border-ink/15 p-5 md:p-6">
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                {(() => {
                  const ex0 = exercises[activeIdx];
                  return (
                    <>
                      <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                        {ex0.reps}
                      </span>
                    </>
                  );
                })()}
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
                        onClick={() => cycleSet(exercises[activeIdx].name, j)}
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

      {/* Daily steps — manual save + record of the 50 days. The 10k
          baseline is already baked into TDEE via ACTIVITY_MULTIPLIER,
          so only the excess over 10k counts as additional burn.
          Reads the saved value from useDailySteps; the draft is a
          separate string so each keystroke doesn't trigger an upsert.
          Below the input is a 50-day record pulled from daily_steps
          so the user can see their history at a glance. */}
      <div className="mb-6 border border-ink/15 bg-cre-30 p-4">
        <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
          <span className="font-body text-caption uppercase tracking-widest text-ink/60">
            Total steps today
          </span>
          {stepsExtraKcal > 0 ? (
            <span className="font-body text-caption uppercase tracking-widest text-coral font-medium tabular-nums">
              +{stepsExtraKcal} kcal extra burn
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99999}
            step={100}
            disabled={!stepsHydrated}
            value={stepsDraft}
            onChange={(e) =>
              // Strip commas so '12,500' parses as 12500 on some
              // browsers/locales that accept thousand separators in
              // number inputs.
              setStepsDraft(e.target.value.replace(/,/g, ''))
            }
            placeholder="0"
            aria-label="Total steps today"
            className="flex-1 min-w-0 px-3 py-2 bg-paper border border-ink/20 font-body focus:border-ink outline-none text-base tabular-nums"
          />
          <span className="font-body text-caption uppercase tracking-widest text-ink/50 shrink-0">
            steps
          </span>
          <button
            type="button"
            onClick={() => {
              const n = Number(stepsDraft);
              if (Number.isFinite(n) && n >= 0) {
                saveSteps(n).then(() => setStepsJustSaved(true));
              }
            }}
            disabled={!stepsHydrated}
            className="font-body text-caption uppercase tracking-widest bg-ink text-paper px-4 py-2 hover:bg-ink/85 transition-colors disabled:opacity-40"
          >
            Save
          </button>
          {stepsJustSaved && (
            <span
              aria-live="polite"
              className="font-body text-caption uppercase tracking-widest text-teal"
            >
              ✓ Saved
            </span>
          )}
        </div>

        {/* Counter-balance callout — only when over the 10k baseline.
            This is the part that used to be confusing. "Extra burn"
            is half the story; the other half is that the user has to
            actually eat those kcal or their body will pull from muscle.
            The macro target is already inflated by the extra burn
            (see useFoodAnalytics → daily_steps join), so this card is
            just a nudge: "your target includes +N kcal — don't skip
            the snack." The numbers match the kcal balance surface. */}
        {stepsExtraKcal > 0 ? (
          <div className="mt-3 border border-coral/40 bg-coral/5 p-3">
            <p className="font-body text-caption uppercase tracking-widest text-coral font-medium mb-1">
              Eat an extra {stepsExtraKcal} kcal today
            </p>
            <p className="font-body text-sm text-ink/70 leading-snug">
              {steps - 10000} steps over the 10k baseline = +{stepsExtraKcal} kcal
              {' '}of extra burn on top of your normal target. Your macro target
              already includes those {stepsExtraKcal} kcal — skip the snack
              and your body eats muscle with the fat.
            </p>
          </div>
        ) : steps > 0 ? (
          <p className="font-body text-caption text-ink/50 mt-2">
            Under the 10k baseline — no extra burn, your normal target
            covers it. Log the total so we have the full picture.
          </p>
        ) : null}

        {/* Record of the 50 days — new entries first, kcal contribution
            alongside so the user can see when they've gone over the
            10k baseline. */}
        {stepsHistory.length > 0 && (
          <div className="mt-4 border-t border-ink/10 pt-3">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="font-body text-caption uppercase tracking-widest text-ink/60">
                Record of the 50 days
              </span>
              <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                {stepsHistory.length} {stepsHistory.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <ul className="divide-y divide-ink/10">
              {stepsHistory.map((h) => {
                const isEditing = editingStepsDate === h.date;
                const edited = Number(editStepsDraft);
                const dirty =
                  isEditing &&
                  Number.isFinite(edited) &&
                  edited >= 0 &&
                  edited !== h.steps;
                if (isEditing) {
                  return (
                    <li
                      key={h.date}
                      className="flex flex-wrap items-center gap-2 py-2 font-body text-sm"
                    >
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99999}
                        step={100}
                        value={editStepsDraft}
                        onChange={(e) =>
                          setEditStepsDraft(
                            e.target.value.replace(/,/g, '')
                          )
                        }
                        aria-label={`Edit steps for ${h.date}`}
                        className="flex-1 min-w-0 px-2 py-1 bg-paper border border-ink/30 font-body focus:border-ink outline-none text-base tabular-nums"
                      />
                      <span className="font-body text-caption uppercase tracking-widest text-ink/50 shrink-0">
                        steps
                      </span>
                      <span className="font-body text-caption uppercase tracking-widest text-ink/50 tabular-nums shrink-0">
                        {h.date}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveStepsForDate(h.date, edited);
                          setEditingStepsDate(null);
                          setEditStepsDraft('');
                        }}
                        disabled={!dirty}
                        className="font-body text-caption uppercase tracking-widest bg-ink text-paper px-3 py-1 hover:bg-ink/85 transition-colors disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStepsDate(null);
                          setEditStepsDraft('');
                        }}
                        className="font-body text-caption uppercase tracking-widest text-ink/50 hover:text-ink px-2 py-1"
                      >
                        Cancel
                      </button>
                    </li>
                  );
                }
                return (
                  <li
                    key={h.date}
                    className="flex items-center gap-2 py-2 font-body text-sm"
                  >
                    <span className="font-display text-base tabular-nums text-ink">
                      {h.steps.toLocaleString()}
                    </span>
                    <span className="font-body text-caption uppercase tracking-widest text-ink/50 tabular-nums">
                      {h.date}
                    </span>
                    <span
                      className={`font-body text-caption tabular-nums ${
                        h.extraKcal > 0 ? 'text-coral font-medium' : 'text-ink/40'
                      }`}
                    >
                      {h.extraKcal > 0 ? `+${h.extraKcal} kcal` : '—'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStepsDate(h.date);
                        setEditStepsDraft(String(h.steps));
                        setAddingPastDay(false);
                      }}
                      aria-label={`Edit steps for ${h.date}`}
                      className="ml-auto shrink-0 font-body text-caption uppercase tracking-widest text-ink/40 hover:text-ink px-1"
                    >
                      Edit
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Add steps for a past day — the user forgot to log, but they
            have a record of it (e.g. their phone shows the step count).
            Mutually exclusive with row-edit mode so only one form is
            open at a time. */}
        {addingPastDay ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
            <label className="font-body text-caption uppercase tracking-widest text-ink/50 shrink-0">
              Date
            </label>
            <input
              type="date"
              value={pastDayDate}
              max={date || undefined}
              onChange={(e) => setPastDayDate(e.target.value)}
              aria-label="Past day date"
              className="px-2 py-1 bg-paper border border-ink/30 font-body focus:border-ink outline-none text-base"
            />
            <label className="font-body text-caption uppercase tracking-widest text-ink/50 shrink-0">
              Steps
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={99999}
              step={100}
              value={pastDayDraft}
              onChange={(e) =>
                setPastDayDraft(e.target.value.replace(/,/g, ''))
              }
              placeholder="e.g. 12,500"
              aria-label="Past day steps"
              className="w-28 px-2 py-1 bg-paper border border-ink/30 font-body focus:border-ink outline-none text-base tabular-nums"
            />
            <button
              type="button"
              onClick={async () => {
                if (!pastDayDate) return;
                const n = Number(pastDayDraft);
                if (!Number.isFinite(n) || n < 0) return;
                await saveStepsForDate(pastDayDate, n);
                setAddingPastDay(false);
                setPastDayDate('');
                setPastDayDraft('');
              }}
              disabled={
                !pastDayDate ||
                !pastDayDraft ||
                !Number.isFinite(Number(pastDayDraft)) ||
                Number(pastDayDraft) < 0
              }
              className="font-body text-caption uppercase tracking-widest bg-ink text-paper px-3 py-1 hover:bg-ink/85 transition-colors disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingPastDay(false);
                setPastDayDate('');
                setPastDayDraft('');
              }}
              className="font-body text-caption uppercase tracking-widest text-ink/50 hover:text-ink px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Default to yesterday — the most common "I forgot
              // to log" case. Date input clamps to today via max=.
              const d = new Date();
              d.setDate(d.getDate() - 1);
              const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              setPastDayDate(y);
              setAddingPastDay(true);
              setEditingStepsDate(null);
            }}
            className="mt-3 font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85"
          >
            + Add for past day
          </button>
        )}
      </div>
    </Section>
  );
}
