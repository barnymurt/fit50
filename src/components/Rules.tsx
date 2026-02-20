'use client';

import { useState } from 'react';
import WatercolourSection from './WatercolourSection';
import PaintSplatter from './PaintSplatter';

const rules = [
  {
    id: 1,
    emoji: '🚿',
    title: 'Chill Out',
    description: 'Take a cold shower every day. End your shower with 30 seconds of cold water.',
    tip: 'Start with 10 seconds and work your way up. The discomfort is temporary, the benefits are lasting.',
  },
  {
    id: 2,
    emoji: '🥗',
    title: 'Fuel Right',
    description: 'Track your macros every day. Hit your protein, carb, and fat targets.',
    tip: 'Use a free app like MyFitnessPal. Consistency matters more than perfection.',
  },
  {
    id: 3,
    emoji: '🍺',
    title: 'Crispy Clarity',
    description: 'No alcohol for 50 days. Complete sobriety during the challenge.',
    tip: 'Find alternative celebrations. Laughter is better than liquor anyway.',
  },
  {
    id: 4,
    emoji: '🚭',
    title: 'Fresh Lungs',
    description: 'No smoking or vaping. Zero nicotine during the 50 days.',
    tip: 'Cravings last 5 minutes. Drink water, walk, or chew gum when they hit.',
  },
  {
    id: 5,
    emoji: '🧘',
    title: 'Open Mind',
    description: 'Meditate for 10 minutes every day. Sit in silence and breathe.',
    tip: 'Use an app like Headspace or Calm. Start with just 5 minutes if 10 feels hard.',
  },
  {
    id: 6,
    emoji: '💪',
    title: 'Move Your Body',
    description: 'Complete one workout from the four lines (A, B, C, D) every day.',
    tip: 'Do something every day, even if it\'s light. Motion creates emotion.',
  },
  {
    id: 7,
    emoji: '💧',
    title: 'Wet The Lips',
    description: 'Drink 2.5 litres of water every day. Stay hydrated, stay focused.',
    tip: 'Get a marked bottle. Sip throughout the day, don\'t chug at the end.',
  },
  {
    id: 8,
    emoji: '👟',
    title: 'Keep Walking',
    description: 'Walk 10,000 steps every day. Your body was made to move.',
    tip: 'Park further away, take the stairs, or walk while you talk on the phone.',
  },
  {
    id: 9,
    emoji: '📚',
    title: 'Feed Your Brain',
    description: 'Read 10 pages every day. Feed your mind with knowledge.',
    tip: 'Keep a book everywhere. Waiting becomes reading time.',
  },
];

export default function Rules() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <WatercolourSection color="#4A9B9B" className="py-24" seed={4} includeDrips>
      <div className="max-w-7xl mx-auto px-8 relative">
        <PaintSplatter color="#E88B5A" className="top-0 right-0 w-64 h-48" seed={10} />
        
        <h2 className="font-display text-4xl md:text-5xl text-[#FEFEFE] text-center mb-16">
          THE 9 RULES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
              className="bg-[#FEFEFE]/10 backdrop-blur-sm p-6 rounded-lg cursor-pointer transition-all hover:bg-[#FEFEFE]/20"
            >
              <div className="flex items-start gap-4">
                <span className="font-display text-4xl text-[#FEFEFE]/20">
                  {rule.id.toString().padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <span className="text-3xl">{rule.emoji}</span>
                  <h3 className="font-display text-xl text-[#FEFEFE] mt-2">
                    {rule.title}
                  </h3>
                  <p className="font-body text-[#FEFEFE]/80 text-sm mt-2">
                    {rule.description}
                  </p>
                  
                  {expandedId === rule.id && (
                    <div className="mt-4 p-4 bg-[#F2D9A2]/20 rounded">
                      <p className="font-body text-[#FEFEFE] text-sm italic">
                        💡 {rule.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WatercolourSection>
  );
}
