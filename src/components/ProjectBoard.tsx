'use client';

import { useEffect, useRef, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

type ColumnId = string;
type TagColor = 'paper' | 'teal' | 'coral' | 'cream' | 'lavender' | 'ink';

interface BoardSubtask {
  id: string;
  itemId: string;
  text: string;
  completed: boolean;
  orderIdx: number;
}

interface BoardTag {
  id: string;
  itemId: string;
  label: string;
  color: TagColor;
}

interface BoardAttachment {
  id: string;
  itemId: string;
  name: string;
  url: string;
  kind: 'link' | 'image' | 'doc' | 'other';
}

interface BoardItem {
  id: string;
  text: string;
  columnId: ColumnId;
  createdAt: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  priority?: number;
  subtasks: BoardSubtask[];
  tags: BoardTag[];
  attachments: BoardAttachment[];
}

interface BoardColumn {
  id: ColumnId;
  label: string;
  color: TagColor;
}

interface TodoItem {
  id: string;
  text: string;
  columnId: 'todos';
  createdAt: string;
}

interface BoardState {
  columns: BoardColumn[];
  items: BoardItem[];
  todos: TodoItem[];
}

const DEFAULT_BOARD: BoardState = {
  columns: [
    { id: 'todo', label: 'To do', color: 'paper' },
    { id: 'progress', label: 'In progress', color: 'teal' },
    { id: 'done', label: 'Done', color: 'coral' },
  ],
  items: [
    {
      id: 'seed-1',
      text: 'Pick the four recipes for the week',
      columnId: 'todo',
      createdAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      attachments: [],
    },
    {
      id: 'seed-2',
      text: 'Walk 10,000 steps',
      columnId: 'todo',
      createdAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      attachments: [],
    },
    {
      id: 'seed-3',
      text: 'Read 10 pages',
      columnId: 'progress',
      createdAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      attachments: [],
    },
  ],
  todos: [],
};

const STORAGE_KEY = 'fit50-board-v2';

const COLUMN_COLORS = ['paper', 'teal', 'coral', 'cream', 'lavender', 'ink'] as const;

export function useBoardState() {
  const { user } = useAuth();
  const supabase = createClient();
  const [state, setState] = useState<BoardState>(DEFAULT_BOARD);
  const [hydrated, setHydrated] = useState(false);
  const dragItem = useRef<{ id: string; fromColumnId: ColumnId | 'todos' } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadFromRemote = async () => {
      if (!user || !supabase) {
        const saved = loadJson<BoardState>(STORAGE_KEY, DEFAULT_BOARD);
        if (!cancelled) {
          setState(saved);
          setHydrated(true);
        }
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [colsRes, itemsRes] = await Promise.all([
          (supabase.from('board_columns') as any)
            .select('id, label, color, order_idx')
            .eq('user_id', user.id)
            .order('order_idx', { ascending: true }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('board_items') as any)
            .select('id, column_id, text, order_idx, created_at')
            .eq('user_id', user.id)
            .order('order_idx', { ascending: true }),
        ]);
        if (cancelled) return;
        const cols: BoardColumn[] = (colsRes.data || []).map(
          (r: { id: string; label: string; color: string }) => ({
            id: r.id,
            label: r.label,
            color: (r.color ?? 'paper') as TagColor,
          })
        );
        // Hydrate items in three passes: items first (so subtasks /
        // tags / attachments can reference item_id), then the related
        // tables. Subtasks, tags, and attachments are pulled in a
        // single round-trip each so the user sees a fully-populated
        // card on first load.
        const itemsRaw = (itemsRes.data || []) as Array<{
          id: string;
          column_id: string;
          text: string;
          description: string | null;
          due_date: string | null;
          completed_at: string | null;
          priority: number | null;
          order_idx: number;
          created_at: string;
        }>;
        const itemIds = itemsRaw.map((r) => r.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [subsRes, tagsRes, attsRes] = await Promise.all([
          itemIds.length > 0
            ? (supabase.from('board_item_subtasks') as any)
                .select('id, item_id, text, completed, order_idx')
                .eq('user_id', user.id)
                .in('item_id', itemIds)
            : { data: [] },
          itemIds.length > 0
            ? (supabase.from('board_item_tags') as any)
                .select('id, item_id, label, color')
                .eq('user_id', user.id)
                .in('item_id', itemIds)
            : { data: [] },
          itemIds.length > 0
            ? (supabase.from('board_item_attachments') as any)
                .select('id, item_id, name, url, kind')
                .eq('user_id', user.id)
                .in('item_id', itemIds)
            : { data: [] },
        ]);
        const items: BoardItem[] = itemsRaw.map((r) => ({
          id: r.id,
          text: r.text,
          columnId: r.column_id,
          createdAt: r.created_at,
          description: r.description ?? undefined,
          dueDate: r.due_date ?? undefined,
          completedAt: r.completed_at ?? undefined,
          priority: r.priority ?? undefined,
          subtasks: [],
          tags: [],
          attachments: [],
        }));
        // Hydrate children in item-id buckets so we can stitch them
        // back onto the parent items in O(items + children).
        const itemsById = new Map(items.map((it) => [it.id, it]));
        for (const s of (subsRes.data ?? []) as Array<{
          id: string; item_id: string; text: string; completed: boolean; order_idx: number;
        }>) {
          const it = itemsById.get(s.item_id);
          if (it) it.subtasks.push({
            id: s.id, itemId: s.item_id, text: s.text,
            completed: s.completed, orderIdx: s.order_idx,
          });
        }
        for (const t of (tagsRes.data ?? []) as Array<{
          id: string; item_id: string; label: string; color: string;
        }>) {
          const it = itemsById.get(t.item_id);
          if (it) it.tags.push({
            id: t.id, itemId: t.item_id, label: t.label,
            color: (t.color ?? 'paper') as TagColor,
          });
        }
        for (const a of (attsRes.data ?? []) as Array<{
          id: string; item_id: string; name: string; url: string; kind: string;
        }>) {
          const it = itemsById.get(a.item_id);
          if (it) it.attachments.push({
            id: a.id, itemId: a.item_id, name: a.name, url: a.url,
            kind: (a.kind ?? 'link') as BoardAttachment['kind'],
          });
        }
        // Seed defaults if user has no columns yet
        const next: BoardState = {
          columns: cols.length > 0 ? cols : DEFAULT_BOARD.columns,
          items,
          todos: [], // To-do list lives elsewhere (todo_items)
        };
        setState(next);
        saveJson(STORAGE_KEY, next);
        setHydrated(true);
      } catch (err) {
        console.error('board sync failed:', err);
        const saved = loadJson<BoardState>(STORAGE_KEY, DEFAULT_BOARD);
        if (!cancelled) {
          setState(saved);
          setHydrated(true);
        }
      }
    };
    loadFromRemote();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, state);
    if (user && supabase) {
      // Persist columns + items to Supabase. Errors are non-fatal
      // — local cache is the source of truth until the next load.
      (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const colsRes = await (supabase.from('board_columns') as any).upsert(
            state.columns.map((c, i) => ({
              user_id: user.id,
              id: c.id,
              label: c.label,
              color: c.color,
              order_idx: i,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'user_id,id' }
          );
          if (colsRes.error) console.error('board_columns upsert:', colsRes.error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const itemsRes = await (supabase.from('board_items') as any).upsert(
            state.items.map((it, i) => ({
              user_id: user.id,
              id: it.id,
              column_id: it.columnId,
              text: it.text,
              description: it.description ?? null,
              due_date: it.dueDate ?? null,
              completed_at: it.completedAt ?? null,
              priority: it.priority ?? 0,
              order_idx: i,
              created_at: it.createdAt,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'user_id,id' }
          );
          if (itemsRes.error) console.error('board_items upsert:', itemsRes.error);

          // Flatten the children across all cards and upsert in three
          // batched calls. We track which server IDs survive so we can
          // delete any orphans (server rows whose local id no longer
          // exists in our state). This keeps subtasks/tags/attachments
          // from leaking rows forever when a card is deleted on mobile.
          const itemIds = state.items.map((it) => it.id);
          const allSubs = state.items.flatMap((it) =>
            it.subtasks.map((s, i) => ({
              user_id: user.id,
              id: s.id,
              item_id: s.itemId,
              text: s.text,
              completed: s.completed,
              order_idx: i,
              updated_at: new Date().toISOString(),
            }))
          );
          const allTags = state.items.flatMap((it) =>
            it.tags.map((t) => ({
              user_id: user.id,
              id: t.id,
              item_id: t.itemId,
              label: t.label,
              color: t.color,
            }))
          );
          const allAtts = state.items.flatMap((it) =>
            it.attachments.map((a) => ({
              user_id: user.id,
              id: a.id,
              item_id: a.itemId,
              name: a.name,
              url: a.url,
              kind: a.kind,
            }))
          );

          if (allSubs.length > 0) {
            const r = await (supabase.from('board_item_subtasks') as any)
              .upsert(allSubs, { onConflict: 'id' });
            if (r.error) console.error('board_item_subtasks upsert:', r.error);
            // Delete orphans: subtasks that exist on the server for
            // these items but no longer in local state.
            const r2 = await (supabase.from('board_item_subtasks') as any)
              .delete()
              .eq('user_id', user.id)
              .in('item_id', itemIds)
              .not('id', 'in', `(${allSubs.map((s) => s.id).join(',')})`);
            if (r2.error && r2.error.code !== 'PGRST116') {
              console.error('board_item_subtasks delete orphans:', r2.error);
            }
          }
          if (allTags.length > 0) {
            const r = await (supabase.from('board_item_tags') as any)
              .upsert(allTags, { onConflict: 'id' });
            if (r.error) console.error('board_item_tags upsert:', r.error);
            const r2 = await (supabase.from('board_item_tags') as any)
              .delete()
              .eq('user_id', user.id)
              .in('item_id', itemIds)
              .not('id', 'in', `(${allTags.map((t) => t.id).join(',')})`);
            if (r2.error && r2.error.code !== 'PGRST116') {
              console.error('board_item_tags delete orphans:', r2.error);
            }
          }
          if (allAtts.length > 0) {
            const r = await (supabase.from('board_item_attachments') as any)
              .upsert(allAtts, { onConflict: 'id' });
            if (r.error) console.error('board_item_attachments upsert:', r.error);
            const r2 = await (supabase.from('board_item_attachments') as any)
              .delete()
              .eq('user_id', user.id)
              .in('item_id', itemIds)
              .not('id', 'in', `(${allAtts.map((a) => a.id).join(',')})`);
            if (r2.error && r2.error.code !== 'PGRST116') {
              console.error('board_item_attachments delete orphans:', r2.error);
            }
          }
        } catch (err) {
          console.error('board persist failed:', err);
        }
      })();
    }
  }, [state, hydrated, user, supabase]);

  // Stable id factory — same shape we used pre-refactor so any
  // existing localStorage board blobs that contain only text stay
  // compatible. UUIDs would collide with the seeded seed-* ids.
  const newId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const addItem = (columnId: ColumnId, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId(),
          text: trimmed,
          columnId,
          createdAt: new Date().toISOString(),
          subtasks: [],
          tags: [],
          attachments: [],
        },
      ],
    }));
  };

  const addTodo = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      todos: [
        ...prev.todos,
        {
          id: newId(),
          text: trimmed,
          columnId: 'todos' as const,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const moveItem = (id: string, fromColumnId: ColumnId | 'todos', toColumnId: ColumnId) => {
    setState((prev) => {
      if (fromColumnId === 'todos') {
        const todos = prev.todos.map((t) =>
          t.id === id ? { ...t, columnId: 'todos' as const } : t
        );
        const movingItem = prev.todos.find((t) => t.id === id);
        if (!movingItem) return prev;
        return {
          ...prev,
          todos,
          items: [
            ...prev.items,
            {
              ...movingItem,
              columnId: toColumnId,
              createdAt: new Date().toISOString(),
              subtasks: [],
              tags: [],
              attachments: [],
            },
          ],
        };
      }
      const items = prev.items.map((i) =>
        i.id === id ? { ...i, columnId: toColumnId, createdAt: new Date().toISOString() } : i
      );
      return { ...prev, items };
    });
  };

  const deleteItem = (id: string, fromColumnId: ColumnId | 'todos') => {
    setState((prev) => {
      if (fromColumnId === 'todos') {
        return { ...prev, todos: prev.todos.filter((t) => t.id !== id) };
      }
      return { ...prev, items: prev.items.filter((i) => i.id !== id) };
    });
  };

  const updateItemText = (id: string, fromColumnId: ColumnId | 'todos', text: string) => {
    setState((prev) => {
      if (fromColumnId === 'todos') {
        return {
          ...prev,
          todos: prev.todos.map((t) => (t.id === id ? { ...t, text } : t)),
        };
      }
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, text } : i)),
      };
    });
  };

  // ---------- Card-meta mutators ----------
  // These replace the old "title only" model with a proper Trello-style
  // card: description, due date, priority, completion, subtasks,
  // tags, attachments. Each mutator is a thin setState that finds the
  // target card and updates the relevant field. Persistence is handled
  // by the existing useEffect that calls saveJson + Supabase upsert.

  const updateItemDescription = (id: string, description: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === id ? { ...i, description } : i
      ),
    }));
  };

  const updateItemDueDate = (id: string, dueDate: string | null) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === id ? { ...i, dueDate: dueDate ?? undefined } : i
      ),
    }));
  };

  const updateItemPriority = (id: string, priority: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === id ? { ...i, priority } : i
      ),
    }));
  };

  const toggleComplete = (id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.id !== id) return i;
        const wasComplete = !!i.completedAt;
        return {
          ...i,
          completedAt: wasComplete ? undefined : new Date().toISOString(),
        };
      }),
    }));
  };

  const duplicateItem = (id: string) => {
    setState((prev) => {
      const orig = prev.items.find((i) => i.id === id);
      if (!orig) return prev;
      const copy: BoardItem = {
        ...orig,
        id: newId(),
        text: `${orig.text} (copy)`,
        createdAt: new Date().toISOString(),
        completedAt: undefined,
        // Children get fresh IDs so the duplicate doesn't share rows.
        subtasks: orig.subtasks.map((s) => ({ ...s, id: newId(), itemId: '' })),
        tags: orig.tags.map((t) => ({ ...t, id: newId(), itemId: '' })),
        attachments: orig.attachments.map((a) => ({ ...a, id: newId(), itemId: '' })),
      };
      // Fix up the child item_id pointers now that we know the parent's id.
      const newId_ = copy.id;
      copy.subtasks = copy.subtasks.map((s) => ({ ...s, itemId: newId_ }));
      copy.tags = copy.tags.map((t) => ({ ...t, itemId: newId_ }));
      copy.attachments = copy.attachments.map((a) => ({ ...a, itemId: newId_ }));
      const idx = prev.items.findIndex((i) => i.id === id);
      const items = [...prev.items];
      items.splice(idx + 1, 0, copy);
      return { ...prev, items };
    });
  };

  // Subtasks: an ordered checklist inside a card.
  const addSubtask = (itemId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              subtasks: [
                ...i.subtasks,
                {
                  id: newId(),
                  itemId,
                  text: trimmed,
                  completed: false,
                  orderIdx: i.subtasks.length,
                },
              ],
            }
          : i
      ),
    }));
  };

  const toggleSubtask = (subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({
        ...i,
        subtasks: i.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      })),
    }));
  };

  const removeSubtask = (subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({
        ...i,
        subtasks: i.subtasks.filter((s) => s.id !== subtaskId),
      })),
    }));
  };

  // Tags: colour-coded labels attached to a card.
  const addTag = (itemId: string, label: string, color: TagColor) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              tags: [
                ...i.tags,
                { id: newId(), itemId, label: trimmed, color },
              ],
            }
          : i
      ),
    }));
  };

  const removeTag = (tagId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({
        ...i,
        tags: i.tags.filter((t) => t.id !== tagId),
      })),
    }));
  };

  // Attachments: URL references to docs / images / links.
  const addAttachment = (
    itemId: string,
    name: string,
    url: string,
    kind: BoardAttachment['kind']
  ) => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              attachments: [
                ...i.attachments,
                { id: newId(), itemId, name: trimmedName, url: trimmedUrl, kind },
              ],
            }
          : i
      ),
    }));
  };

  const removeAttachment = (attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => ({
        ...i,
        attachments: i.attachments.filter((a) => a.id !== attachmentId),
      })),
    }));
  };

  const addColumn = (label: string, color: typeof COLUMN_COLORS[number]) => {
    setState((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        { id: `col-${Date.now()}`, label, color },
      ],
    }));
  };

  const removeColumn = (columnId: ColumnId) => {
    setState((prev) => {
      if (prev.columns.length <= 1) return prev;
      const items = prev.items.filter((i) => i.columnId !== columnId);
      const columns = prev.columns.filter((c) => c.id !== columnId);
      return { ...prev, columns, items };
    });
  };

  const renameColumn = (columnId: ColumnId, label: string) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.id === columnId ? { ...c, label } : c)),
    }));
  };

  const changeColumnColor = (columnId: ColumnId, color: typeof COLUMN_COLORS[number]) => {
    setState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.id === columnId ? { ...c, color } : c)),
    }));
  };

  const handleDragStart = (id: string, fromColumnId: ColumnId | 'todos') => {
    dragItem.current = { id, fromColumnId };
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { id, fromColumnId } = dragItem.current;
    if (fromColumnId !== targetColumnId) {
      moveItem(id, fromColumnId, targetColumnId);
    }
    dragItem.current = null;
    setDragOverTarget(null);
  };

  return {
    state,
    dragOverTarget,
    editingItemId,
    editingText,
    addItem,
    addTodo,
    moveItem,
    deleteItem,
    updateItemText,
    updateItemDescription,
    updateItemDueDate,
    updateItemPriority,
    toggleComplete,
    duplicateItem,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    addTag,
    removeTag,
    addAttachment,
    removeAttachment,
    addColumn,
    removeColumn,
    renameColumn,
    changeColumnColor,
    setEditingItemId,
    setEditingText,
    setDragOverTarget,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

const COLOR_STYLES: Record<string, { bg: string; border: string }> = {
  paper: { bg: 'bg-paper', border: 'border-ink/15' },
  teal: { bg: 'bg-teal', border: 'border-teal' },
  coral: { bg: 'bg-coral', border: 'border-coral' },
  cream: { bg: 'bg-cream/40', border: 'border-ink/15' },
  lavender: { bg: 'bg-lavender/40', border: 'border-ink/15' },
  ink: { bg: 'bg-ink', border: 'border-ink' },
};

export function Board() {
  const board = useBoardState();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<typeof COLUMN_COLORS[number]>('paper');
  // null = no detail modal open. Otherwise the id of the item to
  // show. Tracked here (in Board) rather than per-Column so the
  // modal can read the live item from board.state — when the user
  // edits the description, subtasks, etc., the modal re-renders
  // with the fresh state.
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-body text-caption uppercase tracking-widest text-ink/50">
          The board
        </h3>
        <button
          onClick={() => setShowAddColumn(true)}
          className="font-body text-caption uppercase tracking-widest text-coral hover:text-ink transition-colors"
        >
          + Add column
        </button>
      </div>

      {showAddColumn && (
        <div className="border border-ink/15 p-4 mb-6 bg-paper">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            New column
          </p>
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <input
              type="text"
              value={newColumnLabel}
              onChange={(e) => setNewColumnLabel(e.target.value)}
              placeholder="Column name"
              autoFocus
              className="flex-1 px-3 py-2 border border-ink/20 font-body focus:border-ink outline-none"
            />
            <div className="flex gap-1">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColumnColor(c)}
                  className={`w-8 h-8 border ${COLOR_STYLES[c].bg} ${COLOR_STYLES[c].border} ${
                    newColumnColor === c ? 'ring-2 ring-ink' : ''
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const label = newColumnLabel.trim();
                if (!label) return;
                board.addColumn(label, newColumnColor);
                setNewColumnLabel('');
                setShowAddColumn(false);
              }}
              className="bg-ink text-paper font-body text-xs px-4 py-2 uppercase tracking-wider hover:bg-ink/85 transition-colors"
            >
              Add column
            </button>
            <button
              onClick={() => { setShowAddColumn(false); setNewColumnLabel(''); }}
              className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {board.state.columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            columns={board.state.columns}
            items={board.state.items.filter((i) => i.columnId === col.id)}
            colorStyles={COLOR_STYLES[col.color] || COLOR_STYLES.paper}
            dragOverTarget={board.dragOverTarget}
            onAdd={(text) => board.addItem(col.id, text)}
            onDelete={(id) => board.deleteItem(id, col.id)}
            onRename={(label) => board.renameColumn(col.id, label)}
            onRemoveColumn={() => board.removeColumn(col.id)}
            onChangeColor={(color) => board.changeColumnColor(col.id, color)}
            onMoveItem={(id, toColumnId) => board.moveItem(id, col.id, toColumnId)}
            onToggleComplete={(id) => board.toggleComplete(id)}
            onDuplicateItem={(id) => board.duplicateItem(id)}
            onOpenDetail={(id) => setDetailItemId(id)}
            onDragStart={(id) => board.handleDragStart(id, col.id)}
            onDragOver={board.handleDragOver}
            onDragLeave={board.handleDragLeave}
            onDrop={(e) => board.handleDrop(e, col.id)}
            onEdit={(id, text) => board.updateItemText(id, col.id, text)}
            editingItemId={board.editingItemId}
            editingText={board.editingText}
            setEditingItemId={board.setEditingItemId}
            setEditingText={board.setEditingText}
          />
        ))}
      </div>

      {/* Card detail modal — opens when a card is tapped. Owned by
          Board (not per-Column) so the live item is read from
          board.state and updates flow instantly when the user edits
          fields inside the modal. */}
      {detailItemId !== null && (() => {
        const item = board.state.items.find((it) => it.id === detailItemId);
        if (!item) {
          setDetailItemId(null);
          return null;
        }
        return (
          <CardDetailModal
            item={item}
            columns={board.state.columns.map((c) => ({ id: c.id, label: c.label }))}
            onClose={() => setDetailItemId(null)}
            onChangeDescription={(text) =>
              board.updateItemDescription(item.id, text)
            }
            onChangeDueDate={(date) =>
              board.updateItemDueDate(item.id, date)
            }
            onChangePriority={(p) => board.updateItemPriority(item.id, p)}
            onAddSubtask={(text) => board.addSubtask(item.id, text)}
            onToggleSubtask={board.toggleSubtask}
            onRemoveSubtask={board.removeSubtask}
            onAddTag={(label, color) => board.addTag(item.id, label, color)}
            onRemoveTag={board.removeTag}
            onAddAttachment={(name, url, kind) =>
              board.addAttachment(item.id, name, url, kind)
            }
            onRemoveAttachment={board.removeAttachment}
          />
        );
      })()}
    </div>
  );
}

export function TodoList() {
  const board = useBoardState();

  return (
    <div
      onDragOver={(e) => board.handleDragOver(e, 'todos')}
      onDragLeave={board.handleDragLeave}
      onDrop={(e) => board.handleDrop(e, 'todos')}
      className={`border border-ink/20 p-4 transition-all ${
        board.dragOverTarget === 'todos' ? 'ring-2 ring-ink' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-body text-caption uppercase tracking-widest text-ink/50">
          The to-do list
        </h3>
        <span className="font-body text-caption uppercase text-ink/30 tabular-nums">
          [{board.state.todos.length}]
        </span>
      </div>
      <TodoListBody
        todos={board.state.todos}
        dragOverTarget={board.dragOverTarget}
        onDragStart={board.handleDragStart}
        onDragOver={board.handleDragOver}
        onDragLeave={board.handleDragLeave}
        onDrop={board.handleDragOver}
        onAdd={board.addTodo}
        onDelete={(id) => board.deleteItem(id, 'todos')}
        onMove={(id) => {
          const first = board.state.columns[0]?.id;
          if (first) board.moveItem(id, 'todos', first);
        }}
        onEdit={(id, text) => board.updateItemText(id, 'todos', text)}
        editingItemId={board.editingItemId}
        editingText={board.editingText}
        setEditingItemId={board.setEditingItemId}
        setEditingText={board.setEditingText}
      />
    </div>
  );
}

function TodoListBody(props: {
  todos: TodoItem[];
  dragOverTarget: string | null;
  onDragStart: (id: string, fromColumnId: ColumnId | 'todos') => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  editingItemId: string | null;
  editingText: string;
  setEditingItemId: (id: string | null) => void;
  setEditingText: (text: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    props.onAdd(trimmed);
    setNewText('');
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        {props.todos.length === 0 && (
          <p className="font-body text-sm text-ink/40 italic px-2 py-3">
            Nothing in your to do list. Add one or drag tasks here from the board.
          </p>
        )}
        {props.todos.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', t.id);
              props.onDragStart(t.id, 'todos');
            }}
            className="bg-paper border border-ink/15 p-3 flex items-start gap-2 cursor-grab active:cursor-grabbing"
          >
            {props.editingItemId === t.id ? (
              <input
                type="text"
                value={props.editingText}
                onChange={(e) => props.setEditingText(e.target.value)}
                onBlur={() => { props.onEdit(t.id, props.editingText); props.setEditingItemId(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { props.onEdit(t.id, props.editingText); props.setEditingItemId(null); }
                  if (e.key === 'Escape') { props.setEditingItemId(null); }
                }}
                autoFocus
                className="flex-1 font-body text-sm text-ink bg-cream/30 border border-ink/30 px-1 py-0.5 outline-none"
              />
            ) : (
              <p
                className="flex-1 font-body text-sm text-ink leading-snug cursor-pointer"
                onClick={() => { props.setEditingText(t.text); props.setEditingItemId(t.id); }}
              >
                {t.text}
              </p>
            )}
            <button
              onClick={() => props.onMove(t.id)}
              className="font-body text-xs text-ink/40 hover:text-ink transition-colors whitespace-nowrap"
            >
              → board
            </button>
            <button
              onClick={() => { props.setEditingText(t.text); props.setEditingItemId(t.id); }}
              className="font-body text-xs text-ink/40 hover:text-ink transition-colors"
            >
              edit
            </button>
            <button
              onClick={() => props.onDelete(t.id)}
              className="font-body text-xs text-ink/40 hover:text-coral transition-colors"
              aria-label="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New todo"
            autoFocus
            className="flex-1 px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
          />
          <button
            onClick={handleAdd}
            className="bg-ink text-paper font-body text-xs px-2 py-1 uppercase"
          >
            Add
          </button>
          <button
            onClick={() => { setAdding(false); setNewText(''); }}
            className="font-body text-xs opacity-50 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="font-body text-caption uppercase tracking-widest opacity-50 hover:opacity-100 text-left"
        >
          + Add todo
        </button>
      )}
    </div>
  );
}

interface ColumnProps {
  column: BoardColumn;
  columns: BoardColumn[];
  items: BoardItem[];
  colorStyles: { bg: string; border: string };
  dragOverTarget: string | null;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onRename: (label: string) => void;
  onRemoveColumn: () => void;
  onChangeColor: (color: typeof COLUMN_COLORS[number]) => void;
  onMoveItem: (id: string, toColumnId: ColumnId) => void;
  onToggleComplete: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onEdit: (id: string, text: string) => void;
  editingItemId: string | null;
  editingText: string;
  setEditingItemId: (id: string | null) => void;
  setEditingText: (text: string) => void;
}

function Column({
  column,
  columns,
  items,
  colorStyles,
  dragOverTarget,
  onAdd,
  onDelete,
  onRename,
  onRemoveColumn,
  onChangeColor,
  onMoveItem,
  onToggleComplete,
  onDuplicateItem,
  onOpenDetail,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onEdit,
  editingItemId,
  editingText,
  setEditingItemId,
  setEditingText,
}: ColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(column.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setLabel(column.label);
  }, [column.label]);

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText('');
  };

  const handleRename = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onRename(trimmed);
    setRenaming(false);
  };

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${colorStyles.bg} ${colorStyles.border} border flex flex-col p-3 min-h-[200px] transition-all ${
        dragOverTarget === column.id ? 'ring-2 ring-ink' : ''
      }`}
      style={{ color: column.color === 'ink' ? '#FAF6EE' : '#1A1A1A' }}
    >
      <div className="flex items-center justify-between mb-3">
        {renaming ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            className="font-body text-caption uppercase tracking-widest bg-transparent border-b border-current outline-none flex-1 mr-2"
          />
        ) : (
          <p
            className="font-body text-caption uppercase tracking-widest cursor-pointer"
            onDoubleClick={() => setRenaming(true)}
          >
            {column.label} <span className="opacity-50">[{items.length}]</span>
          </p>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="font-body text-sm opacity-60 hover:opacity-100 px-1"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-paper border border-ink/20 z-10 min-w-[140px]">
              <button
                onClick={() => { setRenaming(true); setShowMenu(false); }}
                className="block w-full text-left px-3 py-2 font-body text-xs text-ink hover:bg-ink/5"
              >
                Rename
              </button>
              <button
                onClick={() => { setShowColorPicker(!showColorPicker); setShowMenu(false); }}
                className="block w-full text-left px-3 py-2 font-body text-xs text-ink hover:bg-ink/5"
              >
                Change colour
              </button>
              <button
                onClick={() => { onRemoveColumn(); setShowMenu(false); }}
                className="block w-full text-left px-3 py-2 font-body text-xs text-coral hover:bg-coral/10"
              >
                Delete column
              </button>
            </div>
          )}
        </div>
      </div>

      {showColorPicker && (
        <div className="flex gap-1 mb-3 p-2 bg-paper border border-ink/10">
          {COLUMN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onChangeColor(c); setShowColorPicker(false); }}
              className={`w-6 h-6 border ${COLOR_STYLES[c]?.bg ?? 'bg-paper'} ${COLOR_STYLES[c]?.border ?? 'border-ink/15'} ${column.color === c ? 'ring-2 ring-ink' : ''}`}
            />
          ))}
        </div>
      )}

      <div className="space-y-2 mb-3 flex-1 min-h-[40px]">
        {items.length === 0 && (
          <div className="border-2 border-dashed border-current opacity-20 p-4 text-center font-body text-caption uppercase tracking-widest">
            Drop here
          </div>
        )}
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            columns={columns}
            onDragStart={() => onDragStart(item.id)}
            onDelete={() => onDelete(item.id)}
            onMoveItem={(toCol) => onMoveItem(item.id, toCol)}
            onToggleComplete={() => onToggleComplete(item.id)}
            onDuplicate={() => onDuplicateItem(item.id)}
            onOpenDetail={() => onOpenDetail(item.id)}
            onDragOver={(e) => onDragOver(e, item.id)}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onEdit={(text) => onEdit(item.id, text)}
            editingItemId={editingItemId}
            editingText={editingText}
            setEditingItemId={setEditingItemId}
            setEditingText={setEditingText}
          />
        ))}
      </div>

      {/* Add-task form — always visible on mobile (the modal-style
          UX is broken on small screens because the + Add task
          trigger sits at the bottom of long columns and is easy to
          miss). Desktop keeps the lightweight trigger so the column
          header stays clean. */}
      <div className="md:hidden">
        <AddTaskForm
          adding={adding}
          newText={newText}
          setNewText={setNewText}
          handleAdd={handleAdd}
          setAdding={setAdding}
        />
      </div>
      <div className="hidden md:block">
        <AddTaskForm
          adding={adding}
          newText={newText}
          setNewText={setNewText}
          handleAdd={handleAdd}
          setAdding={setAdding}
        />
      </div>
    </div>
  );
}

/**
 * Mobile-friendly Add-task form — the input is shown inline (or behind
 * a single "+ Add task" trigger). On mobile, the trigger is bypassed
 * so users always see the input rather than scrolling to find it.
 * On desktop we keep the trigger so the column header stays compact.
 */
function AddTaskForm({
  adding,
  newText,
  setNewText,
  handleAdd,
  setAdding,
}: {
  adding: boolean;
  newText: string;
  setNewText: (s: string) => void;
  handleAdd: () => void;
  setAdding: (b: boolean) => void;
}) {
  const showForm = adding; // mobile: always visible; desktop: tap-to-show
  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-full text-left font-body text-caption uppercase tracking-widest opacity-60 hover:opacity-100"
      >
        + Add task
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="New task"
        autoFocus
        className="flex-1 px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="bg-ink text-paper font-body text-xs px-3 py-1 uppercase"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setAdding(false);
          setNewText('');
        }}
        className="font-body text-xs opacity-50 hover:opacity-100"
        aria-label="Cancel"
      >
        ×
      </button>
    </div>
  );
}

interface CardProps {
  item: BoardItem;
  columns: BoardColumn[];
  onDragStart: () => void;
  onDelete: () => void;
  onMoveItem: (toColumnId: ColumnId) => void;
  onToggleComplete: () => void;
  onDuplicate: () => void;
  onOpenDetail: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onEdit: (text: string) => void;
  editingItemId: string | null;
  editingText: string;
  setEditingItemId: (id: string | null) => void;
  setEditingText: (text: string) => void;
}

/**
 * Trello-style card. Renders the title, optional description preview,
 * tag chips, due date badge, subtask progress, completion checkmark,
 * and an actions menu (Move to…, Duplicate, Delete). Tapping the
 * card body opens the detail modal; the drag handle is on the card
 * itself for desktop users who want to drag-reorder.
 */
function Card({
  item,
  columns,
  onDragStart,
  onDelete,
  onMoveItem,
  onToggleComplete,
  onDuplicate,
  onOpenDetail,
  onDragOver,
  onDragLeave,
  onDrop,
  onEdit,
  editingItemId,
  editingText,
  setEditingItemId,
  setEditingText,
}: CardProps) {
  const isEditing = editingItemId === item.id;
  const [showActions, setShowActions] = useState(false);
  const isComplete = !!item.completedAt;
  // Subtask progress: e.g. "2/4 done" — shown as a small caption.
  const subsDone = item.subtasks.filter((s) => s.completed).length;
  const subsTotal = item.subtasks.length;
  // Move menu state — which column we're previewing as the move target.
  const [moveTo, setMoveTo] = useState<ColumnId | null>(null);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        onDragStart();
      }}
      className={`relative bg-paper border p-3 transition-colors group/card ${
        isComplete
          ? 'border-coral/40 bg-coral/5'
          : 'border-ink/15 hover:border-ink/40'
      }`}
    >
      {/* Drag handle — top-right on desktop, only visible on hover so
          it doesn't crowd the card on mobile. */}
      <button
        type="button"
        aria-label="Drag to reorder card"
        title="Drag to reorder"
        className="hidden md:flex absolute top-1 right-1 w-5 h-5 items-center justify-center text-ink/40 hover:text-ink opacity-0 group-hover/card:opacity-100 transition-opacity text-sm leading-none select-none"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.preventDefault()}
      >
        ⋮⋮
      </button>

      {isComplete && (
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-coral text-paper flex items-center justify-center text-[10px] leading-none"
          title="Completed"
        >
          ✓
        </span>
      )}

      {/* Title row — completion toggle on the left, title centred/left. */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggleComplete}
          aria-label={isComplete ? 'Mark as incomplete' : 'Mark as complete'}
          title={isComplete ? 'Mark incomplete' : 'Mark complete'}
          className={`shrink-0 w-6 h-6 border-2 flex items-center justify-center text-xs leading-none transition-colors ${
            isComplete
              ? 'bg-coral border-coral text-paper'
              : 'border-ink/30 text-transparent hover:border-ink/60'
          }`}
        >
          ✓
        </button>
        {isEditing ? (
          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => {
              onEdit(editingText);
              setEditingItemId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEdit(editingText);
                setEditingItemId(null);
              }
              if (e.key === 'Escape') setEditingItemId(null);
            }}
            autoFocus
            className="flex-1 font-body text-sm text-ink bg-cream/30 border border-ink/30 px-1 py-0.5 outline-none"
          />
        ) : (
          <p
            className={`flex-1 font-body text-sm leading-snug break-words cursor-pointer ${
              isComplete ? 'line-through text-ink/50' : 'text-ink'
            }`}
            onClick={() => {
              setEditingText(item.text);
              setEditingItemId(item.id);
            }}
          >
            {item.text}
          </p>
        )}
      </div>

      {/* Description preview — clickable, opens detail modal */}
      {item.description && (
        <p
          className="font-body text-xs text-ink/60 mt-1.5 cursor-pointer hover:text-ink line-clamp-2"
          onClick={onOpenDetail}
        >
          {item.description}
        </p>
      )}

      {/* Tag chips */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((t) => (
            <span
              key={t.id}
              className={`inline-block px-1.5 py-0.5 font-body text-[10px] uppercase tracking-widest border ${TAG_BG[t.color] || TAG_BG.paper}`}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* Meta row — due date, subtask progress, attachments */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] uppercase tracking-widest font-body text-ink/50">
        {item.dueDate && (
          <span
            className={dueDateColorClass(item.dueDate)}
            title={`Due ${item.dueDate}`}
          >
            {formatDueDate(item.dueDate)}
          </span>
        )}
        {subsTotal > 0 && (
          <span>
            ☑ {subsDone}/{subsTotal}
          </span>
        )}
        {item.attachments.length > 0 && (
          <span>📎 {item.attachments.length}</span>
        )}
      </div>

      {/* Actions menu trigger — three-dot button at bottom-right.
          Click to expand the menu inline below the card so the user
          doesn't need to enter the detail modal just to move a card. */}
      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={showActions}
          aria-label="Card actions"
          className="font-body text-xs opacity-50 hover:opacity-100 px-1"
        >
          ⋯
        </button>
        {showActions && (
          <div
            role="menu"
            className="absolute right-0 bottom-full mb-1 bg-paper border border-ink/20 z-20 min-w-[180px] text-left shadow"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowActions(false);
                onOpenDetail();
              }}
              className="block w-full text-left px-3 py-2 font-body text-xs text-ink hover:bg-ink/5"
            >
              Open details
            </button>
            <div className="border-t border-ink/10" />
            <div className="px-3 py-1 font-body text-[10px] uppercase tracking-widest text-ink/50">
              Move to
            </div>
            {columns
              .filter((c) => c.id !== item.columnId)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowActions(false);
                    onMoveItem(c.id);
                  }}
                  className={`block w-full text-left px-3 py-1.5 font-body text-xs hover:bg-ink/5 ${
                    moveTo === c.id ? 'bg-ink/10' : ''
                  }`}
                  onMouseEnter={() => setMoveTo(c.id)}
                  onMouseLeave={() => setMoveTo(null)}
                >
                  {c.label}
                </button>
              ))}
            <div className="border-t border-ink/10" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowActions(false);
                onDuplicate();
              }}
              className="block w-full text-left px-3 py-2 font-body text-xs text-ink hover:bg-ink/5"
            >
              Duplicate
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowActions(false);
                setEditingText(item.text);
                setEditingItemId(item.id);
              }}
              className="block w-full text-left px-3 py-2 font-body text-xs text-ink hover:bg-ink/5"
            >
              Rename
            </button>
            <div className="border-t border-ink/10" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowActions(false);
                onDelete();
              }}
              className="block w-full text-left px-3 py-2 font-body text-xs text-coral hover:bg-coral/10"
            >
              Delete card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TAG_BG: Record<TagColor, string> = {
  paper: 'bg-paper text-ink border-ink/20',
  teal: 'bg-teal/20 text-ink border-teal/40',
  coral: 'bg-coral/15 text-coral border-coral/40',
  cream: 'bg-cream/40 text-ink border-ink/20',
  lavender: 'bg-lavender/40 text-ink border-ink/20',
  ink: 'bg-ink text-paper border-ink',
};

/** Apply a colour class based on whether the due date is past,
 *  today, or in the future. Past dates coral, today ink, future
 *  paper-tinted. */
function dueDateColorClass(due: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + 'T00:00:00');
  const diffDays = Math.round(
    (dueDate.getTime() - today.getTime()) / 86_400_000
  );
  if (diffDays < 0) return 'text-coral font-semibold';
  if (diffDays === 0) return 'text-ink font-semibold';
  if (diffDays <= 3) return 'text-coral';
  return 'text-ink/60';
}

function formatDueDate(due: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + 'T00:00:00');
  const diffDays = Math.round(
    (dueDate.getTime() - today.getTime()) / 86_400_000
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
  if (diffDays <= 7) return `+${diffDays}d`;
  return due;
}

/**
 * Full card detail modal — opened when the user taps a card.
 * On mobile it goes full-screen; on desktop it's a centred modal.
 * All writes go through the hook's mutators so the card updates in
 * place — closing the modal shows the latest state immediately.
 */
function CardDetailModal({
  item,
  columns,
  onClose,
  onChangeDescription,
  onChangeDueDate,
  onChangePriority,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
  onAddTag,
  onRemoveTag,
  onAddAttachment,
  onRemoveAttachment,
}: {
  item: BoardItem;
  columns: Array<{ id: ColumnId; label: string }>;
  onClose: () => void;
  onChangeDescription: (text: string) => void;
  onChangeDueDate: (date: string | null) => void;
  onChangePriority: (priority: number) => void;
  onAddSubtask: (text: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onRemoveSubtask: (subtaskId: string) => void;
  onAddTag: (label: string, color: TagColor) => void;
  onRemoveTag: (tagId: string) => void;
  onAddAttachment: (
    name: string,
    url: string,
    kind: BoardAttachment['kind']
  ) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  const [tab, setTab] = useState<'details' | 'subtasks' | 'files'>('details');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tagColor, setTagColor] = useState<TagColor>('teal');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentKind, setAttachmentKind] =
    useState<BoardAttachment['kind']>('link');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${item.text}`}
      className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full md:max-w-2xl border border-ink/15 max-h-[95vh] flex flex-col overflow-hidden animate-sheet-up rounded-t-2xl md:rounded"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-ink/20 rounded-full" />
        </div>

        {/* Header — fixed at top */}
        <div className="flex-none px-6 pt-4 md:pt-6 pb-2 border-b border-ink/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
              Card
            </p>
            <h3
              className={`font-display text-h2 leading-tight ${
                item.completedAt ? 'line-through text-ink/50' : 'text-ink'
              }`}
            >
              {item.text}
            </h3>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-2">
              {columns.find((c) => c.id === item.columnId)?.label ?? 'Card'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-2 -mt-1 p-2 font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex-none flex border-b border-ink/10 bg-paper">
          {(
            [
              { id: 'details', label: 'Details' },
              { id: 'subtasks', label: `Subtasks (${item.subtasks.length})` },
              { id: 'files', label: `Files (${item.attachments.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`px-4 py-2 font-body text-caption uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-coral text-ink'
                  : 'text-ink/50 hover:text-ink border-b-2 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {tab === 'details' && (
            <div className="space-y-5">
              {/* Description */}
              <section>
                <label className="block">
                  <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
                    Description
                  </span>
                  <textarea
                    value={item.description ?? ''}
                    onChange={(e) => onChangeDescription(e.target.value)}
                    placeholder="What's this card about?"
                    rows={3}
                    className="w-full px-3 py-2 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  />
                </label>
              </section>

              {/* Due date + priority */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
                    Due date
                  </span>
                  <input
                    type="date"
                    value={item.dueDate ?? ''}
                    onChange={(e) =>
                      onChangeDueDate(e.target.value || null)
                    }
                    className="w-full px-3 py-2 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  />
                </label>
                <label className="block">
                  <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
                    Priority
                  </span>
                  <select
                    value={String(item.priority ?? 0)}
                    onChange={(e) => onChangePriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  >
                    <option value="0">None</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Critical</option>
                  </select>
                </label>
              </section>

              {/* Tags */}
              <section>
                <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
                  Tags
                </span>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((t) => (
                      <span
                        key={t.id}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-body text-[10px] uppercase tracking-widest border ${TAG_BG[t.color] || TAG_BG.paper}`}
                      >
                        {t.label}
                        <button
                          type="button"
                          onClick={() => onRemoveTag(t.id)}
                          aria-label={`Remove tag ${t.label}`}
                          className="ml-1 leading-none opacity-60 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-xs text-ink/40 italic mb-3">
                    No tags yet.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagDraft.trim()) {
                        onAddTag(tagDraft.trim(), tagColor);
                        setTagDraft('');
                      }
                    }}
                    placeholder="Label"
                    className="flex-1 min-w-[120px] px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  />
                  <div className="flex gap-1">
                    {(['paper', 'teal', 'coral', 'cream', 'lavender', 'ink'] as TagColor[]).map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTagColor(c)}
                          aria-label={c}
                          className={`w-6 h-6 border ${TAG_BG[c]} ${
                            tagColor === c ? 'ring-2 ring-ink' : ''
                          }`}
                        />
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (tagDraft.trim()) {
                        onAddTag(tagDraft.trim(), tagColor);
                        setTagDraft('');
                      }
                    }}
                    className="bg-ink text-paper font-body text-xs px-3 py-1 uppercase"
                  >
                    Add
                  </button>
                </div>
              </section>
            </div>
          )}

          {tab === 'subtasks' && (
            <div className="space-y-4">
              {item.subtasks.length > 0 ? (
                <ul className="space-y-1">
                  {item.subtasks.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-2 border border-ink/10 bg-paper"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleSubtask(s.id)}
                        aria-label={s.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center text-xs leading-none transition-colors ${
                          s.completed
                            ? 'bg-coral border-coral text-paper'
                            : 'border-ink/30 text-transparent hover:border-ink/60'
                        }`}
                      >
                        ✓
                      </button>
                      <span
                        className={`flex-1 font-body text-sm ${
                          s.completed ? 'line-through text-ink/50' : 'text-ink'
                        }`}
                      >
                        {s.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveSubtask(s.id)}
                        aria-label={`Delete subtask ${s.text}`}
                        className="font-body text-xs opacity-40 hover:opacity-100 hover:text-coral"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-sm text-ink/40 italic">
                  No subtasks yet.
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskDraft}
                  onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && subtaskDraft.trim()) {
                      onAddSubtask(subtaskDraft.trim());
                      setSubtaskDraft('');
                    }
                  }}
                  placeholder="New subtask"
                  className="flex-1 px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (subtaskDraft.trim()) {
                      onAddSubtask(subtaskDraft.trim());
                      setSubtaskDraft('');
                    }
                  }}
                  className="bg-ink text-paper font-body text-xs px-3 py-1 uppercase"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {tab === 'files' && (
            <div className="space-y-4">
              {item.attachments.length > 0 ? (
                <ul className="space-y-1">
                  {item.attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-2 border border-ink/10 bg-paper"
                    >
                      <span className="font-body text-xs uppercase tracking-widest text-ink/50 w-16">
                        {a.kind}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 font-body text-sm text-coral hover:underline truncate"
                      >
                        {a.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(a.id)}
                        aria-label={`Remove attachment ${a.name}`}
                        className="font-body text-xs opacity-40 hover:opacity-100 hover:text-coral"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body text-sm text-ink/40 italic">
                  No attachments yet.
                </p>
              )}
              <div className="border border-ink/15 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Name (e.g. Research notes)"
                    className="flex-1 px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  />
                  <select
                    value={attachmentKind}
                    onChange={(e) =>
                      setAttachmentKind(
                        e.target.value as BoardAttachment['kind']
                      )
                    }
                    className="px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                  >
                    <option value="link">Link</option>
                    <option value="image">Image</option>
                    <option value="doc">Doc</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (attachmentName.trim() && attachmentUrl.trim()) {
                      onAddAttachment(
                        attachmentName.trim(),
                        attachmentUrl.trim(),
                        attachmentKind
                      );
                      setAttachmentName('');
                      setAttachmentUrl('');
                    }
                  }}
                  className="bg-ink text-paper font-body text-xs px-3 py-1 uppercase"
                >
                  Add attachment
                </button>
                <p className="font-body text-xs text-ink/50 italic">
                  Paste a URL. For real file uploads, attach a link to
                  your cloud drive (Drive, Dropbox, etc.).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer — close button always visible above the fold.
            Same pattern as FoodDetail's footer so the modal is
            mobile-friendly. */}
        <div className="flex-none border-t border-ink/10 bg-paper px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  return (
    <div>
      <Board />
    </div>
  );
}
