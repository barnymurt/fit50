'use client';

import WatercolourSection from './WatercolourSection';

const workoutLines = {
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
    <WatercolourSection color="#2A2A2A" className="py-24" seed={5}>
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="font-display text-4xl md:text-5xl text-[#FEFEFE] text-center mb-16">
          THE WORKOUTS
        </h2>

        <div className="space-y-8">
          {Object.entries(workoutLines).map(([line, exercises]) => (
            <div key={line} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-16 h-16 rounded-full bg-[#E88B5A] flex items-center justify-center flex-shrink-0">
                <span className="font-display text-2xl text-[#FEFEFE]">{line}</span>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      exercise.isFinisher 
                        ? 'bg-[#4A9B9B]' 
                        : 'bg-[#FEFEFE]/10'
                    }`}
                  >
                    <h4 className="font-body text-[#FEFEFE] font-medium">
                      {exercise.name}
                    </h4>
                    <p className="font-body text-[#FEFEFE]/60 text-sm mt-1">
                      {exercise.reps}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-[#FEFEFE]/10 rounded-lg text-center">
          <p className="font-body text-[#FEFEFE]/80">
            <span className="font-display text-[#E88B5A]">A, B, C, D</span> — Complete one line per day. 
            Repeat the pattern: A → B → C → D → A → B → C → D...
          </p>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#E88B5A] text-[#FEFEFE] font-display text-sm px-8 py-4 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors"
          >
            Start Tracking Now →
          </button>
        </div>
      </div>
    </WatercolourSection>
  );
}
