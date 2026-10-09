// statement.tsx — a single beat. Eyebrow, headline, body, bridge.

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

export function Statement({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  return (
    <div
      data-slide-id={slide.id}
      data-template="statement"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="statement-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '32px',
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
          <h2
            data-field="headline"
            style={{
              ...typeStyle('display_1', tokens, typeScale),
              textWrap: 'balance',
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
              maxWidth: '85%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.body.text) }}
          />
        )}
        {fields.bridge && (
          <p
            data-field="bridge"
            style={{
              ...typeStyle('caption', tokens, typeScale),
              opacity: 0.65,
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.bridge.text) }}
          />
        )}
      </div>
      <Marquee marqueeId={marqueeId} aspect={aspect} tokens={tokens} />
    </div>
  );
}
