'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  defaultMinutes?: number;
  label?: string;
  onComplete?: () => void;
}

export default function Timer({ defaultMinutes = 30, label, onComplete }: TimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompleted(true);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  const handleStart = useCallback(() => {
    setCompleted(false);
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCompleted(false);
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  const handleSetDuration = useCallback((minutes: number) => {
    setIsRunning(false);
    setCompleted(false);
    setTotalSeconds(minutes * 60);
    setRemainingSeconds(minutes * 60);
  }, []);

  return (
    <div className="bg-paper border border-ink/10 p-8 text-center">
      {label && (
        <p className="font-body text-caption uppercase text-ink/50 mb-3">
          {label}
        </p>
      )}

      <div className={`font-display tabular-nums mb-6 leading-none ${completed ? 'text-teal' : 'text-ink'}`}
           style={{ fontSize: 'clamp(3.5rem, 8vw, 5rem)', letterSpacing: '-0.02em' }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      <div className="h-1 bg-ink/10 mb-6 overflow-hidden">
        <div
          className="h-full bg-coral transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {completed && (
        <p className="font-body text-sm text-teal mb-4">
          ✓ Done. Well executed.
        </p>
      )}

      <div className="flex items-center justify-center gap-3 mb-6">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={remainingSeconds === 0}
            className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {remainingSeconds === totalSeconds ? 'Start' : remainingSeconds === 0 ? 'Done' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors px-4 py-3"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {[15, 30, 45, 60].map((mins) => (
          <button
            key={mins}
            onClick={() => handleSetDuration(mins)}
            className={`font-body text-xs px-3 py-1 border transition-colors ${
              totalSeconds === mins * 60
                ? 'border-coral text-coral'
                : 'border-ink/20 text-ink/60 hover:border-ink/40'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>
    </div>
  );
}
