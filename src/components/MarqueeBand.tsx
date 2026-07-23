import Marquee from './Marquee';

export default function MarqueeBand() {
  return (
    <section className="bg-ink py-10 md:py-14 border-y border-rule-light">
      <Marquee
        text="FIT50 · 50 Days · 9 Habits · 1 Life"
        separator="•"
        speed={60}
        tone="dark"
      />
    </section>
  );
}
