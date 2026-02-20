'use client';

import { useEffect, useRef } from 'react';

interface PaintSplatterProps {
  color: string;
  seed?: number;
  className?: string;
}

export default function PaintSplatter({ color, seed = 1, className = '' }: PaintSplatterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const random = (min: number, max: number) => {
      const x = Math.sin(seed * 9999 + min) * 10000;
      return min + (x - Math.floor(x)) * (max - min);
    };

    const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

    const drawSplatter = (cx: number, cy: number, size: number) => {
      const points = 12;
      const coords: { x: number; y: number }[] = [];
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = size * (0.6 + random(0, 0.4));
        coords.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        });
      }

      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      
      for (let i = 0; i < points; i++) {
        const p0 = coords[i];
        const p1 = coords[(i + 1) % points];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }
      
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`);
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const drawDroplet = (x: number, y: number, size: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    const mainX = canvas.width / 2 + random(-200, 200);
    const mainY = canvas.height / 2 + random(-150, 150);
    drawSplatter(mainX, mainY, random(80, 150));

    for (let i = 0; i < 8; i++) {
      const angle = random(0, Math.PI * 2);
      const dist = random(60, 200);
      const size = random(5, 20);
      drawDroplet(mainX + Math.cos(angle) * dist, mainY + Math.sin(angle) * dist, size);
    }

  }, [color, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className={`absolute pointer-events-none ${className}`}
      style={{ objectFit: 'contain' }}
    />
  );
}
