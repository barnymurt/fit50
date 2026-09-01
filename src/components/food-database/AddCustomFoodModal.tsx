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
// The "Or describe it" section above wires the OpenAI auto-fill hook
// (`/api/foods/custom/extract`). The source field is hard-coded to
// 'manual' here because the user reviews + edits before saving —
// flipping it to 'llm' would misrepresent a row the user corrected.
// A separate audit trail (description, confidence, prompt version)
// could live on the row later.

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

interface ExtractionResult {
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

interface OpenAiKeyStatus {
  set: boolean;
  masked: string | null;
}

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

  // LLM auto-fill state. The user types a description; we POST it to
  // /api/foods/custom/extract which calls gpt-4o-mini with the user's
  // own OpenAI key, and pre-fills the form fields. The user reviews
  // before saving.
  const [extractDescription, setExtractDescription] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // BYOK state — the user's own OpenAI key. We never display the
  // secret; only whether it's set + a masked preview. If unset, the
  // modal shows an inline "add your key" prompt.
  const [keyStatus, setKeyStatus] = useState<OpenAiKeyStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyEditing, setKeyEditing] = useState(false);

  // Reset the form each time the modal opens so previous entries
  // don't bleed across.
  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, category: defaultCategory });
      setError(null);
      setSubmitting(false);
      setExtractDescription('');
      setExtracting(false);
      setExtractionResult(null);
      setExtractionError(null);
      // Fetch the user's OpenAI key status. We only show the
      // auto-fill section as fully enabled when a key is on file.
      setKeyStatus(null);
      setKeyInput('');
      setKeyBusy(false);
      setKeyError(null);
      setKeyEditing(false);
      fetch('/api/account/openai-key', { method: 'GET' })
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.set === 'boolean') {
            setKeyStatus({ set: data.set, masked: data.masked ?? null });
          }
        })
        .catch(() => {
          // Non-fatal: the user can still use the manual form.
        });
    }
  }, [open, defaultCategory]);

  const handleSaveKey = async () => {
    if (keyBusy) return;
    const k = keyInput.trim();
    if (!k) return;
    setKeyBusy(true);
    setKeyError(null);
    try {
      const res = await fetch('/api/account/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: k }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setKeyStatus({ set: true, masked: data.masked ?? 'sk-••••' });
      setKeyInput('');
      setKeyEditing(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Could not save the key.');
    } finally {
      setKeyBusy(false);
    }
  };

  const handleClearKey = async () => {
    if (keyBusy) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Remove your OpenAI key? Auto-fill will stop working until you add a new one.')
    ) {
      return;
    }
    setKeyBusy(true);
    setKeyError(null);
    try {
      const res = await fetch('/api/account/openai-key', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setKeyStatus({ set: false, masked: null });
      setKeyEditing(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Could not clear the key.');
    } finally {
      setKeyBusy(false);
    }
  };

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

  const handleExtract = async () => {
    if (extracting) return;
    const desc = extractDescription.trim();
    if (!desc) {
      setExtractionError('Type a description first.');
      return;
    }
    setExtracting(true);
    setExtractionError(null);
    setExtractionResult(null);
    try {
      const res = await fetch('/api/foods/custom/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 412 with code='no_openai_key' means the user hasn't added
        // a key yet. Surface that as the BYOK prompt instead of a
        // generic extraction error.
        if (res.status === 412 && data?.code === 'no_openai_key') {
          setKeyEditing(true);
          setKeyError('Add your OpenAI key below to enable auto-fill.');
          throw new Error('No OpenAI key on file.');
        }
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const food = data.food as {
        name: string;
        brand: string | null;
        category: string;
        subcategory: string | null;
        kcal: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        serving_basis: '100g' | '100ml';
        standard_serving_grams: number | null;
        standard_serving_label: string | null;
        aliases: string[];
        confidence: 'high' | 'medium' | 'low';
        notes: string | null;
      };
      // Populate the manual form fields. The user reviews + edits
      // before saving.
      setForm((prev) => ({
        ...prev,
        name: food.name || prev.name,
        brand: food.brand ?? '',
        category: food.category || prev.category,
        subcategory: food.subcategory ?? '',
        kcal: String(food.kcal),
        protein: String(food.protein),
        carbs: String(food.carbs),
        fat: String(food.fat),
        fiber: String(food.fiber),
        standardServingGrams: food.standard_serving_grams
          ? String(food.standard_serving_grams)
          : '100',
        standardServingLabel:
          food.standard_serving_label ?? prev.standardServingLabel,
        aliases: (food.aliases ?? []).join(', '),
      }));
      setExtractionResult({
        confidence: food.confidence,
        notes: food.notes,
      });
    } catch (err) {
      setExtractionError(
        err instanceof Error ? err.message : 'Auto-fill failed.'
      );
    } finally {
      setExtracting(false);
    }
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

          <div className="mb-4 p-3 bg-cre-30 border border-ink/15">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
              Or describe it
            </p>
            <textarea
              value={extractDescription}
              onChange={(e) => setExtractDescription(e.target.value)}
              placeholder="e.g. homemade granola with oats, honey, almonds, and a bit of olive oil"
              rows={2}
              className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-coral outline-none text-sm"
            />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !extractDescription.trim() || keyStatus?.set === false}
                className="px-3 py-2 border border-coral text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors disabled:opacity-50"
              >
                {extracting ? 'Asking AI…' : 'Auto-fill macros'}
              </button>
              {keyStatus === null ? (
                <span className="font-body text-caption text-ink/40">
                  Loading…
                </span>
              ) : keyStatus.set ? (
                <span className="font-body text-caption text-ink/40">
                  Uses your OpenAI key ({keyStatus.masked}).
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setKeyEditing(true)}
                  className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 underline underline-offset-2"
                >
                  Add your OpenAI key
                </button>
              )}
            </div>

            {(keyEditing || (!keyStatus?.set && keyStatus !== null)) && (
              <div className="mt-3 p-3 border border-ink/15 bg-paper">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                  Your OpenAI key
                </p>
                <p className="font-body text-caption text-ink/60 mb-2">
                  Stored on your profile so the server can call OpenAI
                  for you. We never see the secret — only that it's set.
                  Your key, your bill.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                    className="flex-1 min-w-[180px] px-3 py-2 bg-paper border-2 border-ink/20 font-mono text-sm focus:border-coral outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={keyBusy || !keyInput.trim()}
                    className="px-3 py-2 bg-ink text-paper font-body text-caption uppercase tracking-widest disabled:opacity-50"
                  >
                    {keyBusy ? 'Saving…' : 'Save key'}
                  </button>
                  {keyStatus?.set && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      disabled={keyBusy}
                      className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/60 hover:border-ink hover:text-ink transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setKeyEditing(false);
                      setKeyInput('');
                      setKeyError(null);
                    }}
                    className="px-3 py-2 font-body text-caption uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {keyError && (
                  <p className="font-body text-caption text-coral mt-2">
                    {keyError}
                  </p>
                )}
              </div>
            )}
            {extractionError && (
              <p className="font-body text-caption text-coral mt-2">
                {extractionError}
              </p>
            )}
            {extractionResult && (
              <div
                className={`mt-2 px-3 py-2 border text-sm ${
                  extractionResult.confidence === 'high'
                    ? 'border-teal/40 bg-teal/10 text-ink'
                    : extractionResult.confidence === 'medium'
                    ? 'border-ink/30 bg-ink/5 text-ink'
                    : 'border-coral/40 bg-coral/10 text-ink'
                }`}
              >
                <p className="font-body text-caption uppercase tracking-widest text-ink/60">
                  AI-filled · confidence {extractionResult.confidence}
                </p>
                {extractionResult.notes && (
                  <p className="mt-1 font-body text-ink/80">
                    {extractionResult.notes}
                  </p>
                )}
                <p className="mt-1 font-body text-caption text-ink/50">
                  Verify the numbers below — they're best-effort estimates.
                </p>
              </div>
            )}
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