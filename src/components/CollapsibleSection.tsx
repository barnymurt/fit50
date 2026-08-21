'use client';

/**
 * Collapsible section wrapper for /account.
 *
 * Collapse: always available. Header strip has a Collapse / Expand
 * toggle that hides the body when folded. State lives in
 * useAccountLayout.
 *
 * Reorder: premium-only. The header is a drag handle — press and
 * drag up or down to swap the section with its neighbour. While
 * dragging, a coral line appears at the drop position.
 */

interface CollapsibleSectionProps {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  // Premium-only. When set, the header becomes draggable.
  draggable?: boolean;
  // Whether this section is currently the one being dragged.
  // Parent flips this based on dragstart / dragend.
  isDragging?: boolean;
  // Drop indicator position. Parent updates this on dragover.
  isDragHover?: 'before' | 'after' | null;
  // Callbacks the parent uses to track drag state.
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
        className={`flex items-center justify-between gap-3 px-5 md:px-10 py-3 ${
          collapsed ? '' : 'border-b border-ink/10'
        } ${draggable ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
        title={draggable ? `Drag to reorder ${title}` : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          {draggable && (
            <span
              aria-hidden="true"
              className="font-body text-ink/40 text-base leading-none select-none"
            >
              ≡
            </span>
          )}
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
        <div className="flex items-center gap-2 shrink-0">
          {draggable && (
            <span className="font-body text-caption uppercase tracking-widest text-ink/30 hidden md:inline">
              Drag to reorder
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            aria-expanded={!collapsed}
            aria-controls={`${id}-content`}
            className="font-body text-caption uppercase tracking-widest text-ink/50 hover:text-coral transition-colors"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Collapsible body. Always in the DOM so the layout is stable. */}
      <div id={`${id}-content`} hidden={collapsed}>
        {children}
      </div>
    </div>
  );
}