'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#E88B5A', '#4A9B9B', '#F2D9A2', '#D8B8D0'];

function shade(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 0.7;
  return `rgb(${Math.floor(r * f)}, ${Math.floor(g * f)}, ${Math.floor(b * f)})`;
}

interface Confetto {
  left: number;
  delay: number;
  duration: number;
  rot: number;
  dx: number;
  color: string;
  size: number;
}

interface Balloon {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  drift: number;
  scale: number;
  confetti: Confetto[];
}

export default function BalloonBurst() {
  const [balloons, setBalloons] = useState<Balloon[]>([]);

  useEffect(() => {
    const newBalloons: Balloon[] = Array.from({ length: 72 }, (_, i) => {
      const confetti: Confetto[] = Array.from({ length: 3 }, () => ({
        left: (Math.random() - 0.5) * 30,
        delay: Math.random() * 0.4,
        duration: 0.9 + Math.random() * 0.6,
        rot: (Math.random() - 0.5) * 720,
        dx: (Math.random() - 0.5) * 60,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 4,
      }));
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        drift: (Math.random() - 0.5) * 100,
        scale: 0.7 + Math.random() * 0.6,
        confetti,
      };
    });
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
          {/* balloon body */}
          <div
            className="relative mx-auto"
            style={{
              width: `${22 * b.scale}px`,
              height: `${28 * b.scale}px`,
              background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.75), rgba(255,255,255,0) 40%), radial-gradient(ellipse at 50% 55%, ${b.color}, ${shade(b.color)})`,
              borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
              boxShadow: `inset -3px -4px 6px rgba(0,0,0,0.18), inset 2px 2px 4px rgba(255,255,255,0.4)`,
            }}
          >
            {/* knot */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '-4px',
                width: 0,
                height: 0,
                borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent',
                borderTop: `5px solid ${shade(b.color)}`,
              }}
            />
          </div>
          {/* string */}
          <div
            className="mx-auto"
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          {/* confetti bursts */}
          {b.confetti.map((c, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{
                left: `calc(50% + ${c.left}px)`,
                top: '45%',
                width: `${c.size}px`,
                height: `${c.size * 1.5}px`,
                backgroundColor: c.color,
                ['--dx' as string]: `${c.dx}px`,
                ['--rot' as string]: `${c.rot}deg`,
                animation: `confetti-fall ${c.duration}s ease-in forwards`,
                animationDelay: `${b.delay + c.delay}s`,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes balloon-rise {
          0% {
            bottom: 0%;
            transform: translateX(0) scale(0.85);
            opacity: 0;
          }
          30% {
            opacity: 1;
            transform: translateX(calc(var(--drift) * 0.3)) scale(1);
          }
          70% {
            opacity: 1;
          }
          100% {
            bottom: 88%;
            transform: translateX(var(--drift)) scale(0.95);
            opacity: 0;
          }
        }
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), 90px) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
