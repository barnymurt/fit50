'use client';

import WatercolourSection from './WatercolourSection';

const products = [
  {
    id: 'notion-template',
    emoji: '📱',
    name: 'Notion Template',
    price: '€1.99',
    description: 'Full digital tracker with streaks, reminders & analytics',
    link: '#',
  },
  {
    id: 'pdf-tracker',
    emoji: '📄',
    name: 'Enhanced PDF Tracker',
    price: '€4.99',
    description: 'Printable with tips, progress pages & goals',
    link: '#',
  },
  {
    id: 'complete-package',
    emoji: '🎁',
    name: 'Complete Package',
    price: '€9.99',
    description: 'Notion + PDF + meal guide + video links',
    link: '#',
  },
  {
    id: 'water-bottle',
    emoji: '🍶',
    name: 'Branded Water Bottle',
    price: '€12',
    description: 'Stay hydrated with FIT50 style',
    link: '#',
  },
];

export default function Shop() {
  return (
    <WatercolourSection color="#FEFEFE" className="py-24" seed={7}>
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="font-display text-4xl md:text-5xl text-[#2A2A2A] text-center mb-16">
          THE SHOP
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#F2D9A2]/30 p-6 rounded-lg hover:bg-[#F2D9A2]/50 transition-colors"
            >
              <div className="text-6xl mb-4 text-center">{product.emoji}</div>
              <h3 className="font-display text-xl text-[#2A2A2A] text-center">
                {product.name}
              </h3>
              <p className="font-body text-[#2A2A2A]/70 text-sm text-center mt-2">
                {product.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-2xl text-[#E88B5A]">
                  {product.price}
                </span>
                <button className="bg-[#2A2A2A] text-[#FEFEFE] font-display text-xs px-4 py-2 uppercase tracking-wider hover:bg-[#2A2A2A]/80 transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-body text-[#2A2A2A]/60">
            More products coming soon: Egg Timers, Training Tees, & Vests
          </p>
        </div>
      </div>
    </WatercolourSection>
  );
}
