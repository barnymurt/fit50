'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerPurpose {
  key: string;
  durationMinutes: number;
  durationSeconds?: number;
  buttonLabel: string;
  heading?: string;
  lede?: string;
}

interface TimerProps {
  defaultMinutes?: number;
  label?: string;
  context?: string;
  purposes?: TimerPurpose[];
  onComplete?: () => void;
}

export default function Timer({
  defaultMinutes = 30,
  label,
  context,
  purposes,
  onComplete,
}: TimerProps) {
  const initialTotal = defaultMinutes * 60;
  const [totalSeconds, setTotalSeconds] = useState(initialTotal);
  const [remainingSeconds, setRemainingSeconds] = useState(initialTotal);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activePurposeKey, setActivePurposeKey] = useState<string | null>(() => {
    if (!purposes) return null;
    const targetSeconds = defaultMinutes * 60;
    const exact = purposes.find(
      (p) =>
        p.durationMinutes * 60 + (p.durationSeconds ?? 0) === targetSeconds
    );
    return exact ? exact.key : purposes[0]?.key ?? null;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playDing = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const beep = (start: number, freq: number, dur: number, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    };
    // Alarm: 4 bursts of 3 beeps each. ~5s total, hard to miss.
    for (let burst = 0; burst < 4; burst++) {
      const burstStart = now + burst * 1.1;
      beep(burstStart, 880, 0.22);
      beep(burstStart + 0.3, 880, 0.22);
      beep(burstStart + 0.6, 880, 0.22);
    }
  }, [ensureAudio]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompleted(true);
            playDing();
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
  }, [isRunning, remainingSeconds, playDing]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  const handleStart = useCallback(() => {
    ensureAudio();
    setCompleted(false);
    setIsRunning(true);
  }, [ensureAudio]);

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
    if (purposes) {
      const exact = purposes.find(
        (p) => p.durationMinutes === minutes && (p.durationSeconds ?? 0) === seconds
      );
      setActivePurposeKey(exact ? exact.key : null);
    } else {
      setActivePurposeKey(null);
    }
  }, [purposes]);

  const activePurpose =
    purposes && activePurposeKey
      ? purposes.find((p) => p.key === activePurposeKey) ?? null
      : null;
  const displayHeading = activePurpose?.heading ?? label ?? 'Timer';
  const displayLede = activePurpose?.lede ?? context ?? null;

  return (
    <div className="bg-paper border border-ink/10 p-6 text-center">
      <p className="font-display text-h2 text-ink mb-2 leading-tight">
        {displayHeading}
      </p>
      {displayLede && (
        <p className="font-body text-sm text-ink/65 mb-6 max-w-sm mx-auto leading-snug">
          {displayLede}
        </p>
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

      {/* Editable duration presets — purpose buttons change the timer copy */}
      <EditableDuration
        defaultMinutes={defaultMinutes}
        onSetDuration={handleSetDuration}
        purposes={purposes}
        activePurposeKey={activePurposeKey}
        onSelectPurpose={setActivePurposeKey}
      />
    </div>
  );
}

interface EditableDurationProps {
  defaultMinutes: number;
  onSetDuration: (minutes: number, seconds: number) => void;
  purposes?: TimerPurpose[];
  activePurposeKey: string | null;
  onSelectPurpose: (key: string) => void;
}

function EditableDuration({
  defaultMinutes,
  onSetDuration,
  purposes,
  activePurposeKey,
  onSelectPurpose,
}: EditableDurationProps) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [seconds, setSeconds] = useState(0);

  const handleSet = () => {
    onSetDuration(minutes, seconds);
    setOpen(false);
  };

  // Purpose presets first (e.g. "Project time" at 30m), then any
  // generic time slots that don't overlap with a purpose.
  const purposesAsPresets = (purposes ?? []).map((p) => ({
    kind: 'purpose' as const,
    key: p.key,
    label: p.buttonLabel,
    mins: p.durationMinutes,
    secs: p.durationSeconds ?? 0,
  }));
  const coveredKeys = new Set(
    purposesAsPresets.map((p) => `${p.mins}:${p.secs}`)
  );
  const genericPresets = [
    { kind: 'generic' as const, label: '15m', mins: 15, secs: 0 },
    { kind: 'generic' as const, label: '50m', mins: 50, secs: 0 },
    { kind: 'generic' as const, label: '5m', mins: 5, secs: 0 },
  ].filter((p) => !coveredKeys.has(`${p.mins}:${p.secs}`));
  const presets = [...purposesAsPresets, ...genericPresets];

  if (!open) {
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {presets.map((p) => {
          const isActive = p.kind === 'purpose' && p.key === activePurposeKey;
          const labelText = p.label;
          return (
            <button
              key={`${p.mins}-${p.secs}-${labelText}`}
              onClick={() => {
                onSetDuration(p.mins, p.secs);
                if (p.kind === 'purpose') onSelectPurpose(p.key);
              }}
              className={`font-body text-xs uppercase tracking-widest px-3 py-1 border transition-colors ${
                isActive
                  ? 'border-coral text-coral bg-coral/5'
                  : 'border-ink/20 text-ink/60 hover:border-ink/40'
              }`}
            >
              {labelText}
            </button>
          );
        })}
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
