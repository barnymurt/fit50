// icon-card.tsx — one rule or one habit per slide. Icon, title, body.

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

export function IconCard({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  return (
    <div
      data-slide-id={slide.id}
      data-template="icon-card"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="icon-card-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: '32px',
          height: '100%',
          paddingBottom: '160px',
          boxSizing: 'border-box',
        }}
      >
        {fields.icon && (
          <img
            src={`./brand/icons/${fields.icon}.webp`}
            alt=""
            data-icon={fields.icon}
            width={220}
            height={220}
            style={{
              display: 'block',
              backgroundColor: tokens.colours.cream,
              opacity: 0.95,
            }}
          />
        )}
        {fields.title && (
          <h2
            data-field="title"
            style={{
              ...typeStyle('h2', tokens, typeScale),
              textWrap: 'balance',
              maxWidth: '85%',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.title.text) }}
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
