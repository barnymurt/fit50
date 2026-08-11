import Link from 'next/link';

export interface SixFeaturesItem {
  title: string;
  description: string;
}

export const SIX_FEATURES: SixFeaturesItem[] = [
  { title: 'Cloud sync', description: 'Your progress follows you across every device.' },
  { title: 'Streak protection', description: 'One free pass a week. Miss a day, the streak holds.' },
  { title: 'Daily reminders', description: 'A nudge at the time you pick.' },
  { title: 'Photo proof', description: 'Attach a photo to any check-in.' },
  { title: 'Completion certificate', description: 'A printable PDF on day 50 plus a shareable link.' },
  { title: 'Data export', description: 'Your 50 days as a CSV.' },
];

export default function SixFeatures({
  id,
  cta = true,
}: {
  id?: string;
  cta?: boolean;
}) {
  return (
    <section id={id} className="py-section bg-paper">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-7">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
              What you get
            </p>
            <h2 className="font-display text-display-2 text-ink leading-[0.95] mb-6">
              Everything in the pack.
            </h2>
            <p className="font-body text-base text-ink/70 max-w-xl">
              One payment, yours forever. Six features that turn the 50 days from a streak into a system.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/20 mb-12">
          {SIX_FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-6 md:p-8 ${i % 2 === 0 ? 'border-r border-b border-ink/20' : 'border-b border-ink/20'}`}
            >
              <h3 className="font-display text-h2 text-ink mb-2">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-ink/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {cta && (
          <div className="text-center">
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors"
            >
              Unlock for £7.99
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
