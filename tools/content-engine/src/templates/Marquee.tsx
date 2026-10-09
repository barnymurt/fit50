// Marquee.tsx — the static Lilita One band, used by every
// template except cta. Width is fixed by the tokens table;
// a wider line fails the marquee-fit check at draw time.

import React from 'react';
import {
  typeScaleFor,
  marqueeLine,
  marqueeLineWidth,
  type Aspect,
  type Tokens,
} from '../tokens.js';
import { typeStyle } from '../styles.js';

interface Props {
  marqueeId: string;
  aspect: Aspect;
  tokens: Tokens;
}

export function Marquee({ marqueeId, aspect, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const ml = marqueeLine(marqueeId, tokens);
  if (!ml) {
    return null;
  }
  const width = marqueeLineWidth(ml, aspect);
  const pad = tokens.marquee_lines.padding_px;
  return (
    <div
      data-section="marquee"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: `24px ${pad}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.colours[aspect === '9:16' ? 'ink' : 'coral'],
        color: tokens.colours.paper,
        ...typeStyle('marquee', tokens, typeScale),
      }}
    >
      <span
        data-section="marquee-text"
        style={{ whiteSpace: 'nowrap', display: 'inline-block' }}
        data-measured-width={width}
      >
        {ml.text}
      </span>
    </div>
  );
}

export function measureMarqueeWidth(ml: ReturnType<typeof marqueeLine>, aspect: Aspect): number {
  if (!ml) return Infinity;
  return marqueeLineWidth(ml, aspect);
}
