'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#E88B5A', '#4A9B9B', '#F2D9A2', '#D8B8D0'];

interface Piece {
  id: number;
  startX: number;
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
    // 6 pieces from top-left corner
    for (let i = 0; i < 6; i++) {
      generated.push({
        id: i,
        startX: Math.random() * 25,
        delay: Math.random() * 0.08,
        duration: 0.5 + Math.random() * 0.15,
        rot: (Math.random() - 0.5) * 540,
        dx: (Math.random() - 0.5) * 30,
        dy: 50 + Math.random() * 25,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 3,
      });
    }
    // 6 pieces from top-right corner
    for (let i = 0; i < 6; i++) {
      generated.push({
        id: i + 6,
        startX: 75 + Math.random() * 25,
        delay: Math.random() * 0.08,
        duration: 0.5 + Math.random() * 0.15,
        rot: (Math.random() - 0.5) * 540,
        dx: (Math.random() - 0.5) * 30,
        dy: 50 + Math.random() * 25,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 3,
      });
    }
    setPieces(generated);
  }, [show]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.startX}%`,
            top: '0',
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            ['--rot' as string]: `${p.rot}deg`,
            animation: `cell-confetti ${p.duration}s ease-out forwards`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes cell-confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
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
