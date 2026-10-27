'use client';

// VoiceFoodCapture — speak a food name and its macros, get the
// macros back.
//
// This is the primary capture path in the "Add custom food" modal.
// The photo scanner stays alongside it (a photo is still better when
// the physical label is in front of you), but talking is the fastest
// route when you've already got the numbers in your head.
//
// Flow:
//   tap mic → speak → transcript normalised (number words → digits,
//   "carbs" → "carbohydrate") → written into the shared "Or describe
//   it" textarea → user reviews → "Auto-fill macros" → the existing
//   /api/foods/custom/extract endpoint fills the form.
//
// Two deliberate constraints:
//
//   1. Audio never leaves the browser. Transcription is done by the
//      browser's own Web Speech API; only the resulting *text* is
//      sent to the user's own LLM. No audio upload, no new storage
//      bucket, no new API route.
//
//   2. The transcript lands in the existing textarea, not directly
//      into the form. One input, one "Auto-fill macros" button, and
//      the user can always see — and fix — what we heard.
//
// Browsers without SpeechRecognition (Firefox) never render this
// component's button at all. The feature is absent, not broken.

import { useCallback, useEffect, useRef } from 'react';
import { useSpeechCapture } from '@/hooks/useSpeechCapture';
import { normaliseSpokenDescription } from '@/lib/speech/macros';

interface Props {
  /**
   * Called with the normalised transcript when an utterance ends.
   * The parent writes it into the shared description textarea.
   */
  onTranscript: (text: string) => void;
  /** Disable when the user has no LLM key on file. */
  disabled?: boolean;
  disabledReason?: string;
}

export default function VoiceFoodCapture({
  onTranscript,
  disabled,
  disabledReason,
}: Props) {
  const {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
    clearError,
  } = useSpeechCapture();

  // Tracks the last transcript we handed to the parent so we don't
  // fire the callback twice for the same utterance.
  const deliveredRef = useRef<string>('');

  // The parent passes an inline arrow function, so its identity
  // changes on every render. Keep the latest one in a ref so the
  // delivery effect doesn't re-fire just because the parent
  // re-rendered.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // When the user stops (manually or on auto-stop) the hook has
  // already flipped `listening` to false. Deliver the transcript
  // once it settles.
  //
  // The `deliveredRef` guard makes this idempotent: `handleToggle`
  // may have already delivered the same text when the user tapped
  // stop manually, and this effect would otherwise deliver it again.
  useEffect(() => {
    if (listening) return;
    const text = transcript.trim();
    if (!text) return;
    if (text === deliveredRef.current) return;
    deliveredRef.current = text;
    onTranscriptRef.current(normaliseSpokenDescription(text));
  }, [listening, transcript]);

  const handleToggle = useCallback(async () => {
    if (listening) {
      // `stop()` returns the final text and flips `listening` to
      // false. Deliver it right away so the user isn't waiting on
      // the effect above (which needs another render to fire).
      const text = stop().trim();
      if (text && text !== deliveredRef.current) {
        deliveredRef.current = text;
        onTranscriptRef.current(normaliseSpokenDescription(text));
      }
      return;
    }
    clearError();
    deliveredRef.current = '';
    await start();
  }, [listening, stop, start, clearError]);

  // Don't render at all in browsers without speech recognition.
  // A dead button is worse than no button.
  if (!supported) return null;

  if (disabled) {
    return (
      <div className="mb-4 p-3 border border-ink/15 bg-cream/30">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
          🎙 Speak your food
        </p>
        <p className="font-body text-sm text-ink/70 leading-relaxed">
          {disabledReason ??
            'Add your AI key below to unlock voice capture.'}{' '}
          Then just say the name and the macros — no typing, no
          squinting at tiny print.
        </p>
      </div>
    );
  }

  const errorCopy = errorMessage(error);

  return (
    <div className="mb-4 p-3 border border-ink/15 bg-cream/30">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
        🎙 Speak your food
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleToggle}
          disabled={error === 'service-not-allowed'}
          aria-label={listening ? 'Stop voice capture' : 'Start voice capture'}
          aria-pressed={listening}
          className={`w-11 h-11 flex items-center justify-center border transition-colors ${
            listening
              ? 'border-coral bg-coral text-paper'
              : 'border-coral text-coral hover:bg-coral/5'
          } disabled:opacity-50`}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {listening ? '■' : '🎙'}
          </span>
        </button>

        <div className="flex-1 min-w-[180px]">
          {listening ? (
            <>
              <p className="font-body text-caption uppercase tracking-widest text-coral">
                Listening — speak now
              </p>
              {interim && (
                <p
                  className="font-body text-sm text-ink/50 italic mt-1"
                  aria-live="polite"
                >
                  {interim}
                </p>
              )}
            </>
          ) : (
            <p className="font-body text-sm text-ink/70 leading-relaxed">
              Tap the mic and say it. Try:{' '}
              <span className="text-ink">
                &ldquo;greek yogurt, one hundred and twenty calories, fifteen
                grams protein, twenty carbs, two fat&rdquo;
              </span>
            </p>
          )}
        </div>
      </div>

      {transcript && !listening && (
        <div className="mt-3 border border-ink/15 bg-paper p-2">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Heard
          </p>
          <p className="font-body text-sm text-ink" aria-live="polite">
            {transcript}
          </p>
        </div>
      )}

      {errorCopy && (
        <div className="mt-3 border border-coral/40 bg-coral/10 p-2">
          <p className="font-body text-sm text-ink">{errorCopy}</p>
          <button
            type="button"
            onClick={() => {
              clearError();
              reset();
            }}
            className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 underline underline-offset-2 mt-1"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

/** Human copy per SpeechRecognition error code. */
function errorMessage(error: string | null): string | null {
  // No error — no message. This case must come first, otherwise
  // `null` falls through to the default branch and every render
  // shows a failure message.
  if (!error) return null;

  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return "Microphone blocked — allow it in your browser settings, or just type it.";
    case 'audio-capture':
      return 'No microphone found. Plug one in, or just type it.';
    case 'no-speech':
      return "Didn't catch that — try again, or type it.";
    case 'network':
      return 'Speech recognition lost its connection. Try again, or type it.';
    case 'aborted':
      return null;
    default:
      return 'Voice capture failed. Try again, or type it.';
  }
}
