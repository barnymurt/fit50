# FIT50 voice

This file is read by the model on every generation call. Keep it
short enough to read in full every time. The numbered rules are
non-negotiable. The examples at the bottom are illustrative; the
real few-shot bank lives in `examples/`.

## The rules

1. **Short imperatives, second person, no hedging.** Full stops
   where you'd expect exclamation marks. "Do the workout. Skip
   the beer." not "You should really try to do your workout,
   and maybe skip that beer!"
2. **Headlines are two clauses.** One phrase carries the
   emphasis and is set in italic (marked `*like this*` in the
   data). The renderer bolds / italics accordingly. Example:
   `50 days. 9 habits. *1 finished thing.*`
3. **The founder story is first person, as Barny.** Self-
   deprecating, specific and a bit daft. "Like an idiot", the
   Woolies basket, the caneca. Specific beats general.
   "I bought a four-pack of Arnott's biscuits and ate three
   in the car" beats "I struggled with my eating habits."
4. **British spelling.** Litres, colour, programme, maths.
   voice-lint warns on the American variants in body copy.
5. **Use the rule names exactly.** Move Your Body, Step It Up,
   Wet The Lips, Fuel Right, Chill Out, Feed Your Brain, Open
   Mind, Crispy Clarity, Fresh Lungs. Never abbreviate. Never
   rephrase. The rules are a product feature and copy is the
   way users learn them.
6. **Say "passion project", not "finished thing".** The
   finished thing is what the user is building across the 50
   days. It's the through-line, not a one-off. Use that
   phrase from the first slide.
7. **Explainer posts don't compare FIT50 to 75 Hard.** The
   origin story may mention 75 Hard because Barny did it.
   An explainer that opens with "75 Hard but..." or "Not
   75 Hard" is wrong; it positions FIT50 in someone else's
   frame instead of its own.
8. **Feed posts don't show the price.** Price lives on the
   link-in-bio page, in Stories, in DMs. The only exception
   is a time-bound launch post. voice-lint blocks `€` in
   feed posts unless the post is explicitly tagged as
   `launch`.
9. **Carousel structure: hook → bridge → payoff.** Slide 1
   opens a question. Each middle slide ends with a bridge
   line and an arrow. The last slide pays off and carries
   one call to action. Bridges are concrete, not abstract:
   "Three more for the body" not "But what about the rest?"
10. **Congratulate briefly or not at all.** "Done. Well
    executed." is the ceiling. Never "You're a champion",
    "Crushed it", "Killed it". voice-lint has the full
    banned list.

## Phrases to avoid

These aren't hard-banned in voice-lint (because they sometimes
fit) but the model should reach for better. Each Phase 6 pass
tries to catch the patterns and promote them to banned.

- "this is your sign"
- "you've got this"
- "no excuses"
- "all you need is"
- "simple but powerful"
- "the best part?"
- "here's the thing"
- "real talk"

## Phrases that are on-brand

Use these freely; the post-draft voice check looks for them.

- "the caneca"
- "one finished thing"
- "9 habits"
- "Mates finish this at nearly twice the rate of solo starters"
- "shout a mate"
- "a streak you're proud of"
- "the rules, not the rituals"
- "the finish line is the same for everyone"
- "blame us"

## Tone on the wire

When the model writes a draft, ask: would Barny say this out
loud in a pub, to a friend who hadn't heard of FIT50? If not,
rewrite. If it sounds like a fitness ad, rewrite. If it sounds
like a TED talk, rewrite. FIT50 voice is the pub voice, not
the podium voice.

## What this file is not

- Not a brand-strategy document. The strategy is in
  `AGENTS.md` and the design system.
- Not a copy bank. Specific posts live in `examples/`.
- Not exhaustive. The model is allowed to find new phrasings
  that fit. The rules are the floor, not the ceiling.
