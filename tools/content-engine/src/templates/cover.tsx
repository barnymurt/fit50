// cover.tsx — slide 1 hook. Eyebrow, headline (with *emphasis*),
// sub. The marquee is the bottom band (per the spec).

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

export function Cover({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  return (
    <div
      data-slide-id={slide.id}
      data-template="cover"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="cover-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: '40px',
          height: '100%',
          paddingBottom: '160px',
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
          <h1
            data-field="headline"
            style={{
              ...typeStyle('display_2', tokens, typeScale),
              textWrap: 'balance',
              maxWidth: '90%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.headline.text) }}
          />
        )}
        {fields.sub && (
          <p
            data-field="sub"
            style={{
              ...typeStyle('body', tokens, typeScale),
              opacity: 0.7,
              maxWidth: '70%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.sub.text) }}
          />
        )}
      </div>
      <Marquee marqueeId={marqueeId} aspect={aspect} tokens={tokens} />
    </div>
  );
}
