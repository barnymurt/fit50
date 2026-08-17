import Link from 'next/link';
import Heading from '@/components/Heading';
import Button from '@/components/Button';

export const metadata = {
  title: 'About — FIT50',
  description:
    'How a backyard ultra, a pile of books, and three beers at the pub became nine disciplines, fifty days, and one finished thing.',
};

export default function AboutPage() {
  return (
    <main className="bg-paper text-ink">
      <article
        className="mx-auto"
        style={{
          maxWidth: '880px',
          paddingTop: 'clamp(5rem, 10vw, 7rem)',
          paddingBottom: 'clamp(5rem, 10vw, 7rem)',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <p className="font-body text-caption uppercase text-coral mb-6">
          The story
        </p>

        <Heading
          as="h1"
          size="display-2"
          className="text-ink leading-[1.05] mb-16"
        >
          Fifty days, nine disciplines, one finished thing.
        </Heading>

        <div className="space-y-16">
          <section>
            <Heading
              as="h2"
              size="h2"
              className="text-ink leading-[1.05] mb-6"
            >
              Stack 'em up obvs!
            </Heading>
            <div
              className="space-y-4"
              style={{
                fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
                fontSize: '1.25rem',
                lineHeight: '1.55',
                color: 'var(--ink-soft, #4C4568)',
              }}
            >
              <p>
                For those who don't know: a backyard ultra is a type of
                ultramarathon created by Gary "Lazarus Lake" Cantrell. The
                race has one winner and everyone else proudly DNFs. On the
                hour, every hour, you run 6.7km until you can't anymore. Last
                person running wins. So I was in the proudly Did Not Finish
                category, with blood-blistered feet and a twisting stomach
                full of race nutrition that was more than insistent I take
                the DNF.
              </p>
              <p>
                Without much more explanation about me, you might assume I'm
                always up for a challenge — which is how I ended up stacking
                75 Hard on top of a backyard ultra. The only sensible
                option, obvs!
              </p>
            </div>
          </section>

          <section>
            <Heading
              as="h2"
              size="h2"
              className="text-ink leading-[1.05] mb-6"
            >
              Raised eyebrows in Duty free
            </Heading>
            <div
              className="space-y-4"
              style={{
                fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
                fontSize: '1.25rem',
                lineHeight: '1.55',
                color: 'var(--ink-soft, #4C4568)',
              }}
            >
              <p>
                Having to get up at 5am to read my ten pages before starting
                race-day prep was a unique experience, let me tell you. Two
                45-minute workouts the day after finishing the ultra was
                also something I wouldn't put in the "fun" column.
              </p>
              <p>
                On the other hand, being on international flights from
                Europe to sunny Australia and figuring out how to drink a
                gallon of water and get two 45-minute workouts done in a
                compressed transit window was surprisingly amusing.
                Definitely got some sideways looks doing loops of the
                duty-free hallways between flights.
              </p>
              <p>
                About two months in, I remember going for a hike with
                friends and telling them 75 Hard had become a bit joyless.
                I was showing up because I'd made the commitment and my grit
                wouldn't let me quit. I was at least still enjoying the
                knowledge I was gaining from the non-fiction reading. But it
                wasn't compounding into anything I could use.
              </p>
              <p>
                And when day 75 rolled past I celebrated by filling a
                Woolies basket with every possible piece of Aussie junk
                food I could carry. Which, if I do the maths, is not the
                correct response to finishing a challenge that's supposed to
                change your habits.
              </p>
            </div>
          </section>

          <section>
            <Heading
              as="h2"
              size="h2"
              className="text-ink leading-[1.05] mb-6"
            >
              Left holding the basket
            </Heading>
            <div
              className="space-y-4"
              style={{
                fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
                fontSize: '1.25rem',
                lineHeight: '1.55',
                color: 'var(--ink-soft, #4C4568)',
              }}
            >
              <p>
                I'd finished a hard fitness and mental endurance challenge,
                and yes — I was in good shape and I had some pride in my
                mental toughness. But it didn't feel tangible. I couldn't
                point to a specific artefact or project and say "out of all
                that time and discipline, I built that. I made this."
              </p>
              <p>
                I'd put money on a large portion of my friends telling you
                I do slightly unhinged things for fun. I don't need
                convincing to sign up for hard. What I needed was hard and
                worth it.
              </p>
            </div>
          </section>

          <section>
            <Heading
              as="h2"
              size="h2"
              className="text-ink leading-[1.05] mb-6"
            >
              Three beers later
            </Heading>
            <div
              className="space-y-4"
              style={{
                fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
                fontSize: '1.25rem',
                lineHeight: '1.55',
                color: 'var(--ink-soft, #4C4568)',
              }}
            >
              <p>
                Fast forward six months and the discipline of 75 Hard was a
                distant memory. I was still running consistently, my diet
                was okay but I wasn't tracking anything anymore, and my
                reading had dropped off a cliff I'd fallen back on audiobook
                if that still counts. One evening out for a few beers with
                my mate we were discussing 75 Hard and whether to go another
                round. As we discussed it, we started making alterations
                to how we'd do it differently. Call it three beers later
                we had the bones of FIT50: nine disciplines, a fifty-day
                timeframe, and something to stimulate the mind with
                purpose.
              </p>
              <p>
                There's a smaller reason we feel FIT50 works the way it
                does. It's well documented that when you stop drinking or
                smoking your brain looks for other stimulus. Willpower can
                help, but having something else to think about is what
                makes the true difference. A craving lasts five minutes. A
                project you're passionate about swallows those cravings
                whole. We hope FIT50 starts you on that project from day
                one giving you the purpose that extends past day 50.
              </p>
              <p
                style={{
                  fontWeight: 500,
                  color: 'var(--color-ink, #1A1A1A)',
                }}
              >
                That's the pitch, and the confession.
              </p>
              <p
                style={{
                  fontWeight: 500,
                  color: 'var(--color-ink, #1A1A1A)',
                }}
              >
                Fifty days, nine disciplines, one finished thing.
              </p>
              <p
                style={{
                  fontWeight: 500,
                  color: 'var(--color-ink, #1A1A1A)',
                }}
              >
                Now it's yours.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 flex justify-center">
          <Button href="/#tracker" variant="primary" tone="light" shape="pill">
            Take the Challenge →
          </Button>
        </div>

        <p
          className="leading-none text-right"
          style={{
            fontFamily: 'var(--font-display, Fraunces), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            color: 'var(--color-coral, #E88B5A)',
            letterSpacing: '-0.01em',
            marginTop: '4rem',
          }}
        >
          — Barny
        </p>

        <div className="mt-12 pt-8 border-t border-ink/15 text-right">
          <Link
            href="/#rules"
            className="font-body text-caption uppercase text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral transition-colors"
          >
            ← Back to the nine rules
          </Link>
        </div>
      </article>
    </main>
  );
}
