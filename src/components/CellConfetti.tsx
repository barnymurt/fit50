'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#E88B5A', '#4A9B9B', '#F2D9A2', '#D8B8D0', '#1A1730', '#FAF6EE'];

interface Piece {
  id: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  rot: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
}

interface CellConfettiProps {
  show: boolean;
  intensity?: 'small' | 'big';
}

interface BurstSpec {
  count: number;
  startYBase: number;
  startYSpread: number;
  durationBase: number;
  durationSpread: number;
  dxSpread: number;
  dyBase: number;
  dySpread: number;
  sizeBase: number;
  sizeSpread: number;
}

const SMALL: BurstSpec = {
  count: 14,
  startYBase: 70,
  startYSpread: 28,
  durationBase: 0.5,
  durationSpread: 0.3,
  dxSpread: 120,
  dyBase: -140,
  dySpread: 60,
  sizeBase: 3,
  sizeSpread: 3,
};

const BIG: BurstSpec = {
  count: 80,
  startYBase: 75,
  startYSpread: 25,
  durationBase: 0.85,
  durationSpread: 0.7,
  dxSpread: 320,
  dyBase: -240,
  dySpread: 200,
  sizeBase: 4,
  sizeSpread: 6,
};

export default function CellConfetti({
  show,
  intensity = 'big',
}: CellConfettiProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!show) {
      setPieces([]);
      return;
    }
    const spec = intensity === 'big' ? BIG : SMALL;
    const generated: Piece[] = [];
    for (let i = 0; i < spec.count; i++) {
      generated.push({
        id: i,
        startX: Math.random() * 100,
        startY: spec.startYBase + Math.random() * spec.startYSpread,
        delay: Math.random() * 0.15,
        duration:
          intensity === 'big'
            ? spec.durationBase + Math.random() * spec.durationSpread
            : spec.durationBase + Math.random() * spec.durationSpread * 0.6,
        rot: (Math.random() - 0.5) * 900,
        dx: (Math.random() - 0.5) * spec.dxSpread,
        dy:
          intensity === 'big'
            ? spec.dyBase - Math.random() * spec.dySpread
            : spec.dyBase * 0.55 - Math.random() * spec.dySpread * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: spec.sizeBase + Math.random() * spec.sizeSpread,
      });
    }
    setPieces(generated);
  }, [show, intensity]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            ['--rot' as string]: `${p.rot}deg`,
            animation: `cell-shoot ${p.duration}s ease-out forwards`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes cell-shoot {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          55% {
            transform: translate(calc(var(--dx) * 0.4), calc(var(--dy) * 0.7)) rotate(calc(var(--rot) * 0.55));
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
