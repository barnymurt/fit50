// numeral.tsx — a single stat. Eyebrow, big number, body.

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

export function Numeral({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  return (
    <div
      data-slide-id={slide.id}
      data-template="numeral"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="numeral-content"
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
        {fields.number && (
          <p
            data-field="number"
            style={{
              ...typeStyle('numeral', tokens, typeScale),
              fontVariantNumeric: 'tabular-nums',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.number) }}
          />
        )}
        {fields.body && (
          <p
            data-field="body"
            style={{
              ...typeStyle('body', tokens, typeScale),
              textWrap: 'pretty',
              maxWidth: '70%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.body.text) }}
          />
        )}
      </div>
      <Marquee marqueeId={marqueeId} aspect={aspect} tokens={tokens} />
    </div>
  );
}
