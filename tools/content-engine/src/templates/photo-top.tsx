// photo-top.tsx — a photo-led slide. Used by origin-story,
// member-progress, books-members-read, and passion-projects when
// the post has a hero image (member selfie, book cover, finished
// artefact, etc.). Phase 6 ships the template; the photo is a
// path that the renderer reads. Supabase Storage comes in 6.1.

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

export function PhotoTop({ slide, aspect, ground, marqueeId, tokens }: Props) {
  const typeScale = typeScaleFor(aspect, tokens);
  const fields = slide.fields;
  const photoPath = (fields as any).photo?.path;
  return (
    <div
      data-slide-id={slide.id}
      data-template="photo-top"
      data-ground={ground}
      style={wrapperStyle(ground, aspect, tokens, typeScale)}
    >
      <div
        data-section="photo-top-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          height: '100%',
          paddingBottom: '160px',
          boxSizing: 'border-box',
        }}
      >
        {photoPath && (
          <div
            data-section="photo"
            style={{
              flex: 1,
              background: tokens.colours.cream,
              border: `1px solid ${tokens.colours.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: '50%',
            }}
          >
            <img
              src={photoPath}
              alt=""
              data-field="photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
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
            }}
            dangerouslySetInnerHTML={{ __html: emphasis(fields.headline.text) }}
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
