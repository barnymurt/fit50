'use client';

import { useEffect, useState } from 'react';
import { useCustomFoods, CustomFoodRow } from '@/hooks/useCustomFoods';
import { Food } from './types';
import AddCustomFoodModal from './AddCustomFoodModal';

interface Props {
  /** Called when the user hits "Log" on a row. Receives the full
   *  Food so the parent can open its detail / portion modal. */
  onPickFood?: (food: Food) => void;
}

// Status badge: "private" / "pending_review" / "published" / "rejected".
function StatusBadge({ status }: { status: CustomFoodRow['submission_status'] }) {
  if (status === 'private') return null;
  type Status = CustomFoodRow['submission_status'];
  const styles: Record<Status, string> = {
    private: '',
    pending_review: 'bg-ink/10 text-ink/70 border-ink/30',
    published: 'bg-teal/15 text-teal border-teal/40',
    rejected: 'bg-coral/10 text-coral border-coral/40',
  };
  const label: Record<Status, string> = {
    private: '',
    pending_review: 'Pending review',
    published: 'Published',
    rejected: 'Rejected',
  };
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-widest border ${styles[status]}`}
    >
      {label[status]}
    </span>
  );
}

export default function MyCustomFoodsPanel({ onPickFood }: Props) {
  const {
    rows,
    foods,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  } = useCustomFoods();

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const runOnRow = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setRowError(null);
    try {
      await fn();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmit = async (
    id: string | null,
    submission_status: 'pending_review' | 'private'
  ) => {
    if (id === null) return;
    await runOnRow(id, () => update(id, { submission_status }));
  };

  if (loading && rows.length === 0) {
    return (
      <div className="bg-paper border border-ink/15 p-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50">
          My foods
        </p>
        <p className="font-body text-sm text-ink/40 mt-2">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-ink/15">
      <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50">
            My foods
          </p>
          <p className="font-body text-sm text-ink/60 mt-1">
            Foods you've added. Submit any of them to share with the
            community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
            {rows.length} {rows.length === 1 ? 'item' : 'items'}
          </span>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-3 py-2 bg-coral text-paper font-body text-caption uppercase tracking-widest hover:bg-coral/85 transition-colors"
          >
            + Add custom food
          </button>
        </div>
      </div>

      {error && (
        <p className="px-6 py-3 font-body text-caption text-coral border-b border-ink/10">
          {error} <button onClick={refresh} className="underline ml-2">Retry</button>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-body text-base text-ink/70">
            You haven't added any foods yet.
          </p>
          <p className="font-body text-sm text-ink/40 mt-2 max-w-md mx-auto">
            Tap <strong>+ Add custom food</strong> to log a recipe, a
            branded product, or anything not in the public database. Your
            foods are private unless you choose to submit them.
          </p>
        </div>
      ) : (
        <ul>
          {rowError && (
            <li className="px-6 py-2 font-body text-caption text-coral border-b border-ink/10">
              {rowError}
            </li>
          )}
          {rows.map((row) => {
            const busy = busyId === row.id;
            const food = foods.find((f) => f.id === row.id);
            const isPending = row.submission_status === 'pending_review';
            const isRejected = row.submission_status === 'rejected';
            return (
              <li
                key={row.id}
                className="px-6 py-4 border-b border-ink/10 last:border-b-0 flex items-start gap-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-display text-h3 text-ink leading-tight">
                      {row.name}
                    </p>
                    <StatusBadge status={row.submission_status} />
                  </div>
                  <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums mt-1">
                    {row.brand ? `${row.brand} · ·` : ''}
                    {Math.round(row.kcal)} kcal ·
                    {' '}{Number(row.protein).toFixed(1)}g P ·
                    {' '}{Number(row.carbs).toFixed(1)}g C ·
                    {' '}{Number(row.fat).toFixed(1)}g F ·
                    {' '}{Number(row.fiber).toFixed(1)}g fib
                    {' '}· per 100 g
                  </p>
                  {row.submitted_at && isPending && (
                    <p className="font-body text-caption text-ink/40 mt-1">
                      Submitted{' '}
                      {new Date(row.submitted_at).toLocaleDateString()}.
                      {' '}You'll see it on the shared database once an
                      admin reviews it.
                    </p>
                  )}
                  {isRejected && (
                    <p className="font-body text-caption text-coral mt-1">
                      The admin didn't accept this submission. Edit and
                      resubmit, or delete it.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {food && onPickFood && (
                    <button
                      type="button"
                      onClick={() => onPickFood(food)}
                      className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 hover:border-ink hover:text-ink transition-colors"
                    >
                      Log
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditId(row.id)}
                    disabled={busy}
                    className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 hover:border-ink hover:text-ink transition-colors disabled:opacity-50"
                  >
                    Edit
                  </button>
                  {row.submission_status === 'private' && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(row.id, 'pending_review')}
                      disabled={busy}
                      className="px-3 py-2 border border-coral/40 text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors disabled:opacity-50"
                    >
                      {busy ? 'Submitting…' : 'Submit to community'}
                    </button>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(row.id, 'private')}
                      disabled={busy}
                      className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/60 hover:border-ink hover:text-ink transition-colors disabled:opacity-50"
                    >
                      {busy ? 'Cancelling…' : 'Cancel submission'}
                    </button>
                  )}
                  {confirmDeleteId === row.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          runOnRow(row.id, () => remove(row.id)).then(() =>
                            setConfirmDeleteId(null)
                          )
                        }
                        disabled={busy}
                        className="px-3 py-2 border border-coral text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors disabled:opacity-50"
                      >
                        {busy ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/60 hover:border-ink hover:text-ink transition-colors"
                      >
                        Keep
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(row.id)}
                      disabled={busy}
                      className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/40 hover:text-coral hover:border-coral/40 transition-colors disabled:opacity-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add modal — same as the search panel's "Add custom food"
          button, just triggered from this panel. */}
      <AddCustomFoodModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={async (input) => {
          const row = await create(input);
          return {
            id: row.id,
            name: row.name,
            brand: row.brand ?? null,
            category: row.category ?? 'Other',
            subcategory: row.subcategory ?? undefined,
            type: row.type ?? 'ingredient',
            kcal: Number(row.kcal ?? 0),
            protein: Number(row.protein ?? 0),
            carbs: Number(row.carbs ?? 0),
            fat: Number(row.fat ?? 0),
            fiber: Number(row.fiber ?? 0),
            servingBasis: '100g',
            standardServingGrams:
              row.standard_serving_grams != null
                ? Number(row.standard_serving_grams)
                : undefined,
            standardServingLabel: row.standard_serving_label ?? undefined,
            aliases: Array.isArray(row.aliases) ? row.aliases : [],
            isCustom: true,
            customSubmissionStatus: row.submission_status,
          };
        }}
      />

      <EditCustomFoodModal
        row={rows.find((r) => r.id === editId) ?? null}
        onClose={() => setEditId(null)}
        onSave={async (id, patch) => {
          await update(id, patch);
          setEditId(null);
        }}
        busy={!!busyId}
      />
    </div>
  );
}

// Minimal edit modal — same fields as the Add modal, pre-filled with
// the row's current values. Kept tiny on purpose; full UX can come
// later if we want richer editing.
function EditCustomFoodModal({
  row,
  onClose,
  onSave,
  busy,
}: {
  row: CustomFoodRow | null;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Seed the form whenever the modal opens with a new row.
  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setBrand(row.brand ?? '');
    setKcal(String(row.kcal));
    setProtein(String(row.protein));
    setCarbs(String(row.carbs));
    setFat(String(row.fat));
    setFiber(String(row.fiber));
    setError(null);
  }, [row?.id]);

  if (!row) return null;

  const handleSave = async () => {
    setError(null);
    try {
      await onSave(row.id, {
        name,
        brand: brand || null,
        kcal: Number(kcal),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        fiber: Number(fiber),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper w-full md:max-w-md border border-ink/15 max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Edit
          </p>
          <h3 className="font-display text-h2 text-ink leading-tight mb-4">
            {row.name}
          </h3>

          <label className="block mb-3">
            <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
            />
          </label>
          <label className="block mb-3">
            <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
              Brand
            </span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
            />
          </label>

          <p className="font-body text-caption uppercase tracking-widest text-ink/40 pt-2">
            Macros per 100 g
          </p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {([
              ['kcal', kcal, setKcal],
              ['P', protein, setProtein],
              ['C', carbs, setCarbs],
              ['F', fat, setFat],
              ['Fib', fiber, setFiber],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="block">
                <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
                  {label}
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full px-2 py-2 bg-paper border-2 border-ink/20 font-body text-sm focus:border-coral outline-none"
                />
              </label>
            ))}
          </div>

          {error && (
            <p className="font-body text-caption text-coral mb-3">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !name.trim()}
              className="flex-1 bg-ink text-paper font-body text-caption uppercase tracking-widest px-4 py-3 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-body text-caption uppercase tracking-widest text-ink/40 hover:text-ink border border-ink/20 px-4 py-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}