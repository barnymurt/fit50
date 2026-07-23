import Section from './Section';
import Heading from './Heading';
import Icon from './Icon';

const products = [
  {
    id: 'notion-template',
    name: 'Notion Template',
    price: '€1.99',
    description: 'The full digital tracker — streaks, reminders, and analytics built in. Use it on phone or desktop.',
    link: '#',
    tag: 'Digital',
  },
  {
    id: 'pdf-tracker',
    name: 'Enhanced PDF',
    price: '€4.99',
    description: 'A printable 50-day tracker with tips, progress pages, and goal-setting prompts.',
    link: '#',
    tag: 'Print',
  },
  {
    id: 'complete-package',
    name: 'Complete Package',
    price: '€9.99',
    description: 'The Notion template + PDF + meal guide + video links. Everything in one bundle.',
    link: '#',
    tag: 'Bundle',
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    price: '€12',
    description: 'Stay hydrated with the marked FIT50 bottle. Sip, track, repeat.',
    link: '#',
    tag: 'Gear',
  },
];

export default function Shop() {
  return (
    <Section id="shop" tone="white" className="py-section" contained>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 md:mb-20">
        <div className="md:col-span-7">
          <p className="font-body text-caption uppercase text-ink/50 mb-4">
            The Shop
          </p>
          <Heading as="h2" size="display-2">
            Take it<br />
            further.
          </Heading>
        </div>
        <div className="md:col-span-5 md:col-start-8 flex items-end">
          <p className="font-body text-lg text-ink/70 max-w-md">
            Optional tools for people who want a deeper commitment. Every purchase funds the free tracker.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-rule">
        {products.map((product) => (
          <article
            key={product.id}
            className="group border-r border-b border-rule p-6 md:p-8 flex flex-col bg-white hover:bg-paper transition-colors duration-300"
          >
            <div className="aspect-square bg-paper mb-6 flex items-center justify-center text-ink/20 relative overflow-hidden">
              <span className="font-display text-h2 text-ink/30">FIT50</span>
              <span className="absolute top-3 left-3 font-body text-caption uppercase text-ink/50">
                {product.tag}
              </span>
            </div>

            <h3 className="font-display text-h2 text-ink mb-2">
              {product.name}
            </h3>
            <p className="font-body text-sm text-ink/60 mb-6 flex-1">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-rule">
              <span className="font-display text-h2 text-ink">
                {product.price}
              </span>
              <a
                href={product.link}
                className="inline-flex items-center gap-2 font-body text-caption uppercase text-ink hover:text-coral transition-colors duration-200 group/link"
              >
                Buy
                <span className="transition-transform duration-200 group-hover/link:translate-x-1">
                  <Icon name="arrow-right" size={14} />
                </span>
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-12 font-body text-sm text-ink/50">
        More gear coming soon: egg timers, training tees, vests.
      </p>
    </Section>
  );
}
