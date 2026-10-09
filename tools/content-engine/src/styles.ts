// styles.ts — the inline style fragments the templates share.
// Keeping them as named fragments so every template reads from
// the same source for ground / text colour / type scale.

import {
  textColourFor,
  type Scale,
  Tokens,
  Ground,
  Aspect,
} from './tokens.js';

export function groundStyle(ground: Ground, tokens: Tokens) {
  return { backgroundColor: tokens.colours[ground] };
}

export function textStyle(ground: Ground, tokens: Tokens) {
  return { color: tokens.colours[textColourFor(ground)] };
}

export function pagePadding(aspect: Aspect, tokens: Tokens) {
  const s = aspect === '9:16' ? tokens.spacing.tiktok : tokens.spacing.instagram;
  return s.page_padding;
}

export function cardPadding(aspect: Aspect, tokens: Tokens) {
  const s = aspect === '9:16' ? tokens.spacing.tiktok : tokens.spacing.instagram;
  return s.card_padding;
}

export function typeStyle(
  scale: 'display_1' | 'display_2' | 'h1' | 'h2' | 'h3' | 'body' | 'eyebrow' | 'caption' | 'numeral' | 'marquee',
  tokens: Tokens,
  typeScale: TypeScale
): React.CSSProperties {
  const t = typeScale[scale];
  const family = (() => {
    if (scale === 'marquee') return tokens.fonts.marquee.family;
    if (scale === 'eyebrow' || scale === 'caption' || scale === 'body') return tokens.fonts.body.family;
    return tokens.fonts.display.family;
  })();
  const fallback = (() => {
    if (scale === 'marquee') return tokens.fonts.marquee.fallback;
    if (scale === 'eyebrow' || scale === 'caption' || scale === 'body') return tokens.fonts.body.fallback;
    return tokens.fonts.display.fallback;
  })();
  const style: React.CSSProperties = {
    fontFamily: `${family}, ${fallback}`,
    fontSize: `${t.size}px`,
    lineHeight: t.line_height,
    letterSpacing: `${t.tracking}em`,
    margin: 0,
    padding: 0,
  };
  if ('transform' in t && t.transform === 'uppercase') {
    style.textTransform = 'uppercase';
  }
  if (scale === 'display_1' || scale === 'display_2' || scale === 'h1' || scale === 'h2' || scale === 'numeral') {
    style.fontWeight = tokens.fonts.display.weight;
  }
  if (scale === 'marquee') {
    style.fontWeight = tokens.fonts.marquee.weight;
  }
  if (scale === 'body' || scale === 'eyebrow' || scale === 'caption') {
    style.fontWeight = tokens.fonts.body.weight;
  }
  return style;
}

export function wrapperStyle(
  ground: Ground,
  aspect: Aspect,
  tokens: Tokens,
  typeScale: TypeScale
): React.CSSProperties {
  return {
    width: typeScale.canvas.width,
    height: typeScale.canvas.height,
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    ...groundStyle(ground, tokens),
    ...textStyle(ground, tokens),
    fontFamily: `${tokens.fonts.body.family}, ${tokens.fonts.body.fallback}`,
    padding: `${pagePadding(aspect, tokens)}px`,
  };
}
