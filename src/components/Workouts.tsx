import Section from './Section';
import Button from './Button';
import Marquee from './Marquee';

interface Exercise {
  name: string;
  reps: string;
  isFinisher?: boolean;
}

const workoutLines: Record<string, Exercise[]> = {
  A: [
    { name: 'Push-ups', reps: '5 × 10 reps' },
    { name: 'Goblet Squats', reps: '5 × 10 reps' },
    { name: 'Dumbbell Rows', reps: '5 × 10 reps' },
    { name: 'Shoulder Press', reps: '5 × 10 reps' },
    { name: 'Plank', reps: '5 × 50 sec', isFinisher: true },
  ],
  B: [
    { name: 'Pull-ups', reps: '5 × 10 reps' },
    { name: 'Lunges', reps: '5 × 10 reps' },
    { name: 'Bench Press', reps: '5 × 10 reps' },
    { name: 'Bicep Curls', reps: '5 × 10 reps' },
    { name: 'Burpees', reps: '5 × 50 sec', isFinisher: true },
  ],
  C: [
    { name: 'Dips', reps: '5 × 10 reps' },
    { name: 'Deadlifts', reps: '5 × 10 reps' },
    { name: 'Face Pulls', reps: '5 × 10 reps' },
    { name: 'Lateral Raises', reps: '5 × 10 reps' },
    { name: 'Mountain Climbers', reps: '5 × 50 sec', isFinisher: true },
  ],
  D: [
    { name: 'Chin-ups', reps: '5 × 10 reps' },
    { name: 'Romanian Deadlifts', reps: '5 × 10 reps' },
    { name: 'Incline Press', reps: '5 × 10 reps' },
    { name: 'Tricep Extensions', reps: '5 × 10 reps' },
    { name: 'Russian Twists', reps: '5 × 50 sec', isFinisher: true },
  ],
};

export default function Workouts() {
  return (
    <Section
      id="workouts"
      tone="ink"
      className="relative bg-ink text-paper overflow-hidden pt-40 md:pt-56"
    >
      <h2 className="sr-only">The Workouts</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="THE WORKOUTS · TRAIN · MOVE · REPEAT"
          separator="✦"
          speed={200}
          textClassName="text-coral/55"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-20">
          <div className="md:col-span-8">
            <p className="font-display text-3xl md:text-5xl text-paper/95 max-w-3xl leading-tight">
              Choose a line a day, Repeat — Just show up.
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-10">
            <p className="font-body text-caption uppercase text-coral">
              The Workouts
            </p>
          </div>
        </div>

        <div className="space-y-0 border-t border-paper/15">
          {Object.entries(workoutLines).map(([line, exercises]) => (
            <div
              key={line}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start md:items-center py-10 md:py-12 border-b border-paper/15"
            >
              <div className="md:col-span-3">
                <span
                  className="font-display text-paper leading-none"
                  style={{ fontSize: 'clamp(6rem, 12vw, 10rem)', letterSpacing: '-0.04em' }}
                >
                  {line}
                </span>
              </div>

              <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-6">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className={`pl-4 ${
                      exercise.isFinisher
                        ? 'border-l-2 border-coral'
                        : 'border-l border-paper/15'
                    }`}
                  >
                    <h4 className="font-display text-lg text-paper leading-tight mb-1">
                      {exercise.name}
                    </h4>
                    <p
                      className={`font-body text-sm ${
                        exercise.isFinisher ? 'text-coral' : 'text-paper/50'
                      }`}
                    >
                      {exercise.reps}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 md:mt-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="font-display text-h2 text-paper max-w-md">
            Day 1 starts when you do.
          </p>
          <Button href="#tracker" variant="primary" tone="dark">
            Start tracking
          </Button>
        </div>
      </div>
    </Section>
  );
}
