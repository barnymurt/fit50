'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  defaultMinutes?: number;
  label?: string;
  context?: string;
  onComplete?: () => void;
}

export default function Timer({
  defaultMinutes = 30,
  label,
  context,
  onComplete,
}: TimerProps) {
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

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
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

  const handleSetDuration = useCallback((minutes: number, seconds: number = 0) => {
    setIsRunning(false);
    setCompleted(false);
    const total = minutes * 60 + seconds;
    setTotalSeconds(total);
    setRemainingSeconds(total);
  }, []);

  return (
    <div className="bg-paper border border-ink/10 p-6 text-center">
      {label && (
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
          {label}
        </p>
      )}
      {context && (
        <p className="font-body text-xs text-ink/40 mb-4">{context}</p>
      )}

      <div className={`font-display tabular-nums mb-4 leading-none ${completed ? 'text-teal' : 'text-ink'}`}
           style={{ fontSize: 'clamp(4rem, 10vw, 5.5rem)', letterSpacing: '-0.04em' }}>
        {hours > 0 ? (
          <>
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </>
        ) : (
          <>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </>
        )}
      </div>

      <div className="h-1 bg-ink/10 mb-5 overflow-hidden">
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

      <div className="flex items-center justify-center gap-2 mb-4">
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

      {/* Editable duration presets — user can change minutes and seconds directly */}
      <EditableDuration
        defaultMinutes={defaultMinutes}
        onSetDuration={handleSetDuration}
      />
    </div>
  );
}

interface EditableDurationProps {
  defaultMinutes: number;
  onSetDuration: (minutes: number, seconds: number) => void;
}

function EditableDuration({ defaultMinutes, onSetDuration }: EditableDurationProps) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [seconds, setSeconds] = useState(0);

  const handleSet = () => {
    onSetDuration(minutes, seconds);
    setOpen(false);
  };

  const presets = [
    { label: '30m', mins: 30, secs: 0 },
    { label: '15m', mins: 15, secs: 0 },
    { label: '10m', mins: 10, secs: 0 },
    { label: '50m', mins: 50, secs: 0 },
    { label: '5m', mins: 5, secs: 0 },
    { label: '1m', mins: 1, secs: 0 },
  ];

  if (!open) {
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onSetDuration(p.mins, p.secs)}
            className="font-body text-xs uppercase tracking-widest px-3 py-1 border border-ink/20 text-ink/60 hover:border-ink/40 transition-colors"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="font-body text-xs uppercase tracking-widest px-3 py-1 border border-ink/20 text-ink/60 hover:border-ink/40 transition-colors"
        >
          Custom
        </button>
      </div>
    );
  }

  return (
    <div className="border border-ink/20 p-4">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
        Set duration
      </p>
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={23}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
            className="w-16 text-center font-display text-2xl bg-transparent border-b-2 border-ink/40 text-ink focus:border-ink outline-none tabular-nums"
            aria-label="minutes"
          />
          <span className="font-body text-caption uppercase text-ink/50">min</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            className="w-16 text-center font-display text-2xl bg-transparent border-b-2 border-ink/40 text-ink focus:border-ink outline-none tabular-nums"
            aria-label="seconds"
          />
          <span className="font-body text-caption uppercase text-ink/50">sec</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleSet}
          className="bg-ink text-paper font-body text-xs px-4 py-2 uppercase tracking-wider hover:bg-ink/85 transition-colors"
        >
          Set
        </button>
        <button
          onClick={() => setOpen(false)}
          className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
