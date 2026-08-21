'use client';

import { useState } from 'react';

/**
 * Collapsible section wrapper for /account. Renders a transparent
 * header strip with the section name + a collapse toggle, then the
 * section content below. The section's own tone / background is
 * preserved (we don't paint over it).
 *
 * Collapse state is owned by useAccountLayout. The reorder ribbon
 * on the left edge only mounts when the hook passes move callbacks,
 * i.e. premium + edit mode.
 */

interface CollapsibleSectionProps {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  // Edit-mode controls. The hook only passes these when is_premium
  // is true AND editing is on, so they never appear for free users.
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  collapsed,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}: CollapsibleSectionProps) {
  const showEditControls = !!onMoveUp && !!onMoveDown;

  return (
    <div id={id} className="relative">
      {/* Reorder ribbon — only mounted when editing. Sits outside
          the section flow at the left so it doesn't shift content
          when it appears. */}
      {showEditControls && (
        <div
          className="absolute left-0 top-3 -translate-x-full hidden md:flex flex-col gap-1 pr-2 z-10"
          aria-label={`Reorder ${title}`}
        >
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${title} up`}
            title={`Move ${title} up`}
            className="w-7 h-7 flex items-center justify-center border border-ink/30 bg-paper text-ink/70 hover:bg-cream/40 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${title} down`}
            title={`Move ${title} down`}
            className="w-7 h-7 flex items-center justify-center border border-ink/30 bg-paper text-ink/70 hover:bg-cream/40 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
          >
            ▼
          </button>
        </div>
      )}

      {/* Always-visible header strip — transparent so the section's
          own background tone shows through. The bottom border is
          conditional on whether content is showing. */}
      <div
        className={`flex items-center justify-between gap-3 px-5 md:px-10 py-3 ${
          collapsed ? '' : 'border-b border-ink/10'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={`font-body text-ink/50 transition-transform duration-200 ${
              collapsed ? '' : 'rotate-90'
            }`}
          >
            ›
          </span>
          <p className="font-body text-caption uppercase tracking-widest text-ink/60 truncate">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`${id}-content`}
          className="font-body text-caption uppercase tracking-widest text-ink/50 hover:text-coral transition-colors shrink-0"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {/* Collapsible body. Always in the DOM so the layout is stable
          when collapsed/expanded; just hidden. */}
      <div
        id={`${id}-content`}
        hidden={collapsed}
      >
        {children}
      </div>
    </div>
  );
}