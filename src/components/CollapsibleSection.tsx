'use client';

/**
 * Collapsible section wrapper for /account.
 *
 * Collapse: the down-chevron button toggles the body. State lives
 * in useAccountLayout.
 *
 * Reorder (premium only): the header is the drag handle. A "≡"
 * grip icon on the left telegraphs the affordance. While dragging
 * the page auto-scrolls when the pointer approaches the top or
 * bottom edge of the viewport. A coral drop line appears at the
 * target slot.
 *
 * Layout: both controls (≡ drag handle + v collapse) sit on the
 * LEFT side of the header so the fixed right-side AccountNav on
 * desktop doesn't cover them.
 */

interface CollapsibleSectionProps {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragHover?: 'before' | 'after' | null;
  onDragStart?: () => void;
  onDragOver?: (side: 'before' | 'after') => void;
  onDragLeave?: () => void;
  onDrop?: (side: 'before' | 'after') => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  collapsed,
  onToggle,
  draggable = false,
  isDragging = false,
  isDragHover = null,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  children,
}: CollapsibleSectionProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/x-fit50-section', id);
    onDragStart?.();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    onDragOver?.(side);
    // Auto-scroll: when the pointer is near the top or bottom edge
    // of the viewport, scroll the page in that direction so the
    // user can drag a section into view from off-screen.
    const edgePx = 60;
    const speed = 12;
    const y = e.clientY;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;
    if (y < edgePx && sy > 0) {
      window.scrollTo({ top: Math.max(0, sy - speed), behavior: 'instant' as ScrollBehavior });
    } else if (y > vh - edgePx && sy < max) {
      window.scrollTo({ top: Math.min(max, sy + speed), behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only fire leave when the pointer actually exits the section's
    // bounding rect. The browser fires dragleave for child elements
    // too; checking relatedTarget prevents flicker.
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
    onDragLeave?.();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    onDrop?.(side);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div
      id={id}
      className={`relative ${isDragging ? 'opacity-40' : ''} transition-opacity`}
      data-section-id={id}
      data-section-draggable={draggable ? 'true' : undefined}
    >
      {/* Drop indicator — coral bar at top or bottom of this section. */}
      {draggable && isDragHover === 'before' && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-0.5 bg-coral pointer-events-none z-20"
        />
      )}
      {draggable && isDragHover === 'after' && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral pointer-events-none z-20"
        />
      )}

      {/* Header strip — drag handle when reorder is allowed. */}
      <div
        draggable={draggable || undefined}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={`flex items-center gap-2 px-5 md:px-10 py-3 ${
          collapsed ? '' : 'border-b border-ink/10'
        } ${draggable ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
        title={draggable ? `Drag to reorder ${title}` : undefined}
      >
        {/* Controls — both on the LEFT so the fixed right-side
            AccountNav on desktop doesn't cover them. */}
        {draggable && (
          <span
            aria-hidden="true"
            data-drag-handle="true"
            className="font-body text-ink/50 text-lg leading-none select-none px-1"
          >
            ≡
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`${id}-content`}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          className={`font-body text-ink/60 hover:text-coral transition-transform duration-200 select-none ${
            collapsed ? '' : 'rotate-90'
          }`}
          // Keep the collapse button out of the drag flow: a tap on
          // it should never be mis-read as a drag.
          onMouseDown={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          v
        </button>
        <p className="font-body text-caption uppercase tracking-widest text-ink/60 truncate ml-1">
          {title}
        </p>
        {draggable && (
          <span className="font-body text-caption uppercase tracking-widest text-ink/30 hidden md:inline ml-auto">
            Drag to reorder
          </span>
        )}
      </div>

      {/* Collapsible body. Always in the DOM so the layout is stable. */}
      <div id={`${id}-content`} hidden={collapsed}>
        {children}
      </div>
    </div>
  );
}