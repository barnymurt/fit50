// render-slide.tsx — render a single slide to an HTML string.
// The HTML is the same one the editor will draw (Phase 3)
// and the same one Playwright will screenshot. No template
// logic; no inline styles are computed at screenshot time.

import { renderToString } from 'react-dom/server';
import { Cover } from './templates/cover';
import { Statement } from './templates/statement';
import { List } from './templates/list';
import { Numeral } from './templates/numeral';
import { IconCard } from './templates/icon-card';
import { CTA } from './templates/cta';
import { WorkoutLine } from './templates/workout-line';
import { PhotoTop } from './templates/photo-top';
import { loadTokens, typeScaleFor, type Aspect, type Ground, type Tokens } from './tokens';

import type { Slide as SlideT } from './schema/post';

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
      return renderToString(CTA({ ...props, tokens }));
    case 'workout-line':
      return renderToString(WorkoutLine(props));
    case 'photo-top':
      return renderToString(PhotoTop(props));
  }
  return '';
}

// Re-export so consumers can import from one place.
export async function renderSlide(slide: SlideT, aspect: Aspect, ground: Ground, marqueeId: string) {
  const tokens = await loadTokens();
  return renderTemplate(slide, aspect, ground, marqueeId, tokens);
}

export async function renderPostHTML(post: import('./schema/post').Post) {
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
