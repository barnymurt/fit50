'use client';

import { useEffect, useRef, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';

type ColumnId = string;

interface BoardItem {
  id: string;
  text: string;
  columnId: ColumnId;
  createdAt: string;
}

interface BoardColumn {
  id: ColumnId;
  label: string;
  color: typeof COLUMN_COLORS[number] | string;
}

interface BoardState {
  columns: BoardColumn[];
  items: BoardItem[];
  todos: BoardItem[];
}

const DEFAULT_BOARD: BoardState = {
  columns: [
    { id: 'todo', label: 'To do', color: 'paper' },
    { id: 'progress', label: 'In progress', color: 'teal' },
    { id: 'done', label: 'Done', color: 'coral' },
  ],
  items: [
    { id: 'seed-1', text: 'Pick the four recipes for the week', columnId: 'todo', createdAt: new Date().toISOString() },
    { id: 'seed-2', text: 'Walk 10,000 steps', columnId: 'todo', createdAt: new Date().toISOString() },
    { id: 'seed-3', text: 'Read 10 pages', columnId: 'progress', createdAt: new Date().toISOString() },
  ],
  todos: [],
};

const STORAGE_KEY = 'fit50-board-v2';

const COLUMN_COLORS = ['paper', 'teal', 'coral', 'cream', 'lavender', 'ink'] as const;

export default function ProjectBoard() {
  const [state, setState] = useState<BoardState>(DEFAULT_BOARD);
  const [hydrated, setHydrated] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<ColumnId | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<typeof COLUMN_COLORS[number]>('paper');

  const dragItem = useRef<{ id: string; fromColumnId: ColumnId | 'todos' } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadJson<BoardState>(STORAGE_KEY, DEFAULT_BOARD);
    setState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, state);
  }, [state, hydrated]);

  const addItem = (columnId: ColumnId, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          columnId,
          createdAt: new Date().toISOString(),
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
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          columnId: 'todos',
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const moveItem = (id: string, fromColumnId: ColumnId | 'todos', toColumnId: ColumnId) => {
    setState((prev) => {
      if (fromColumnId === 'todos') {
        const todos = prev.todos.map((t) =>
          t.id === id ? { ...t, columnId: toColumnId } : t
        );
        const movingItem = prev.todos.find((t) => t.id === id);
        if (!movingItem) return prev;
        return {
          ...prev,
          todos,
          items: [
            ...prev.items,
            { ...movingItem, columnId: toColumnId, createdAt: new Date().toISOString() },
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

  const addColumn = () => {
    const label = newColumnLabel.trim();
    if (!label) return;
    setState((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        {
          id: `col-${Date.now()}`,
          label,
          color: newColumnColor,
        },
      ],
    }));
    setNewColumnLabel('');
    setShowAddColumn(false);
  };

  const removeColumn = (columnId: ColumnId) => {
    setState((prev) => {
      if (prev.columns.length <= 1) return prev; // at least 1 column
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

  const COLOR_STYLES: Record<string, { bg: string; border: string }> = {
    paper: { bg: 'bg-paper', border: 'border-ink/15' },
    teal: { bg: 'bg-teal', border: 'border-teal' },
    coral: { bg: 'bg-coral', border: 'border-coral' },
    cream: { bg: 'bg-cream/40', border: 'border-ink/15' },
    lavender: { bg: 'bg-lavender/40', border: 'border-ink/15' },
    ink: { bg: 'bg-ink', border: 'border-ink' },
  };

  return (
    <div className="w-full">
      {/* Top: Todo list (outside the columns) */}
      <TodoList
        todos={state.todos}
        dragOverTarget={dragOverTarget}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onAdd={addTodo}
        onDelete={(id) => deleteItem(id, 'todos')}
        onMove={(id) => {
          // move to first column
          const first = state.columns[0]?.id;
          if (first) moveItem(id, 'todos', first);
        }}
        onEdit={(id, text) => updateItemText(id, 'todos', text)}
        editingItemId={editingItemId}
        editingText={editingText}
        setEditingItemId={setEditingItemId}
        setEditingText={setEditingText}
      />

      {/* Board: full-width columns */}
      <div className="flex items-center justify-between mb-4 mt-12">
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
              onClick={addColumn}
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
        {state.columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            items={state.items.filter((i) => i.columnId === col.id)}
            colorStyles={COLOR_STYLES[col.color]}
            dragOverTarget={dragOverTarget}
            onAdd={(text) => addItem(col.id, text)}
            onDelete={(id) => deleteItem(id, col.id)}
            onRename={(label) => renameColumn(col.id, label)}
            onRemoveColumn={() => removeColumn(col.id)}
            onChangeColor={(color) => changeColumnColor(col.id, color)}
            onDragStart={(id) => handleDragStart(id, col.id)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            onEdit={(id, text) => updateItemText(id, col.id, text)}
            editingItemId={editingItemId}
            editingText={editingText}
            setEditingItemId={setEditingItemId}
            setEditingText={setEditingText}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnProps {
  column: BoardColumn;
  items: BoardItem[];
  colorStyles: { bg: string; border: string };
  dragOverTarget: string | null;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onRename: (label: string) => void;
  onRemoveColumn: () => void;
  onChangeColor: (color: typeof COLUMN_COLORS[number]) => void;
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
  items,
  colorStyles,
  dragOverTarget,
  onAdd,
  onDelete,
  onRename,
  onRemoveColumn,
  onChangeColor,
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
      {/* Header */}
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
              className={`w-6 h-6 border ${colorStyles.bg} ${colorStyles.border} ${column.color === c ? 'ring-2 ring-ink' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Cards */}
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
            onDragStart={() => onDragStart(item.id)}
            onDelete={() => onDelete(item.id)}
            onEdit={(text) => onEdit(item.id, text)}
            editingItemId={editingItemId}
            editingText={editingText}
            setEditingItemId={setEditingItemId}
            setEditingText={setEditingText}
          />
        ))}
      </div>

      {/* Add */}
      {adding ? (
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
          + Add task
        </button>
      )}
    </div>
  );
}

interface CardProps {
  item: BoardItem;
  onDragStart: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  editingItemId: string | null;
  editingText: string;
  setEditingItemId: (id: string | null) => void;
  setEditingText: (text: string) => void;
}

function Card({ item, onDragStart, onDelete, onEdit, editingItemId, editingText, setEditingItemId, setEditingText }: CardProps) {
  const isEditing = editingItemId === item.id;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        onDragStart();
      }}
      className="bg-paper border border-ink/15 p-3 cursor-grab active:cursor-grabbing hover:border-ink/40 transition-colors"
    >
      {isEditing ? (
        <input
          type="text"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={() => { onEdit(editingText); setEditingItemId(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onEdit(editingText); setEditingItemId(null); }
            if (e.key === 'Escape') { setEditingItemId(null); }
          }}
          autoFocus
          className="w-full font-body text-sm text-ink bg-cream/30 border border-ink/30 px-1 py-0.5 outline-none"
        />
      ) : (
        <p
          className="font-body text-sm text-ink leading-snug break-words cursor-pointer"
          onClick={() => { setEditingText(item.text); setEditingItemId(item.id); }}
        >
          {item.text}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={() => { setEditingText(item.text); setEditingItemId(item.id); }}
          className="font-body text-xs text-ink/40 hover:text-ink transition-colors"
        >
          edit
        </button>
        <button
          onClick={onDelete}
          className="font-body text-xs text-ink/40 hover:text-coral transition-colors"
          aria-label="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface TodoListProps {
  todos: BoardItem[];
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
}

function TodoList({
  todos,
  dragOverTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onAdd,
  onDelete,
  onMove,
  onEdit,
  editingItemId,
  editingText,
  setEditingItemId,
  setEditingText,
}: TodoListProps) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText('');
  };

  return (
    <div
      onDragOver={(e) => onDragOver(e, 'todos')}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, 'todos')}
      className={`border border-ink/20 p-4 mb-6 transition-all ${
        dragOverTarget === 'todos' ? 'ring-2 ring-ink' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-body text-caption uppercase tracking-widest text-ink/50">
          To do list
        </h3>
        <span className="font-body text-caption uppercase text-ink/30 tabular-nums">
          [{todos.length}]
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {todos.length === 0 && (
          <p className="font-body text-sm text-ink/40 italic px-2 py-3">
            Nothing in your to do list. Add one or drag tasks here from the board.
          </p>
        )}
        {todos.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', t.id);
              onDragStart(t.id, 'todos');
            }}
            className="bg-paper border border-ink/15 p-3 flex items-start gap-2 cursor-grab active:cursor-grabbing"
          >
            {editingItemId === t.id ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => { onEdit(t.id, editingText); setEditingItemId(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onEdit(t.id, editingText); setEditingItemId(null); }
                  if (e.key === 'Escape') { setEditingItemId(null); }
                }}
                autoFocus
                className="flex-1 font-body text-sm text-ink bg-cream/30 border border-ink/30 px-1 py-0.5 outline-none"
              />
            ) : (
              <p
                className="flex-1 font-body text-sm text-ink leading-snug cursor-pointer"
                onClick={() => { setEditingText(t.text); setEditingItemId(t.id); }}
              >
                {t.text}
              </p>
            )}
            <button
              onClick={() => onMove(t.id)}
              className="font-body text-xs text-ink/40 hover:text-ink transition-colors whitespace-nowrap"
            >
              → board
            </button>
              <button
                onClick={() => { setEditingText(t.text); setEditingItemId(t.id); }}
                className="font-body text-xs text-ink/40 hover:text-ink transition-colors"
              >
                edit
              </button>
            <button
              onClick={() => onDelete(t.id)}
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
