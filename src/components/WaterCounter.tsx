'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadJson, saveJson } from '@/lib/storage';

const STORAGE_KEY = 'fit50-water-v1';
const DAILY_GOAL_ML = 2500; // 2.5L

const PRESETS = [
  { ml: 250, label: '250 ml', subtitle: 'Small glass' },
  { ml: 500, label: '500 ml', subtitle: 'Pint' },
  { ml: 750, label: '750 ml', subtitle: 'Bottle' },
];

interface DayWater {
  date: string; // YYYY-MM-DD
  amount: number; // ml
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export default function WaterCounter() {
  const [history, setHistory] = useState<DayWater[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const saved = loadJson<DayWater[]>(STORAGE_KEY, []);
    setHistory(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, history);
  }, [history, hydrated]);

  const today = todayKey();
  const todayAmount = history.find((d) => d.date === today)?.amount ?? 0;
  const fillPct = Math.min(100, Math.round((todayAmount / DAILY_GOAL_ML) * 100));
  const goalHit = todayAmount >= DAILY_GOAL_ML;

  const addWater = (ml: number) => {
    if (ml <= 0) return;
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d.date === today);
      if (idx >= 0) {
        next[idx] = { ...next[idx], amount: next[idx].amount + ml };
      } else {
        next.push({ date: today, amount: ml });
      }
      return next;
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  };

  const removeLastLog = () => {
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d.date === today);
      if (idx < 0) return prev;
      const current = next[idx].amount;
      const last = Math.max(0, current - 250);
      if (last === 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], amount: last };
      }
      return next;
    });
  };

  const resetToday = () => {
    setHistory((prev) => prev.filter((d) => d.date !== today));
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseInt(customAmount, 10);
    if (!isNaN(ml) && ml > 0) {
      addWater(ml);
      setCustomAmount('');
    }
  };

  // Build a list of "taps" for the day to show what was logged
  const todaysLogs = useMemo(() => {
    if (!hydrated) return [] as number[];
    const current = history.find((d) => d.date === today);
    if (!current) return [];
    // We can't recover the per-tap breakdown from the cumulative
    // amount, so just show the cumulative as a single log. But for
    // a more visual log list, store the taps instead:
    return [];
  }, [history, today, hydrated]);

  if (!hydrated) {
    return (
      <div className="bg-paper border border-ink/10 p-6 md:p-8 text-center">
        <p className="font-body text-ink/40 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-ink/10 p-6 md:p-8">
      {/* Top: bottle visual + stat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
        <BottleShape fillPct={fillPct} flash={flash} />
        <div className="text-center md:text-left">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
            Today
          </p>
          <p
            className="font-display leading-none tabular-nums"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 5.5rem)', letterSpacing: '-0.04em', color: goalHit ? '#4A9B9B' : '#1A1A1A' }}
          >
            {(todayAmount / 1000).toFixed(2)}
            <span className="text-2xl text-ink/50 font-body font-normal ml-1">L</span>
          </p>
          <p className="font-body text-sm text-ink/50 mt-1 mb-4">
            of 2.5L goal · {fillPct}%
          </p>
          {/* progress bar */}
          <div className="h-2 bg-ink/10 overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-500 ease-smooth ${
                goalHit ? 'bg-teal' : 'bg-coral'
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          {goalHit && (
            <p className="font-body text-sm text-teal font-medium">
              ✓ 2.5L hit. Day 7 ✓
            </p>
          )}
        </div>
      </div>

      {/* Preset buttons */}
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
        Tap to add
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.ml}
            onClick={() => addWater(p.ml)}
            className="bg-paper border-2 border-ink/20 p-4 flex flex-col items-center gap-2 hover:border-coral hover:bg-coral/5 transition-colors"
          >
            <BottleIcon ml={p.ml} size={32} />
            <p className="font-display text-h3 text-ink leading-none">{p.label}</p>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              {p.subtitle}
            </p>
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <form onSubmit={handleCustom} className="flex flex-col sm:flex-row gap-3 mb-6 pb-6 border-b border-ink/10">
        <input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom amount (ml)"
          min={1}
          className="flex-1 px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-ink outline-none"
        />
        <button
          type="submit"
          className="bg-ink text-paper font-body text-sm px-6 py-2 uppercase tracking-wider hover:bg-ink/85 transition-colors"
        >
          Add
        </button>
        <input
          type="number"
          onChange={(e) => {
            const ml = parseInt(e.target.value, 10);
            if (!isNaN(ml) && ml > 0) {
              setCustomAmount(String(ml));
            }
          }}
          placeholder="ml"
          className="hidden"
        />
      </form>

      <div className="flex items-center justify-between">
        <button
          onClick={removeLastLog}
          disabled={todayAmount === 0}
          className="font-body text-caption uppercase text-ink/50 hover:text-ink transition-colors disabled:opacity-30"
        >
          Undo 250 ml
        </button>
        <button
          onClick={resetToday}
          disabled={todayAmount === 0}
          className="font-body text-caption uppercase text-ink/50 hover:text-coral transition-colors disabled:opacity-30"
        >
          Reset today
        </button>
      </div>
    </div>
  );
}

