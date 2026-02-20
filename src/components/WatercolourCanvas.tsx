'use client';

import { useEffect, useRef } from 'react';

interface WatercolourCanvasProps {
  color: string;
  seed?: number;
  className?: string;
}

export default function WatercolourCanvas({ color, seed = 1, className = '' }: WatercolourCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const random = (min: number, max: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return min + (x - Math.floor(x)) * (max - min);
    };

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'overlay';
    
    for (let i = 0; i < 15; i++) {
      const x = random(0, width);
      const y = random(0, height);
      const radiusX = random(50, 200);
      const radiusY = random(40, 150);
      const rotation = random(0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'multiply';
    
    for (let i = 0; i < 12; i++) {
      const x = random(0, width);
      const y = random(0, height);
      const radiusX = random(30, 100);
      const radiusY = random(25, 80);
      const rotation = random(0, Math.PI * 2);
      
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      
      const rgb = hexToRgb(color);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';

  }, [color, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ objectFit: 'cover' }}
    />
  );
}
