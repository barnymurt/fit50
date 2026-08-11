import Link from 'next/link';

export interface SixFeaturesItem {
  title: string;
  description: string;
}

export const SIX_FEATURES: SixFeaturesItem[] = [
  {
    title: 'Task completion tracker',
    description: 'Tap to mark each of the nine daily habits. Your streak builds automatically.',
  },
  {
    title: 'Streak protection',
    description: 'One free pass a week. Miss a day and the streak holds. Each save shows up as a 🍌 on your certificate.',
  },
  {
    title: 'Water tracker tool',
    description: 'Tap to log each glass. Saved to your account daily, target built in.',
  },
  {
    title: 'Detailed macro food tracker',
    description: 'Search 1000+ foods, log portions, tag meals. Totals fill up against your targets.',
  },
  {
    title: 'Multi-purpose timer',
    description: 'Built-in timer for reading, meditation, focus blocks. Presets included.',
  },
  {
    title: 'To-do planning board',
    description: 'Plan the 50 days with kanban columns. Drag tasks between To do, In progress, Done.',
  },
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
              Sign up
            </p>
            <h2 className="font-display text-display-2 text-ink leading-[0.95] mb-6">
              Sign up for helpful tools.
            </h2>
            <p className="font-body text-base text-ink/70 max-w-xl">
              Buy us a beer for a handful of helpful tools. €5.99 one-time, yours forever.
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
              Sign up for €5.99
            </Link>
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-3">
              The price of a caneca · one-time · yours forever
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
