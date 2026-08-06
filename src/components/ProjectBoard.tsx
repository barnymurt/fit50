'use client';

import { useEffect, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';

interface BoardItem {
  id: string;
  text: string;
  status: 'todo' | 'progress' | 'done';
  createdAt: string;
}

const STORAGE_KEY = 'fit50-board-v1';

const COLUMNS: { id: BoardItem['status']; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const DEFAULT_ITEMS: BoardItem[] = [
  {
    id: 'seed-1',
    text: 'Pick the four recipes for the week',
    status: 'todo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    text: 'Walk 10,000 steps',
    status: 'todo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    text: 'Read 10 pages',
    status: 'progress',
    createdAt: new Date().toISOString(),
  },
];

export default function ProjectBoard() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newText, setNewText] = useState('');
  const [newStatus, setNewStatus] = useState<BoardItem['status']>('todo');

  useEffect(() => {
    const saved = loadJson<BoardItem[]>(STORAGE_KEY, DEFAULT_ITEMS);
    setItems(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, items);
  }, [items, hydrated]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: trimmed,
        status: newStatus,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewText('');
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const item = prev[idx];
      const columnIdx = COLUMNS.findIndex((c) => c.id === item.status);
      const nextColumnIdx = columnIdx + direction;
      if (nextColumnIdx < 0 || nextColumnIdx >= COLUMNS.length) return prev;
      const next = [...prev];
      next[idx] = { ...item, status: COLUMNS[nextColumnIdx].id };
      return next;
    });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      {/* Add form */}
      <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="What needs doing?"
          className="flex-1 px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
        />
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as BoardItem['status'])}
          className="px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
          aria-label="Column"
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink/10">
        {COLUMNS.map((col, ci) => {
          const colItems = items.filter((i) => i.status === col.id);
          return (
            <div
              key={col.id}
              className={`p-4 ${
                ci < COLUMNS.length - 1 ? 'border-b md:border-b-0 md:border-r border-ink/10' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                  {col.label}
                </p>
                <p className="font-body text-caption uppercase text-ink/30 tabular-nums">
                  {colItems.length}
                </p>
              </div>
              <ul className="space-y-2 min-h-[80px]">
                {colItems.length === 0 && (
                  <li className="font-body text-sm text-ink/30 italic px-2 py-3">
                    Nothing here yet
                  </li>
                )}
                {colItems.map((item) => {
                  const colIdx = COLUMNS.findIndex((c) => c.id === item.status);
                  return (
                    <li
                      key={item.id}
                      className="bg-paper border border-ink/10 p-3 group"
                    >
                      <p className="font-body text-sm text-ink leading-snug mb-2 break-words">
                        {item.text}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveItem(item.id, -1)}
                          disabled={colIdx === 0}
                          aria-label="Move left"
                          className="text-ink/40 hover:text-ink disabled:opacity-30 transition-colors text-xs"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => moveItem(item.id, 1)}
                          disabled={colIdx === COLUMNS.length - 1}
                          aria-label="Move right"
                          className="text-ink/40 hover:text-ink disabled:opacity-30 transition-colors text-xs"
                        >
                          →
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          aria-label="Delete"
                          className="ml-auto text-ink/30 hover:text-coral transition-colors text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
