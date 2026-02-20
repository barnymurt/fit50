'use client';

import Link from 'next/link';

export default function Nav() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2A2A2A]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-display text-2xl text-[#FEFEFE] tracking-wider">
          FIT50
        </Link>
        <div className="hidden md:flex gap-4 items-center">
          <button onClick={() => scrollToSection('rules')} className="text-[#FEFEFE]/80 hover:text-[#FEFEFE] font-body text-sm uppercase tracking-wider">
            Rules
          </button>
          <button onClick={() => scrollToSection('workouts')} className="text-[#FEFEFE]/80 hover:text-[#FEFEFE] font-body text-sm uppercase tracking-wider">
            Workouts
          </button>
          <button onClick={() => scrollToSection('tracker')} className="text-[#FEFEFE]/80 hover:text-[#FEFEFE] font-body text-sm uppercase tracking-wider">
            Tracker
          </button>
          <button onClick={() => scrollToSection('shop')} className="text-[#FEFEFE]/80 hover:text-[#FEFEFE] font-body text-sm uppercase tracking-wider">
            Shop
          </button>
          <button onClick={() => scrollToSection('faq')} className="text-[#FEFEFE]/80 hover:text-[#FEFEFE] font-body text-sm uppercase tracking-wider">
            FAQ
          </button>
          <button 
            onClick={() => scrollToSection('tracker')}
            className="bg-[#E88B5A] text-[#FEFEFE] font-display text-xs px-4 py-2 uppercase tracking-wider hover:bg-[#E88B5A]/80 transition-colors"
          >
            Start Now
          </button>
        </div>
      </div>
    </nav>
  );
}
