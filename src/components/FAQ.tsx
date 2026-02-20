'use client';

import { useState } from 'react';
import WatercolourSection from './WatercolourSection';

const faqs = [
  {
    question: 'What happens if I miss a day?',
    answer: 'Life happens. If you miss a day, simply continue from where you are. The streak will reset, but your progress remains. The key is consistency over perfection.',
  },
  {
    question: 'Can I modify the workouts?',
    answer: 'Absolutely. The workouts are suggestions. Replace any exercise with a comparable movement. Push-ups → Dumbbell press, Pull-ups → Lat pulldowns, etc. The pattern (A→B→C→D) matters more than the specific exercises.',
  },
  {
    question: 'Do audiobooks count for reading?',
    answer: 'Yes! Audiobooks count. 10 minutes of listening equals 10 pages of reading. Some people absorb knowledge better through listening, and that\'s completely valid.',
  },
  {
    question: 'How cold should the cold shower be?',
    answer: 'As cold as you can handle. The goal is uncomfortable but bearable. Start with 30 seconds of cold at the end of your regular shower. Over time, you can make it colder and longer.',
  },
  {
    question: 'Can I start whenever I want?',
    answer: 'Yes! Pick any date to start. Use our calculator to see your finish date. Many people start on a Monday or the 1st of a month, but there\'s no perfect time—only the time you commit.',
  },
  {
    question: 'Do I need a gym membership?',
    answer: 'No. All workouts can be done at home with minimal equipment. Bodyweight exercises work perfectly. If you have dumbbells, great. If not, improvise with household items or just use your bodyweight.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <WatercolourSection color="#D8B8D0" className="py-24" seed={8}>
      <div className="max-w-4xl mx-auto px-8">
        <h2 className="font-display text-4xl md:text-5xl text-[#2A2A2A] text-center mb-16">
          FAQ
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="bg-[#FEFEFE] p-6 rounded-lg cursor-pointer hover:bg-[#FEFEFE]/90 transition-colors"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-lg text-[#2A2A2A]">
                  {faq.question}
                </h3>
                <span className="text-[#4A9B9B] text-2xl">
                  {openIndex === index ? '−' : '+'}
                </span>
              </div>
              
              {openIndex === index && (
                <p className="font-body text-[#2A2A2A]/80 mt-4 pt-4 border-t border-[#2A2A2A]/10">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="font-body text-[#2A2A2A] text-lg mb-6">
            Still have questions? Let's get you started.
          </p>
          <button 
            onClick={() => document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#2A2A2A] text-[#FEFEFE] font-display text-sm px-8 py-4 uppercase tracking-wider hover:bg-[#2A2A2A]/80 transition-colors"
          >
            Begin The Challenge →
          </button>
        </div>
      </div>
    </WatercolourSection>
  );
}
