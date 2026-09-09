'use client';

import { useEffect, useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/hooks/usePremium';
import { useTrackerState } from '@/hooks/useTrackerState';
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
const GROUPINGS = ['bodyweight', 'kettlebell', 'band'] as const;
type Grouping = (typeof GROUPINGS)[number];
const STAMINA_KEY = 'S';
type WorkoutKey = Line | typeof STAMINA_KEY;

// Premium-only equipment programs. Each grouping (kettlebell,
// resistance band) has 5 lines — A/B/C/D + a Stamina line — themed
// around the user's content (5-day cycles, one main exercise per
// category per day, plus stamina). Lines have varying counts
// because core moves get distributed by theme into the matching
// push / pull / legs / full-body line.
// Bodyweight keeps its current 4-line A/B/C/D structure (the
// free-tier taster); the new equipment programs sit alongside it.
const kettlebellLines: Record<Line, Exercise[]> = {
  A: [
    {
      slot: '01',
      name: 'KB Floor Press',
      reps: '5 × 10',
      description:
        'Lie on your back with a kettlebell in each hand at shoulder height. Press straight up until your arms lock, lower under control. Switch sides halfway through each set so each arm gets the same volume.',
    },
    {
      slot: '02',
      name: 'KB Strict Press',
      reps: '5 × 10',
      description:
        'KB racked at shoulder height, elbows tucked. Press straight overhead without leaning back. Lower under control to the shoulder. Keep your ribs down — don\'t flare your lower back.',
    },
    {
      slot: '03',
      name: 'KB Push Press',
      reps: '5 × 10',
      description:
        'KB racked at shoulder. Small dip through knees, drive up hard, press overhead using leg drive. Lower controlled. Switch sides.',
    },
    {
      slot: '04',
      name: 'KB Bottom-Up Press',
      reps: '5 × 10',
      description:
        'KB inverted, bell above hand, gripped hard at shoulder. Press overhead keeping bell balanced. Lower slow. Switch sides.',
    },
    {
      slot: '05',
      name: 'KB Z Press',
      reps: '5 × 10',
      description:
        'Sit on floor, legs straight in front. KB racked at shoulder. Press overhead without leaning back. Lower slow. Switch sides.',
    },
    {
      slot: '06',
      name: 'KB Halo',
      reps: '5 × 10',
      description:
        'KB held by the horns at chest height. Circle it around your head, close to your skull. Brace your core, no leaning. Alternate direction each rep.',
    },
    {
      slot: '07',
      name: 'KB Windmill',
      reps: '5 × 10',
      description:
        'KB pressed overhead, feet wide, opposite foot turned out. Hinge sideways to touch floor, eyes on KB. Reverse slow. Switch sides.',
    },
  ],
  B: [
    {
      slot: '01',
      name: 'KB Bent-Over Row',
      reps: '5 × 10',
      description:
        'Hinge hips back, flat back, KB hanging one hand. Row to hip, squeeze shoulder blade, lower slow. Switch sides halfway.',
    },
    {
      slot: '02',
      name: 'KB Single-Arm Row',
      reps: '5 × 10',
      description:
        'Split stance, hand on knee for support. Row KB to hip, elbow tight, squeeze back. Lower slow. Switch sides.',
    },
    {
      slot: '03',
      name: 'KB High Pull',
      reps: '5 × 10',
      description:
        'KB between feet, hinge down. Explosively pull up to chin, elbows high and wide. Reverse under control to start.',
    },
    {
      slot: '04',
      name: 'KB Renegade Row',
      reps: '5 × 10',
      description:
        'Plank on two KBs, feet wide. Row one KB to hip, hips square, alternate arms each rep. Core braced throughout.',
    },
    {
      slot: '05',
      name: 'KB Gorilla Row',
      reps: '5 × 10',
      description:
        'Two KBs between feet, wide sumo stance, hinge down. Row one KB to hip while other rests, alternate arms each rep.',
    },
  ],
  C: [
    {
      slot: '01',
      name: 'KB Goblet Squat',
      reps: '5 × 10',
      description:
        'Hold KB at chest, elbows tucked. Squat until thighs parallel or lower, chest up. Drive through heels to stand.',
    },
    {
      slot: '02',
      name: 'KB Romanian Deadlift',
      reps: '5 × 10',
      description:
        'KB in both hands. Push hips back, slight knee bend, KB slides down shins. Squeeze glutes to stand tall.',
    },
    {
      slot: '03',
      name: 'KB Reverse Lunge',
      reps: '5 × 10',
      description:
        'Hold KB goblet at chest. Step back, drop back knee toward floor, drive front heel to return. Alternate legs each rep.',
    },
    {
      slot: '04',
      name: 'KB Front Squat',
      reps: '5 × 10',
      description:
        'KB in racked position at shoulder, elbow tucked. Squat deep, chest tall, drive through heels to stand. Switch sides halfway.',
    },
    {
      slot: '05',
      name: 'KB Cossack Squat',
      reps: '5 × 10',
      description:
        'KB goblet at chest, wide stance. Shift weight fully into one leg, squat deep, other leg straight. Return, switch sides.',
    },
    {
      slot: '06',
      name: 'KB Russian Twist',
      reps: '5 × 10',
      description:
        'Sit, feet raised, KB at chest. Rotate torso, tap KB beside hip. Alternate sides, keep chest tall and lifted.',
    },
    {
      slot: '07',
      name: 'KB Sit-Up',
      reps: '5 × 10',
      description:
        'Lie down, KB pressed above chest, arms locked. Sit up keeping KB overhead, lower slow. Core does the work, not arms.',
    },
    {
      slot: '08',
      name: 'KB Half Get-Up',
      reps: '5 × 10',
      description:
        'Lie down, KB pressed overhead one arm. Roll to elbow, then hand, hip up off floor. Reverse slow. Switch sides.',
    },
  ],
  D: [
    {
      slot: '01',
      name: 'KB Clean and Press',
      reps: '5 × 10',
      description:
        'KB between feet. Pull up to racked shoulder position, press overhead, reverse to floor. Switch sides halfway.',
    },
    {
      slot: '02',
      name: 'KB Thruster',
      reps: '5 × 10',
      description:
        'KB goblet at chest. Squat deep, then drive up and press KB overhead in one motion. Lower and repeat smoothly.',
    },
    {
      slot: '03',
      name: 'KB Snatch',
      reps: '5 × 10',
      description:
        'KB between feet. Pull up in one motion, punch hand through overhead, lock out arm. Reverse to floor. Switch sides.',
    },
    {
      slot: '04',
      name: 'KB Burpee Deadlift',
      reps: '5 × 10',
      description:
        'KB on floor. Squat, jump feet back to plank, jump feet in, deadlift KB to standing. Reset and repeat.',
    },
    {
      slot: '05',
      name: 'KB Clean',
      reps: '5 × 10',
      description:
        'KB between feet. Pull explosively to racked shoulder position, elbow tight to ribs. Lower to floor under control. Switch sides.',
    },
  ],
};

const kettlebellStamina: Exercise[] = [
  {
    slot: '01',
    name: 'KB Swings',
    reps: '5 × 50s',
    description:
      'Hinge hips back, KB between legs. Snap hips forward, KB floats to chest height. Not a squat, not a lift.',
  },
  {
    slot: '02',
    name: 'KB Goblet Squat Pulses',
    reps: '5 × 50s',
    description:
      'Hold KB at chest, squat to parallel and pulse in the bottom third. Chest up, breath steady.',
  },
  {
    slot: '03',
    name: 'KB Farmer\'s Carry',
    reps: '5 × 50s',
    description:
      'One heavy KB per side, or one loaded. Walk with tall posture, ribs down, crushing grip. Turn, return.',
  },
  {
    slot: '04',
    name: 'KB Snatches',
    reps: '5 × 50s',
    description:
      'As Day 3 snatch but for time. Alternate sides every few reps, breath sharp, hips do the work — not the arm.',
  },
];

const bandLines: Record<Line, Exercise[]> = {
  A: [
    {
      slot: '01',
      name: 'RB Chest Press',
      reps: '5 × 10',
      description:
        'Anchor band behind you at chest height. Handles in hands, press forward until arms lock, return slowly with control.',
    },
    {
      slot: '02',
      name: 'RB Overhead Press',
      reps: '5 × 10',
      description:
        'Stand on band centre, handles at shoulders. Press straight up, lock out overhead, lower under control.',
    },
    {
      slot: '03',
      name: 'RB Chest Fly',
      reps: '5 × 10',
      description:
        'Anchor band behind at chest height. Arms wide, slight elbow bend. Bring hands together in front, control the stretch back.',
    },
    {
      slot: '04',
      name: 'RB Tricep Pushdown',
      reps: '5 × 10',
      description:
        'Anchor band high. Elbows pinned to sides, push handles straight down until arms lock, control the return.',
    },
    {
      slot: '05',
      name: 'RB Lateral Raise',
      reps: '5 × 10',
      description:
        'Stand on band, handles at sides. Raise arms out to shoulder height, slight elbow bend, lower under control.',
    },
    {
      slot: '06',
      name: 'RB Pallof Press',
      reps: '5 × 10',
      description:
        'Anchor band chest-height, side-on. Hands at sternum, press straight out, resist twist, return slow. Switch sides halfway.',
    },
  ],
  B: [
    {
      slot: '01',
      name: 'RB Seated Row',
      reps: '5 × 10',
      description:
        'Sit, legs straight, band round feet. Pull handles to lower ribs, elbows tight, squeeze back. Release slow.',
    },
    {
      slot: '02',
      name: 'RB Bent-Over Row',
      reps: '5 × 10',
      description:
        'Stand on band, hinge at hips, flat back. Row handles to lower ribs, squeeze shoulder blades, lower slow.',
    },
    {
      slot: '03',
      name: 'RB Face Pull',
      reps: '5 × 10',
      description:
        'Anchor band at head height. Pull handles towards forehead, elbows flaring wide, thumbs pointing back. Pause, return slow.',
    },
    {
      slot: '04',
      name: 'RB Bicep Curl',
      reps: '5 × 10',
      description:
        'Stand on band, handles in hands, palms up. Curl to shoulders, elbows glued to ribs, lower slow with tension.',
    },
    {
      slot: '05',
      name: 'RB Lat Pulldown',
      reps: '5 × 10',
      description:
        'Anchor band high overhead, kneel. Grip handles wide, pull down to collarbones, elbows drive to ribs. Return slow.',
    },
  ],
  C: [
    {
      slot: '01',
      name: 'RB Banded Squat',
      reps: '5 × 10',
      description:
        'Band above knees. Squat down, actively push knees out against band. Stand, keep tension throughout.',
    },
    {
      slot: '02',
      name: 'RB Banded Deadlift',
      reps: '5 × 10',
      description:
        'Stand on band, handles in hands. Hinge hips back, slight knee bend, drive through heels to stand tall, squeeze glutes.',
    },
    {
      slot: '03',
      name: 'RB Lateral Band Walk',
      reps: '5 × 10',
      description:
        'Band above knees, half-squat. Step sideways ten paces, keeping tension, return the other way. Chest up, feet parallel.',
    },
    {
      slot: '04',
      name: 'RB Glute Kickback',
      reps: '5 × 10',
      description:
        'Band around ankles, on all fours. Kick one leg straight back, squeeze glute, control return. Switch sides halfway.',
    },
    {
      slot: '05',
      name: 'RB Hip Thrust',
      reps: '5 × 10',
      description:
        'Sit against a wall or bench, band across hips, feet planted. Drive hips up, squeeze glutes at top, lower slow.',
    },
    {
      slot: '06',
      name: 'RB Dead Bug',
      reps: '5 × 10',
      description:
        'Band anchored overhead, hold taut, lie down. Extend opposite leg out, keep low back pressed to floor. Switch each rep.',
    },
    {
      slot: '07',
      name: 'RB Russian Twist',
      reps: '5 × 10',
      description:
        'Sit, feet raised, band anchored side-on, hands together. Rotate torso away from anchor, control back. Alternate sides each rep.',
    },
  ],
  D: [
    {
      slot: '01',
      name: 'RB Thruster',
      reps: '5 × 10',
      description:
        'Stand on band, handles at shoulders. Squat deep, drive up and press overhead in one motion. Return, repeat.',
    },
    {
      slot: '02',
      name: 'RB Burpee',
      reps: '5 × 10',
      description:
        'Loop band round shoulders and under feet. Drop to plank, jump feet in, stand, small hop. Repeat with band tension.',
    },
    {
      slot: '03',
      name: 'RB Clean and Press',
      reps: '5 × 10',
      description:
        'Stand on band. Pull handles from hips to shoulders in one motion, press overhead, reverse under control.',
    },
    {
      slot: '04',
      name: 'RB Renegade Row',
      reps: '5 × 10',
      description:
        'Plank position, one handle in each hand, band anchored ahead. Row one arm to ribs, alternate, hips stay square.',
    },
    {
      slot: '05',
      name: 'RB Deadlift to Press',
      reps: '5 × 10',
      description:
        'Stand on band. Deadlift to standing, then press handles overhead in one flow, reverse the sequence. Big breath each rep.',
    },
    {
      slot: '06',
      name: 'RB Woodchop',
      reps: '5 × 10',
      description:
        'Anchor band high, side-on. Grip with both hands, pull diagonally down to opposite hip, rotate through torso. Switch sides.',
    },
    {
      slot: '07',
      name: 'RB Anti-Rotation Hold',
      reps: '5 × 10',
      description:
        'Anchor band chest-height, side-on. Press handles straight out, hold rigid against pull. 10 seconds per rep, switch sides.',
    },
  ],
};

const bandStamina: Exercise[] = [
  {
    slot: '01',
    name: 'Banded High Knees',
    reps: '5 × 50s',
    description:
      'Band above knees. Drive knees up alternately at pace, arms pumping, stay light on the balls of your feet.',
  },
  {
    slot: '02',
    name: 'Banded Jumping Jacks',
    reps: '5 × 50s',
    description:
      'Band above knees. Jump feet wide and narrow, arms swinging overhead. Keep band taut throughout, land softly.',
  },
  {
    slot: '03',
    name: 'Banded Skater Jumps',
    reps: '5 × 50s',
    description:
      'Band above knees. Bound side to side, land soft on outside leg, tap opposite foot behind. Stay low.',
  },
  {
    slot: '04',
    name: 'Banded Fast Punches',
    reps: '5 × 50s',
    description:
      'Anchor band behind you. Handles at chest, punch forward alternating hands as fast as form allows. Rotate through hips.',
  },
  {
    slot: '05',
    name: 'Banded Deadlift-to-Press',
    reps: '5 × 50s',
    description:
      'Stand on band. Deadlift to standing, press handles overhead, lower. Repeat at pace with breath on each rep.',
  },
];

const KB_LINES: Line[] = ['A', 'B', 'C', 'D'];
const KB_KEYS = [...KB_LINES, 'S'] as const;
type KBKey = (typeof KB_KEYS)[number];

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
    return { line: 'A' as WorkoutKey, sets: {} as Record<string, number> };
  }
}

