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

  // Timestamp-based timer so the screen going off (and the resulting
  // interval throttling) doesn't lose time. We store the wall-clock
  // start time and the original total duration; remaining = total -
  // (now - start) / 1000.
  const startedAtRef = useRef<number | null>(null);

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
  // Wake Lock: keeps the screen on while the timer runs so the OS
  // doesn't suspend our setInterval and mute the alarm. The browser
  // auto-releases the lock when the tab is hidden, so we re-acquire
  // on visibilitychange.
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async (): Promise<WakeLockSentinel | null> => {
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } }).wakeLock;
      if (wl) {
        return await wl.request('screen');
      }
    } catch (err) {
      // The browser can refuse the lock (low battery, user denied,
      // insecure context). Not fatal — the timestamp math below
      // still works without it; we just lose the screen-on guarantee.
      console.error('Timer: Wake Lock request failed', err);
    }
    return null;
  }, []);

  const releaseWakeLock = useCallback(() => {
    const lock = wakeLockRef.current;
    if (lock) {
      lock.release().catch(() => {
        // already released
      });
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Release the Wake Lock on unmount.
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Re-acquire the Wake Lock when the tab regains visibility.
  // Browsers auto-release when the document is hidden; we re-grab
  // so the screen stays on if the user is in the middle of a
  // session and switches apps briefly.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isRunning &&
        !wakeLockRef.current
      ) {
        requestWakeLock().then((lock) => {
          if (lock) wakeLockRef.current = lock;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isRunning, requestWakeLock]);

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

  // Tick loop. Re-derives remaining time from the wall clock each
  // tick so any interval throttling (mobile screen off, background tab)
  // doesn't lose time.
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (startedAtRef.current === null) return;
      const elapsedMs = Date.now() - startedAtRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSec);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setIsRunning(false);
        setCompleted(true);
        playDing();
        onCompleteRef.current?.();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, totalSeconds, playDing]);

  // When the tab/window regains focus, recompute immediately so the
  // display snaps back to the right number even if the interval was
  // heavily throttled while in the background.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && startedAtRef.current !== null) {
        const elapsedMs = Date.now() - startedAtRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const remaining = Math.max(0, totalSeconds - elapsedSec);
        setRemainingSeconds(remaining);
        if (remaining <= 0 && !completed) {
          setIsRunning(false);
          setCompleted(true);
          playDing();
          onCompleteRef.current?.();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
  }, [isRunning, totalSeconds, completed, playDing]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  const handleStart = useCallback(() => {
    ensureAudio();
    setCompleted(false);
    startedAtRef.current = Date.now() - (totalSeconds - remainingSeconds) * 1000;
    setIsRunning(true);
    // Acquire the Wake Lock on user gesture so the screen stays on
    // for the duration of the timer. Re-acquired automatically on
    // visibilitychange if the browser auto-released it.
    requestWakeLock().then((lock) => {
      if (lock) wakeLockRef.current = lock;
    });
  }, [ensureAudio, remainingSeconds, totalSeconds, requestWakeLock]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    releaseWakeLock();
  }, [releaseWakeLock]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCompleted(false);
    startedAtRef.current = null;
    setRemainingSeconds(totalSeconds);
    releaseWakeLock();
  }, [totalSeconds, releaseWakeLock]);

  const handleSetDuration = useCallback((minutes: number, seconds: number = 0) => {
    setIsRunning(false);
    setCompleted(false);
    startedAtRef.current = null;
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

      <div className="font-body text-caption uppercase tracking-widest text-ink/40 mb-6">
        {isRunning ? 'In progress' : completed ? 'Done' : 'Ready'}
      </div>

      <div className="h-1 bg-ink/10 mb-6 overflow-hidden">
        <div
          className="h-full bg-coral transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={remainingSeconds <= 0}
            className="bg-coral text-paper font-body text-sm px-8 py-3 uppercase tracking-wider hover:bg-coral/85 transition-colors disabled:opacity-40"
          >
            {completed ? 'Run again' : remainingSeconds < totalSeconds ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="bg-ink text-paper font-body text-sm px-8 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="border border-ink/30 text-ink font-body text-caption uppercase tracking-widest px-4 py-3 hover:bg-cream/30 transition-colors"
        >
          Reset
        </button>
      </div>

      {purposes && (
        <div className="border-t border-ink/10 pt-5">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Quick set
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {purposes.map((p) => {
              const total = p.durationMinutes * 60 + (p.durationSeconds ?? 0);
              const active = total === totalSeconds;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSetDuration(p.durationMinutes, p.durationSeconds ?? 0)}
                  className={`px-3 py-2 border font-body text-caption uppercase tracking-widest transition-colors ${
                    active
                      ? 'border-coral text-coral bg-coral/5'
                      : 'border-ink/20 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  {p.buttonLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
