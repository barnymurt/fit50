// render-slide.tsx — render a single slide to an HTML string.
// The HTML is the same one the editor will draw (Phase 3)
// and the same one Playwright will screenshot. No template
// logic; no inline styles are computed at screenshot time.

import { renderToString } from 'react-dom/server';
import { Cover } from './templates/cover.js';
import { Statement } from './templates/statement.js';
import { List } from './templates/list.js';
import { Numeral } from './templates/numeral.js';
import { IconCard } from './templates/icon-card.js';
import { CTA } from './templates/cta.js';
import { WorkoutLine } from './templates/workout-line.js';
import { typeTokensFor, type Aspect, type Ground, type Tokens } from './tokens.js';

import type { Slide as SlideT } from './schema/post.js';

function renderTemplate(slide: SlideT, aspect: Aspect, ground: Ground, marqueeId: string, tokens: Tokens): string {
  const props = { slide, aspect, ground, marqueeId, tokens };
  switch (slide.template) {
    case 'cover':
      return renderToString(Cover(props));
    case 'statement':
      return renderToString(Statement(props));
    case 'list':
      return renderToString(List(props));
    case 'numeral':
      return renderToString(Numeral(props));
    case 'icon-card':
      return renderToString(IconCard(props));
    case 'cta':
      return renderToString(CTA({ slide, aspect, ground, tokens }));
    case 'workout-line':
      return renderToString(WorkoutLine(props));
  }
}

// Re-export so consumers can import from one place.
import { loadTokens, typeScaleFor } from './tokens.js';

export async function renderSlide(slide: SlideT, aspect: Aspect, ground: Ground, marqueeId: string) {
  const tokens = await loadTokens();
  return renderTemplate(slide, aspect, ground, marqueeId, tokens);
}

export async function renderPostHTML(post: import('./schema/post.js').Post) {
  const tokens = await loadTokens();
  const aspect: Aspect = post.aspect;
  const marqueeId = post.marquee || 'marquee_default';
  return post.slides.map((slide, i) => ({
    index: i,
    id: slide.id,
    template: slide.template,
    ground: slide.ground,
    html: renderTemplate(slide, aspect, slide.ground, marqueeId, tokens),
    canvas: typeScaleFor(aspect, tokens).canvas,
  }));
}
