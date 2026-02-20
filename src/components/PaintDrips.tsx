'use client';

import { useEffect, useRef } from 'react';

interface PaintDripsProps {
  color: string;
  className?: string;
}

export default function PaintDrips({ color, className = '' }: PaintDripsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);
    const width = canvas.width;
    
    for (let i = 0; i < 8; i++) {
      const x = (width / 8) * i + Math.random() * 50;
      const height = 20 + Math.random() * 35;
      const dripWidth = 8 + Math.random() * 12;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x - dripWidth / 2, 0);
      ctx.quadraticCurveTo(x - dripWidth / 4, height * 0.3, x, height);
      ctx.quadraticCurveTo(x + dripWidth / 4, height * 0.3, x + dripWidth / 2, 0);
      ctx.fill();
    }

  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={60}
      className={`absolute bottom-0 left-0 right-0 pointer-events-none ${className}`}
      style={{ height: '55px' }}
    />
  );
}
