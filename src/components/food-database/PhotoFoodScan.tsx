'use client';

// PhotoFoodScan — capture a food label, hand the image to the
// server's vision / OCR pipeline, pipe the structured result into
// AddCustomFoodModal the same way the typed-description path does.
//
// Three capture paths in one <input>:
//   1. Mobile: capture="environment" opens the rear camera
//   2. Desktop: file picker (camera appears as a source if the OS
//      supports it, e.g. macOS Continuity Camera)
//   3. Drag-and-drop a file onto the drop zone
//   4. Paste an image from the clipboard (Cmd+V / Ctrl+V while the
//      modal is open)
//
// The actual OCR + LLM extraction runs server-side at
// /api/foods/custom/photo — this component only handles capture +
// preview + calling that endpoint.

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import type { ExtractedFood, LLMProvider } from '@/lib/llm/types';

// Same shape FoodSearch already uses to surface "My food" + "My food"
// badges. We don't need the full Food type — only the LLM-extracted
// shape — so the modal can pre-fill the form with the same logic
// the typed-description path uses.
interface PhotoResult {
  food: ExtractedFood;
  path: 'vision' | 'ocr-then-text';
  provider_name: string;
  ocr_text: string | null;
}

interface Props {
  onExtracted: (food: ExtractedFood, meta: { ocrText: string | null; path: 'vision' | 'ocr-then-text' }) => void;
  /** Disable when the user has no LLM key on file — the typed-
   *  description path uses the same gate, this should too. */
  disabled?: boolean;
  disabledReason?: string;
}

export default function PhotoFoodScan({ onExtracted, disabled, disabledReason }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [imageMime, setImageMime] = useState<'image/jpeg' | 'image/png' | 'image/webp' | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setError(`Unsupported file type "${file.type || 'unknown'}". Use JPEG, PNG, or WEBP.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setImageDataUrl(dataUrl);
      // Split off the data URL prefix so we have raw bytes to POST.
      const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) {
        setError('Could not read the image.');
        return;
      }
      const mime = m[1] as 'image/jpeg' | 'image/png' | 'image/webp';
      const bin = atob(m[2]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      setImageMime(mime);
      setImageBytes(bytes);
    };
    reader.onerror = () => setError('Could not read the image file.');
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!imageBytes || !imageMime) return;
    setExtracting(true);
    setError(null);
    try {
      const fd = new FormData();
      // FormData append with a Blob + filename sets the multipart
      // Content-Disposition. Server reads `image` field.
      //
      // TS strictness: Node's Uint8Array<ArrayBufferLike> isn't
      // directly assignable to BlobPart (which wants
      // Uint8Array<ArrayBuffer>), so we copy into a fresh
      // ArrayBuffer-backed view first.
      const view = new Uint8Array(new ArrayBuffer(imageBytes.byteLength));
      view.set(imageBytes);
      const blob = new Blob([view], { type: imageMime });
      fd.append('image', blob, 'photo.jpg');
      const res = await apiFetch('/api/foods/custom/photo', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        food?: ExtractedFood;
        provider_name?: string;
        path?: 'vision' | 'ocr-then-text';
        ocr_text?: string | null;
        error?: string;
        code?: 'no_llm_key' | 'no_ocr_provider';
      };
      if (!res.ok || !data.ok || !data.food) {
        // Mirror the typed-description flow's "no key" surfacing.
        if (res.status === 412 || data.code === 'no_llm_key') {
          setError(
            'Add your LLM key below to enable photo scanning.'
          );
          setExtracting(false);
          return;
        }
        if (res.status === 503 || data.code === 'no_ocr_provider') {
          setError(
            data.error ||
              "Your LLM provider doesn't read images and no OCR service is configured. Add an OpenAI / Anthropic / Gemini key."
          );
          setExtracting(false);
          return;
        }
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const out: PhotoResult = {
        food: data.food,
        path: data.path ?? 'vision',
        provider_name: data.provider_name ?? '',
        ocr_text: data.ocr_text ?? null,
      };
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }, [imageBytes, imageMime]);

  const reset = useCallback(() => {
    setImageDataUrl(null);
    setImageBytes(null);
    setImageMime(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Paste-from-clipboard: register on window so the user can paste
  // an image anywhere in the modal (screenshot of a label, etc.).
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            acceptFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [acceptFile, disabled]);

  // Disable the panel when there's no LLM key — same gate the
  // typed-description path uses. Don't render the buttons at all so
  // the user can't accidentally hit them.
  if (disabled) {
    return (
      <div className="mb-4 p-3 border border-ink/15 bg-cre-30">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
          📷 Scan the label
        </p>
        <p className="font-body text-caption text-ink/60">
          {disabledReason ||
            'Add your LLM key below to enable photo scanning.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 border border-ink/15 bg-cre-30">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
        📷 Scan the label
      </p>

      {!imageDataUrl && !result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) acceptFile(file);
          }}
          className={`flex flex-col items-center gap-2 p-4 border-2 border-dashed transition-colors ${
            dragOver
              ? 'border-coral bg-coral/5'
              : 'border-ink/20 bg-paper'
          }`}
        >
          <p className="font-body text-sm text-ink/70 text-center">
            Take a photo of the nutrition table — works with food packs,
            cans, bottles, anything with printed macros.
          </p>
          <p className="font-body text-caption text-ink/40 text-center">
            Or drop a file / paste an image (Cmd+V).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) acceptFile(file);
            }}
            className="block w-full text-sm text-ink file:mr-3 file:py-2 file:px-3 file:border file:border-ink/20 file:bg-paper file:text-ink file:cursor-pointer"
          />
        </div>
      )}

      {(imageDataUrl || result) && (
        <div className="space-y-3">
          {imageDataUrl && (
            <div className="border border-ink/15 bg-paper p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Captured food label"
                className="block max-h-48 mx-auto"
              />
            </div>
          )}

          {result && (
            <div
              className={`px-3 py-2 border text-sm ${
                result.food.confidence === 'high'
                  ? 'border-teal/40 bg-teal/10 text-ink'
                  : result.food.confidence === 'medium'
                  ? 'border-ink/30 bg-ink/5 text-ink'
                  : 'border-coral/40 bg-coral/10 text-ink'
              }`}
            >
              <p className="font-body text-caption uppercase tracking-widest text-ink/60">
                Scanned · {result.path === 'vision' ? 'vision model' : 'OCR + text model'} ·{' '}
                confidence {result.food.confidence}
              </p>
              <p className="mt-1 font-body text-base text-ink">
                {result.food.name}
                {result.food.brand ? ` · ${result.food.brand}` : ''}
              </p>
              {result.food.notes && (
                <p className="mt-1 font-body text-ink/80">
                  {result.food.notes}
                </p>
              )}
              <p className="mt-1 font-body text-caption text-ink/50">
                Verify the numbers below — they're best-effort estimates
                from your {result.provider_name || 'LLM'}.
              </p>
            </div>
          )}

          {error && (
            <p className="font-body text-caption text-coral">{error}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!result && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={extracting || !imageBytes}
                className="px-3 py-2 border border-coral text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors disabled:opacity-50"
              >
                {extracting ? 'Reading…' : 'Read macros from photo'}
              </button>
            )}
            {result && (
              <button
                type="button"
                onClick={() =>
                  onExtracted(result.food, {
                    ocrText: result.ocr_text,
                    path: result.path,
                  })
                }
                className="px-3 py-2 border border-coral text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors"
              >
                Use these macros
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink px-2 py-2 transition-colors"
            >
              {result ? 'Try another' : 'Retake'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