function saveWorkoutLocal(date: string, data: { line: WorkoutKey; sets: Record<string, number> }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_KEY(date), JSON.stringify(data));
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
  const [sets, setSets] = useState<Record<string, number>>({});
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // `hasLoaded` guards the save + rollover effects so they don't
  // run with the default state during the brief window between
  // mount and the load completion. Otherwise the save effect
  // fires once on mount with `sets: {}` and overwrites the
  // existing localStorage entry before the load has a chance to
  // read it — silently nuking the user's progress.
  const [hasLoaded, setHasLoaded] = useState(false);

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
    // Try remote first, fall back to local. Loads only the active
    // grouping — switching groupings triggers a re-load.
    if (user && supabase) {
      loadWorkoutRemote(supabase, user.id, k, grouping).then((remote) => {
        if (remote) {
          setKey(remote.line);
          setSets(remote.sets);
          saveWorkoutLocal(k, remote);
        } else {
          const local = loadWorkoutLocal(k);
          setKey(local.line);
          setSets(local.sets);
        }
        setHasLoaded(true);
      });
    } else {
      const local = loadWorkoutLocal(k);
      setKey(local.line);
      setSets(local.sets);
      setHasLoaded(true);
    }
  }, [user, supabase, grouping]);

  useEffect(() => {
    if (!date || !hasLoaded) return;
    saveWorkoutLocal(date, { line: key, sets });
    if (user && supabase) {
      saveWorkoutRemote(supabase, user.id, date, {
        line: key,
        sets,
        grouping,
      });
    }
  }, [date, key, sets, user, supabase, grouping]);

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
        saveWorkoutLocal(date, { line: key, sets });
      }
      setDate(k);
      // Reset local state. The mount-effect will then load
      // whatever's in workout_log for the new date (almost always
      // empty for a fresh day, but a previously-saved session
      // would survive).
      setKey('A');
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
  }, [date, key, sets, user, supabase]);

  // The exercise list for the active grouping+key. Stamina key
  // ('S') pulls from the matching stamina array instead of the
  // themed lines.
  const exercises: Exercise[] = (() => {
    if (key === STAMINA_KEY) {
      if (grouping === 'kettlebell') return kettlebellStamina;
      if (grouping === 'band') return bandStamina;
      return workoutLines['A'].exercises; // bodyweight has no stamina line
    }
    if (grouping === 'bodyweight')
      return workoutLines[key as Line]?.exercises ?? [];
    if (grouping === 'kettlebell')
      return kettlebellLines[key as Line] ?? [];
    if (grouping === 'band')
      return bandLines[key as Line] ?? [];
    return [];
  })();
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

  // Auto-tick Move Your Body when the user has 5 distinct
  // exercises at 5 sets each. Counts across all groupings because
  // the sets dict is keyed by exercise name and exercise names
  // don't collide across groupings (KB / band / bodyweight each
  // have unique names). Fires on every false→true transition; if
  // the user unticks the tile, the next time they reach 5
  // exercises it'll re-fire.
  useEffect(() => {
    if (!hasLoaded || !user) return;
    const distinctComplete = Object.values(sets).filter(
      (n) => n >= TOTAL_SETS
    ).length;
    if (
      distinctComplete >= 5 &&
      !tracker.todayTaps['move-body']
    ) {
      tracker.toggleHabit('move-body');
      // Tell Tracker.tsx to fire the celebration (confetti + toast)
      // — the auto-tick came from this component, not the user.
      window.dispatchEvent(
        new CustomEvent('fit50:auto-tick', {
          detail: { kind: 'move-body' },
        })
      );
    }
    // We don't watch sets directly with `useEffect([sets])` because
    // `sets` is a new object reference on every render — we want to
    // re-evaluate only when distinct complete count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Object.values(sets).filter((n) => n >= TOTAL_SETS).length,
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
                  onClick={() => {
                    setGrouping(g);
                    // Reset to 'A' when switching groupings so the
                    // user lands on a sensible default each time.
                    setKey('A');
                    setActiveIdx(null);
                  }}
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

        {/* Sub-selector: A/B/C/D for bodyweight, A/B/C/D/Stamina for
            the premium programs. The Stamina tab only appears for KB
            and band. */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-6">
          {(() => {
            const keys: WorkoutKey[] =
              grouping === 'bodyweight'
                ? ['A', 'B', 'C', 'D']
                : ['A', 'B', 'C', 'D', STAMINA_KEY];
            return keys.map((k) => {
              const active = k === key;
              const label =
                k === STAMINA_KEY
                  ? 'Stamina'
                  : (() => {
                      if (grouping === 'bodyweight') {
                        return workoutLines[k as Line].name;
                      }
                      if (grouping === 'kettlebell') {
                        return kettlebellLines[k as Line][0]?.name?.split(' ')[0] ?? '';
                      }
                      if (grouping === 'band') {
                        return bandLines[k as Line][0]?.name?.split(' ')[0] ?? '';
                      }
                      return '';
                    })();
              return (
                <button
                  key={k}
                  onClick={() => {
                    setKey(k);
                    setActiveIdx(null);
                  }}
                  className={`px-3 py-3 border font-body text-caption uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-coral text-coral bg-coral/5'
                      : 'border-ink/20 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  <span className="font-display text-h3 block leading-none mb-1">{k}</span>
                  <span className="block text-[10px] leading-tight opacity-80 truncate">
                    {label}
                  </span>
                </button>
              );
            });
          })()}
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
              ← Back to row {key}
            </button>

            <div className="border border-ink/15 p-5 md:p-6">
              <div className="flex items-baseline gap-3 mb-3">
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
