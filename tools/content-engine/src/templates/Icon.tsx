// Icon.tsx — the inline icon renderer for the content engine.
// Reads the SVG file from disk (server-side only) and renders
// it with `currentColor` so the parent template can set the
// icon colour by ground. Falls back to the webp <img> if the
// SVG is missing.
//
// Used by all templates that render an icon (list items,
// icon-card, etc.).

import React from 'react';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Tokens, Ground } from '../tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = join(__dirname, '..', '..', 'brand', 'icons');

// Cache: avoids re-reading the file on every render during a
// post's worth of slides.
const cache = new Map<string, string>();

function readSvg(name: string): string | null {
  if (cache.has(name)) return cache.get(name)!;
  const path = join(ICON_DIR, `${name}.svg`);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    // Strip the XML declaration if present; react doesn't
    // need it for inline SVG and it can break some renderers.
    const stripped = raw.replace(/<\?xml[^?]*\?>/, '').trim();
    cache.set(name, stripped);
    return stripped;
  } catch {
    return null;
  }
}

interface Props {
  name?: string | null;
  tokens: Tokens;
  ground: Ground;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, tokens, ground, size = 64, className, style }: Props) {
  if (!name) return null;
  const inkTextGrounds: Ground[] = ['paper', 'lavender', 'white', 'cream'];
  const iconColor = inkTextGrounds.includes(ground) ? tokens.colours.ink : tokens.colours.paper;
  const svg = readSvg(name);
  if (svg) {
    return (
      <span
        data-icon={name}
        data-icon-source="svg"
        className={className}
        style={{
          display: 'inline-flex',
          width: size,
          height: size,
          color: iconColor,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  // Webp fallback — only reads correctly on cream / lavender /
  // paper / white grounds (no recolouring).
  return (
    <img
      src={`./brand/icons/${name}.webp`}
      alt=""
      data-icon={name}
      data-icon-source="webp"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        flexShrink: 0,
        backgroundColor: tokens.colours.cream,
        opacity: 0.95,
        ...style,
      }}
    />
  );
}