function BottleIcon({ ml, size = 32 }: { ml: number; size?: number }) {
  // 250ml = cocktail / martini glass (triangular bowl + stem + base)
  // 500ml = beer mug (cylindrical body + handle)
  // 750ml = water bottle (cylindrical with cap)
  if (ml === 250) {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 32 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
        <path d="M4 4 L28 4 L17 18 L17 27 L21 27 L21 29 L11 29 L11 27 L15 27 L15 18 Z" />
        <line x1="6" y1="9" x2="26" y2="9" />
      </svg>
    );
  }
  if (ml === 500) {
    return (
      <svg width={size} height={size * 1.3} viewBox="0 0 32 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
        <path d="M7 6 L25 6 L25 33 L7 33 Z" />
        <path d="M25 12 Q31 12 31 19 Q31 26 25 26" />
        <line x1="7" y1="13" x2="25" y2="13" />
      </svg>
    );
  }
  // 750ml = standard water bottle (cylindrical with cap)
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 32 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
      <rect x="12" y="2" width="8" height="4" rx="1" />
      <path d="M10 6h12l-1 2h-10l-1-2z" />
      <rect x="11" y="8" width="10" height="32" rx="1" />
      <line x1="11" y1="18" x2="21" y2="18" />
      <line x1="11" y1="24" x2="21" y2="24" />
      <line x1="11" y1="30" x2="21" y2="30" />
    </svg>
  );
}

function BottleShape({ fillPct, flash }: { fillPct: number; flash: boolean }) {
  // Large water bottle that fills from bottom to top as you log water
  return (
    <div className="relative w-full max-w-[200px] mx-auto aspect-[3/4]">
      <svg
        viewBox="0 0 100 130"
        className={`w-full h-full ${flash ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* cap */}
        <rect x="40" y="4" width="20" height="8" rx="1" className="text-ink" fill="none" />
        {/* neck */}
        <path d="M36 12h28l-1 4h-26l-1-4z" className="text-ink" fill="none" />
        {/* body outline */}
        <rect x="30" y="16" width="40" height="108" rx="3" className="text-ink" fill="none" />
        {/* water fill */}
        <defs>
          <clipPath id="bottleClip">
            <rect x="30" y="16" width="40" height="108" rx="3" />
          </clipPath>
        </defs>
        <rect
          x="30"
          y={16 + 108 - (108 * fillPct) / 100}
          width="40"
          height={(108 * fillPct) / 100}
          fill="#4A9B9B"
          opacity="0.4"
          clipPath="url(#bottleClip)"
        />
        {/* fill marker line */}
        <line
          x1="30"
          y1={16 + 108 - (108 * fillPct) / 100}
          x2="70"
          y2={16 + 108 - (108 * fillPct) / 100}
          className="text-teal"
          strokeWidth="2.5"
        />
        {/* measurement marks */}
        <g className="text-ink/40" strokeWidth="1.2">
          <line x1="30" y1="70" x2="40" y2="70" />
          <line x1="30" y1="51" x2="36" y2="51" />
          <line x1="30" y1="89" x2="36" y2="89" />
        </g>
        <text
          x="42"
          y="74"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
          className="fill-ink/60"
        >
          2.5L
        </text>
      </svg>
    </div>
  );
}
