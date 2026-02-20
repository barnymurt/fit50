'use client';

import { useEffect, useRef } from 'react';
import WatercolourSection from './WatercolourSection';
import PaintDrips from './PaintDrips';

export default function Hero() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-screen flex">
      <WatercolourSection color="#E88B5A" className="w-full md:w-3/5 min-h-screen" seed={1}>
        <div className="pt-24 pb-16 px-8 md:px-16 flex flex-col justify-center h-full">
          <h1 className="font-display text-5xl md:text-7xl text-[#2A2A2A] leading-tight">
            THE<br />50-DAY<br />CHALLENGE
          </h1>
          <p className="font-body text-xl md:text-2xl text-[#2A2A2A]/80 mt-6 max-w-md">
            50 Days. 9 Daily Tasks. 1 Life-Changing Habit.
          </p>
          <div className="mt-10 flex gap-4">
            <button 
              onClick={() => document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#2A2A2A] text-[#FEFEFE] font-display text-sm px-8 py-4 uppercase tracking-wider hover:bg-[#2A2A2A]/80 transition-colors"
            >
              Start Now
            </button>
            <button 
              onClick={() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-[#2A2A2A] text-[#2A2A2A] font-display text-sm px-8 py-4 uppercase tracking-wider hover:bg-[#2A2A2A]/10 transition-colors"
            >
              See Rules
            </button>
          </div>
        </div>
      </WatercolourSection>

      <WatercolourSection color="#4A9B9B" className="hidden md:block w-2/5 min-h-screen" seed={2}>
        <div className="pt-24 pb-16 px-8 flex flex-col justify-center items-center h-full">
          <div className="w-48 h-48 rounded-full bg-[#FEFEFE]/20 flex items-center justify-center mb-8">
            <span className="font-display text-5xl text-[#FEFEFE]">50</span>
          </div>
          <h2 className="font-display text-3xl text-[#FEFEFE] text-center">
            DAYS
          </h2>
          <p className="font-body text-[#FEFEFE]/80 text-center mt-4">
            Build Unbreakable Habits
          </p>
        </div>
      </WatercolourSection>

      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: '60px', top: '60%' }}>
        <div className="overflow-hidden bg-[#4A9B9B] h-12 flex items-center">
          <div ref={marqueeRef} className="flex animate-marquee whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="font-display text-xl text-[#FEFEFE] mx-8">
                LET&apos;S GET AFTER IT! • 50 DAYS • BUILD YOUR BEST SELF • LET&apos;S GET AFTER IT! •
              </span>
            ))}
          </div>
        </div>
        <PaintDrips color="#4A9B9B" />
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
