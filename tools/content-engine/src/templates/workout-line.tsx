// workout-line.tsx — the giant Fraunces line letter (A–D), the
// 5 exercises with sets × reps, the finisher. Mirrors the
// live FIT50 app's "workout line row" pattern.

import React from 'react';
import { Marquee } from './Marquee.js';
import {
  emphasis,
  typeScaleFor,
  type Aspect,
  type Tokens,
  type Ground,
} from '../tokens.js';
import { typeStyle, wrapperStyle } from '../styles.js';
import type { Slide } from '../schema/post.js';

interface Props {
  slide: Slide;
  aspect: Aspect;
  ground: Ground;
  marqueeId: string;
  tokens: Tokens;
}

export function WorkoutLine({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  const letter = fields.letter || fields.headline?.text || '';
  const exercises = fields.exercises || [];
  return (
    <div
      data-slide-id={slide.id}
      data-template="workout-line"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="workout-line-content"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '60px',
          height: '100%',
          paddingBottom: '160px',
          boxSizing: 'border-box',
          alignItems: 'center',
        }}
      >
        <div
          data-section="line-letter"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <span
            style={{
              ...typeStyle('numeral', tokens, typeScale),
              fontSize: '520px',
              lineHeight: 0.85,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {letter}
          </span>
        </div>
        <div
          data-section="exercises"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {fields.eyebrow && (
            <p
              data-field="eyebrow"
              style={{ ...typeStyle('eyebrow', tokens, typeScale) }}
              dangerouslySetInnerHTML={{ __html: emphasis(fields.eyebrow.text) }}
            />
          )}
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {exercises.map((ex, i) => (
              <li
                key={i}
                data-exercise={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '24px',
                  padding: '10px 0',
                  borderBottom: `1px solid ${tokens.colours.rule}`,
                }}
              >
                <span
                  data-field="exercise-name"
                  style={{ ...typeStyle('h3', tokens, typeScale) }}
                >
                  {ex.name}
                </span>
                <span
                  data-field="exercise-sets-reps"
                  style={{
                    ...typeStyle('caption', tokens, typeScale),
                    color: tokens.colours.coral,
                  }}
                >
                  {ex.sets} × {ex.reps}
                </span>
              </li>
            ))}
          </ol>
          {fields.finisher && (
            <p
              data-field="finisher"
              style={{
                ...typeStyle('body', tokens, typeScale),
                fontStyle: 'italic',
                opacity: 0.85,
                marginTop: '12px',
              }}
            >
              Finisher: {fields.finisher}
            </p>
          )}
          {fields.bridge && (
            <p
              data-field="bridge"
              style={{
                ...typeStyle('caption', tokens, typeScale),
                opacity: 0.65,
                marginTop: '8px',
              }}
              dangerouslySetInnerHTML={{ __html: emphasis(fields.bridge.text) }}
            />
          )}
        </div>
      </div>
      <Marquee marqueeId={marqueeId} aspect={aspect} tokens={tokens} />
    </div>
  );
}
