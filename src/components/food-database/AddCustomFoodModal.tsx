'use client';

import { useEffect, useState } from 'react';
import { Food } from './types';

// AddCustomFoodModal — owner-only food entry. On save, posts to
// /api/foods/custom and on success calls `onCreated` with the new
// food (mapped into the shared Food shape so the search panel can
// merge it into results).
//
// The form auto-fills the standard serving (100 g) when the user
// hasn't typed one. An `submit_to_community` toggle sets the row to
// pending_review; a follow-up PATCH with submission_status =
// 'private' withdraws the submission.
//
// We don't use an LLM here yet — the source field defaults to
// 'manual'. A future follow-up can wire the OpenAI call to extract
// macros from a free-text description; the API supports it today.

interface CreateInput {
  name: string;
  brand?: string | null;
  category?: string;
  subcategory?: string | null;
  kcal?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fat?: number | string;
  fiber?: number | string;
  standard_serving_grams?: number | string;
  standard_serving_label?: string | null;
  aliases?: string[];
  submit_to_community?: boolean;
  source?: 'manual' | 'llm';
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a successful create so the parent can react
   *  (insert into its own state, close the modal, etc.). */
  onCreated?: (food: Food) => void;
  /** Performs the actual create. Returns the saved Food (or throws). */
  onCreate: (input: CreateInput) => Promise<Food>;
  defaultCategory?: string;
}

interface FormState {
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  standardServingGrams: string;
  standardServingLabel: string;
  aliases: string;
  submitToCommunity: boolean;
}

const DEFAULT_FORM: FormState = {
  name: '',
  brand: '',
  category: 'Other',
  subcategory: '',
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  standardServingGrams: '100',
  standardServingLabel: '100 g',
  aliases: '',
  submitToCommunity: false,
};

const CATEGORY_OPTIONS = [
  'Other',
  'Meat & Poultry',
  'Fish & Seafood',
  'Eggs',
  'Dairy',
  'Milk & Milk Alternatives',
  'Grains',
  'Bread & Bakery',
  'Pasta & Noodles',
  'Rice & Rice Dishes',
  'Legumes & Beans',
  'Vegetables',
  'Fruits',
  'Nuts & Seeds',
  'Oils & Fats',
  'Condiments & Sauces',
  'Snacks',
  'Sweets & Desserts',
  'Breakfast Foods',
  'Ready Meals',
  'Soups',
  'Salads',
  'Sandwiches & Wraps',
  'Pizza & Fast Food',
  'Beverages',
  'Protein Foods',
];

export default function AddCustomFoodModal({
  open,
  onClose,
  onCreate,
  onCreated,
  defaultCategory = 'Other',
}: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the modal opens so previous entries
  // don't bleed across.
  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, category: defaultCategory });
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const aliases = form.aliases
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSubmitting(true);
    try {
      const created = await onCreate({
        name: form.name,
        brand: form.brand || null,
        category: form.category || 'Other',
        subcategory: form.subcategory || null,
        kcal: form.kcal,
        protein: form.protein,
        carbs: form.carbs,
        fat: form.fat,
        fiber: form.fiber,
        standard_serving_grams: form.standardServingGrams,
        standard_serving_label: form.standardServingLabel,
        aliases,
        submit_to_community: form.submitToCommunity,
        source: 'manual',
      });
      onCreated?.(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add a custom food"
    >
      <div
        className="bg-paper w-full md:max-w-lg border border-ink/15 max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
                Add a food
              </p>
              <h3 className="font-display text-h2 text-ink leading-tight">
                Your food, your macros.
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="font-body text-caption uppercase text-ink/40 hover:text-ink px-2 py-1 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Homemade granola"
                required
                className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand (optional)">
                <input
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                  placeholder="e.g. Backer's"
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Subcategory (optional)">
              <input
                value={form.subcategory}
                onChange={(e) => update('subcategory', e.target.value)}
                placeholder="e.g. Cookies"
                className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
              />
            </Field>

            <p className="font-body text-caption uppercase tracking-widest text-ink/40 pt-2">
              Macros per 100 g
            </p>
            <div className="grid grid-cols-5 gap-2">
              <MacroInput
                label="kcal"
                value={form.kcal}
                onChange={(v) => update('kcal', v)}
              />
              <MacroInput
                label="P"
                value={form.protein}
                onChange={(v) => update('protein', v)}
              />
              <MacroInput
                label="C"
                value={form.carbs}
                onChange={(v) => update('carbs', v)}
              />
              <MacroInput
                label="F"
                value={form.fat}
                onChange={(v) => update('fat', v)}
              />
              <MacroInput
                label="Fib"
                value={form.fiber}
                onChange={(v) => update('fiber', v)}
              />
            </div>

            <p className="font-body text-caption uppercase tracking-widest text-ink/40 pt-2">
              Standard serving
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Grams">
                <input
                  type="number"
                  min={1}
                  value={form.standardServingGrams}
                  onChange={(e) => update('standardServingGrams', e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
                />
              </Field>
              <Field label="Label">
                <input
                  value={form.standardServingLabel}
                  onChange={(e) => update('standardServingLabel', e.target.value)}
                  placeholder="100 g"
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
                />
              </Field>
            </div>

            <Field label="Aliases (comma-separated, optional)">
              <input
                value={form.aliases}
                onChange={(e) => update('aliases', e.target.value)}
                placeholder="granola bar, oat clusters"
                className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none"
              />
            </Field>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.submitToCommunity}
                onChange={(e) => update('submitToCommunity', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-body text-sm text-ink">
                Submit to the community — admins will review for the
                shared database.
              </span>
            </label>

            {error && (
              <p className="font-body text-caption text-coral">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting || !form.name.trim()}
                className="flex-1 bg-ink text-paper font-body text-caption uppercase tracking-widest px-4 py-3 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save food'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-body text-caption uppercase tracking-widest text-ink/40 hover:text-ink border border-ink/20 px-4 py-3 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
        {label}
        {required && <span className="text-coral ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full px-2 py-2 bg-paper border-2 border-ink/20 font-body text-sm focus:border-coral outline-none"
      />
    </label>
  );
}