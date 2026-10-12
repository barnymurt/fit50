// list.tsx — eyebrow, headline, 3–5 items, bridge. Used by the
// rules, what worked, tips slides. Items have an optional
// detail line and an optional icon (Phase 5: SVG with
// currentColor recolouring by ground).

import React from 'react';
import { Marquee } from './Marquee.js';
import { Icon } from './Icon.js';
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

export function List({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  const items = fields.items || [];
  return (
    <div
      data-slide-id={slide.id}
      data-template="list"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="list-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
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
              ...typeStyle('h1', tokens, typeScale),
              textWrap: 'balance',
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.headline.text) }}
          />
        )}
        <ul
          data-section="list-items"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              data-item={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '14px 0',
                borderBottom:
                  i < items.length - 1
                    ? `1px solid ${tokens.colours.rule}`
                    : 'none',
              }}
            >
              <Icon name={item.icon} tokens={tokens} ground={ground} size={64} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  data-field="item-title"
                  style={{ ...typeStyle('h3', tokens, typeScale) }}
                >
                  {item.title}
                </span>
                {item.detail && (
                  <span
                    data-field="item-detail"
                    style={{
                      ...typeStyle('body', tokens, typeScale),
                      opacity: 0.7,
                    }}
                  >
                    {item.detail}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
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
