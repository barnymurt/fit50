// cta.tsx — last slide. Eyebrow, headline, body, button. No
// marquee (per the spec: "Buttons, pill, coral, last slide only;
// coral stays the one action per view").

import React from 'react';
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
  tokens: Tokens;
}

export function CTA({ slide, aspect, ground, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  return (
    <div
      data-slide-id={slide.id}
      data-template="cta"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="cta-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: '40px',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {fields.eyebrow && (
          <p
            data-field="eyebrow"
            style={{ ...typeStyle('eyebrow', tokens, typeScale) }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.eyebrow.text) }}
          />
        )}
        {fields.headline && (
          <h2
            data-field="headline"
            style={{
              ...typeStyle('display_2', tokens, typeScale),
              textWrap: 'balance',
              maxWidth: '85%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.headline.text) }}
          />
        )}
        {fields.body && (
          <p
            data-field="body"
            style={{
              ...typeStyle('body', tokens, typeScale),
              textWrap: 'pretty',
              maxWidth: '75%',
              opacity: 0.8,
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.body.text) }}
          />
        )}
        {fields.button && (
          <span
            data-field="button"
            style={{
              ...typeStyle('caption', tokens, typeScale),
              backgroundColor: tokens.colours.coral,
              color: tokens.colours.paper,
              padding: '20px 56px',
              display: 'inline-block',
            }}
          >
            {fields.button.text}
          </span>
        )}
      </div>
    </div>
  );
}
