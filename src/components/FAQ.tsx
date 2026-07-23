import Section from './Section';
import Button from './Button';
import Accordion from './Accordion';
import Marquee from './Marquee';

const faqs = [
  {
    question: 'What happens if I miss a day?',
    answer: 'Life happens. If you miss a day, simply continue from where you are. The streak resets, but your progress remains. The key is consistency over perfection — start again the next morning.',
  },
  {
    question: 'Can I modify the workouts?',
    answer: 'Absolutely. The workouts are suggestions, not scripture. Replace any exercise with a comparable movement: push-ups → dumbbell press, pull-ups → lat pulldowns, and so on. The A → B → C → D pattern matters more than the specific exercises.',
  },
  {
    question: 'Do audiobooks count for reading?',
    answer: 'Yes. Audiobooks count. 10 minutes of listening equals 10 pages of reading. Some people absorb knowledge better through listening — that is completely valid.',
  },
  {
    question: 'How cold should the cold shower be?',
    answer: 'As cold as you can handle. The goal is uncomfortable but bearable. Start with 30 seconds of cold at the end of your regular shower. Over time, you can make it colder and longer.',
  },
  {
    question: 'Can I start whenever I want?',
    answer: 'Yes. Pick any date to start. Use the calculator above to see your finish date. Many people start on a Monday or the 1st of a month, but there is no perfect time — only the time you commit.',
  },
  {
    question: 'Do I need a gym membership?',
    answer: 'No. All workouts can be done at home with minimal equipment. Bodyweight exercises work perfectly. If you have dumbbells, great. If not, improvise with household items.',
  },
];

export default function FAQ() {
  return (
    <Section
      id="faq"
      tone="ink"
      className="relative bg-cream/60 text-ink overflow-hidden pt-40 md:pt-56"
    >
      <h2 className="sr-only">Frequently asked questions</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="QUESTIONS · ANSWERS · STILL WONDERING"
          separator="✦"
          speed={200}
          textClassName="text-coral/60"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="md:col-span-5">
            <p className="font-body text-caption uppercase text-ink/60">
              Questions
            </p>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="font-body text-lg text-ink/70 max-w-lg">
              Still wondering? Start anyway. The rules are simple, the structure is clear, and the only way to fail is to stop.
            </p>
          </div>
        </div>

        <Accordion items={faqs} />

        <div className="mt-16 md:mt-20 pt-12 border-t border-ink/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="font-display text-h2 text-ink max-w-md">
            Less thinking. More doing.
          </p>
          <Button href="#tracker" variant="primary" tone="light">
            Take the Challenge
          </Button>
        </div>
      </div>
    </Section>
  );
}
