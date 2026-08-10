'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#E88B5A', '#4A9B9B', '#F2D9A2', '#D8B8D0'];

interface Balloon {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  drift: number;
}

export default function BalloonBurst() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);

  useEffect(() => {
    const newBalloons: Balloon[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: (Math.random() - 0.5) * 60,
    }));
    setBalloons(newBalloons);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {balloons.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-0"
          style={{
            left: `${b.left}%`,
            ['--drift' as string]: `${b.drift}px`,
            animation: `balloon-rise ${b.duration}s ease-out forwards`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <div
            className="w-6 h-8 rounded-full"
            style={{ backgroundColor: b.color }}
          />
          <div
            className="w-px h-4 mx-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
        </div>
      ))}
      <style>{`
        @keyframes balloon-rise {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-120%) translateX(var(--drift));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
