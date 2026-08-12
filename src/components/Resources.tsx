import Section from './Section';
import Marquee from './Marquee';

interface ResourcesItem {
  category: string;
  title: string;
  description: string;
  href: string;
  affiliate?: boolean;
}

const RESOURCES: ResourcesItem[] = [
  {
    category: 'Smoking cessation',
    title: 'Quit resources',
    description: 'Curated links to NHS Smokefree, Quit.org, and the Smokefree app — pick the one that fits your style.',
    href: 'https://www.nhs.uk/smokefree',
  },
  {
    category: 'Drinking less',
    title: 'Non-alcoholic recipes',
    description: '50 zero-proof cocktails, mocktails, and infusions so the "no alcohol" rule never feels like a punishment.',
    href: 'https://www.bonappetit.com/recipes/slideshow/non-alcoholic-cocktail-recipes',
  },
  {
    category: 'Nutrition',
    title: 'Macro calculator',
    description: 'Plug in your stats, get a daily protein/carb/fat target. No app install, no sign-up, just numbers. Premium members get the full macrocalc with body fat support.',
    href: '/macrocalc',
  },
  {
    category: 'Meditation',
    title: 'Meditation apps',
    description: 'Direct links to Headspace, Calm, Waking Up, and Insight Timer — with a note on which one fits which kind of brain.',
    href: 'https://www.headspace.com',
    affiliate: true,
  },
  {
    category: 'Movement',
    title: 'Workout inspiration',
    description: 'YouTube channels and free programs for the 50 days. Beginner to advanced, all bodyweight.',
    href: 'https://www.youtube.com/results?search_query=bodyweight+workout+50+days',
  },
  {
    category: 'Tracking',
    title: 'Sleep + steps',
    description: "How to use your phone's built-in sleep and step tracking so the '10K steps' rule is friction-free.",
    href: 'https://support.apple.com/en-us/108789',
  },
];

export default function Resources({ id }: { id?: string }) {
  return (
    <Section
      id={id}
      className="relative text-ink overflow-hidden pt-40 md:pt-56"
      tone="paper"
    >
      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="FREE · CURATED · NO SCROLLING · OPEN THE LINK"
          separator="✦"
          speed={200}
          textClassName="text-ink/10"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-caption uppercase text-coral mb-3">
            Free for everyone
          </p>
          <h2 className="font-display text-display-1 text-ink mb-6 leading-[0.95]">
            The resources.
          </h2>
          <p className="font-display text-h2 text-ink/80 max-w-2xl mx-auto leading-tight">
            Curated links for each of the 9 rules. No googling. No scrolling.
            Open the link, do the thing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/15">
          {RESOURCES.map((item, i) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel={item.affiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
              className={`p-6 md:p-8 group hover:bg-cream/40 transition-colors block ${
                i % 2 === 0 ? 'border-r border-ink/15' : ''
              } ${i < RESOURCES.length - 2 ? 'border-b border-ink/15' : ''}`}
            >
              <p className="font-body text-caption uppercase text-ink/50 mb-2">
                {item.category}
              </p>
              <h3 className="font-display text-h3 text-ink mb-2 flex items-center gap-2">
                {item.title}
                <span className="text-ink/30 group-hover:text-coral group-hover:translate-x-1 transition-all">
                  →
                </span>
              </h3>
              <p className="font-body text-sm text-ink/70">
                {item.description}
              </p>
              {item.affiliate && (
                <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-3">
                  Affiliate link
                </p>
              )}
            </a>
          ))}
        </div>

        <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-12 text-center">
          Some links are affiliate links. We may earn a commission if you sign up — at no cost to you.
        </p>
      </div>
    </Section>
  );
}