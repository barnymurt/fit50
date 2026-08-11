'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#E88B5A', '#4A9B9B', '#F2D9A2', '#D8B8D0'];

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

export default function CellConfetti({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!show) {
      setPieces([]);
      return;
    }
    const generated: Piece[] = [];
    // 24 shoot-up pieces: spawn across the entire bottom edge,
    // launch upward, arch outward, pop outside the cell
    for (let i = 0; i < 24; i++) {
      generated.push({
        id: i,
        startX: Math.random() * 100,
        startY: 80 + Math.random() * 20,
        delay: Math.random() * 0.12,
        duration: 0.7 + Math.random() * 0.3,
        rot: (Math.random() - 0.5) * 900,
        dx: (Math.random() - 0.5) * 200,
        dy: -160 - Math.random() * 120,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 4,
      });
    }
    setPieces(generated);
  }, [show]);

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
