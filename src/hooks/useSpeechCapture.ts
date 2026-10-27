'use client';

// useSpeechCapture — thin wrapper around the browser's Web Speech
// API (SpeechRecognition / webkitSpeechRecognition).
//
// Why the browser API and not a library: Chrome, Edge, and Safari
// ship it on both mobile and desktop. It needs no API key, no npm
// package, and no audio ever leaves the device — the browser does
// the transcription. A server-side STT would add cost, latency, a
// key, a storage bucket, and a privacy surface for no user-visible
// gain.
//
// Firefox doesn't ship it at all. Rather than show a dead button,
// `supported` is false and the caller hides the feature entirely.
//
// Lifecycle notes:
//   - `continuous = false`. iOS Safari's continuous mode is
//     unreliable and Safari self-terminates around 10s anyway.
//   - Interim results are surfaced live so the user can see it's
//     hearing them (and stop early if it's picking up noise).
//   - We auto-stop after 1.5s of silence, and hard-stop at 15s.

import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API types aren't in the default TS DOM lib yet.
// These are the minimum surface we actually use.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message?: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Milliseconds of silence before we commit the transcript. */
const SILENCE_TIMEOUT_MS = 1500;
/** Hard ceiling on one utterance — Safari stops us around 10s anyway. */
const MAX_DURATION_MS = 15000;

export type SpeechCaptureError =
  | 'not-allowed'
  | 'audio-capture'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'service-not-allowed'
  | 'unknown';

export interface SpeechCaptureState {
  /** False when the browser has no SpeechRecognition implementation. */
  supported: boolean;
  listening: boolean;
  /** Final + interim text heard so far in this utterance. */
  transcript: string;
  /** Only the not-yet-final part of the transcript. */
  interim: string;
  error: SpeechCaptureError | null;
}

export interface UseSpeechCapture extends SpeechCaptureState {
  /** Begin listening. Resolves false if the browser refused to start. */
  start: () => Promise<boolean>;
  /** Stop listening and return the final transcript. */
  stop: () => string;
  /** Clear transcript + error. */
  reset: () => void;
  /** Dismiss the current error without clearing the transcript. */
  clearError: () => void;
}

export function useSpeechCapture(lang = 'en-US'): UseSpeechCapture {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<SpeechCaptureError | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef('');
  const interimTextRef = useRef('');
  // Guards against a stale `onend` from a previous utterance
  // clobbering the state of a new one.
  const sessionRef = useRef(0);

  // Feature detection runs once on mount. SSR-safe.
  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    clearTimers();
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      rec.onspeechend = null;
      try {
        rec.abort();
      } catch {
        // abort() throws if the recognition is already stopped.
        // Nothing to do — we're tearing down anyway.
      }
    }
  }, [clearTimers]);

  // Stop listening if the component unmounts mid-utterance, so we
  // don't leave the mic hot or leak timers.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback((): string => {
    const rec = recognitionRef.current;
    const finalText = finalTextRef.current;
    // Bump the session so the recogniser's `onend` (which fires
    // asynchronously) knows it's stale.
    sessionRef.current += 1;
    clearTimers();
    if (rec) {
      try {
        rec.stop();
      } catch {
        // Already stopped. Fine.
      }
    }
    teardown();
    setListening(false);
    setInterim('');
    interimTextRef.current = '';
    return finalText;
  }, [clearTimers, teardown]);

  const reset = useCallback(() => {
    sessionRef.current += 1;
    clearTimers();
    teardown();
    finalTextRef.current = '';
    interimTextRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);
    setListening(false);
  }, [clearTimers, teardown]);

  const clearError = useCallback(() => setError(null), []);

  const start = useCallback(async (): Promise<boolean> => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setError('service-not-allowed');
      return false;
    }

    // Reset any previous utterance's state.
    clearTimers();
    teardown();
    finalTextRef.current = '';
    interimTextRef.current = '';
    setTranscript('');
    setInterim('');
    setError(null);

    const session = sessionRef.current + 1;
    sessionRef.current = session;

    let rec: SpeechRecognitionLike;
    try {
      rec = new Ctor();
    } catch {
      setError('unknown');
      return false;
    }

    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (sessionRef.current !== session) return;
      setListening(true);
    };

    rec.onresult = (event) => {
      if (sessionRef.current !== session) return;
      let interimChunk = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) {
        finalTextRef.current += finalChunk;
        setTranscript(finalTextRef.current);
      }
      if (interimChunk) {
        interimTextRef.current = interimChunk;
        setInterim(interimChunk);
        // The user is talking — reset the silence timer.
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stop();
        }, SILENCE_TIMEOUT_MS);
      }
    };

    rec.onspeechend = () => {
      if (sessionRef.current !== session) return;
      // Speech stopped — commit after a short pause in case the
      // recogniser is about to deliver a final result.
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stop();
      }, SILENCE_TIMEOUT_MS);
    };

    rec.onerror = (event) => {
      if (sessionRef.current !== session) return;
      const code = event.error as SpeechCaptureError;
      if (code === 'aborted') return; // We aborted it ourselves.
      setError(code);
    };

    rec.onend = () => {
      if (sessionRef.current !== session) return;
      // The browser ended the session on its own (Safari does this
      // around 10s). Commit whatever we heard.
      clearTimers();
      recognitionRef.current = null;
      setListening(false);
      setInterim('');
      interimTextRef.current = '';
    };

    recognitionRef.current = rec;

    // Hard cap — Safari stops us around 10s, but Chrome can run
    // long. One utterance per tap.
    maxTimerRef.current = setTimeout(() => {
      stop();
    }, MAX_DURATION_MS);

    try {
      rec.start();
    } catch {
      // start() throws if the recogniser is already running.
      setError('unknown');
      clearTimers();
      recognitionRef.current = null;
      setListening(false);
      return false;
    }

    return true;
  }, [clearTimers, lang, stop, teardown]);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    start,
    stop,
    reset,
    clearError,
  };
}

export default useSpeechCapture;
