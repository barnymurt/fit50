# Speak your food into the tracker

**Status:** Approved — implemented
**Branch:** `food-talker`
**Feature area:** Food tracker → Add custom food

---

## User story

**As a** person logging food on their phone, mid-meal, with messy hands
**I want** to tap a mic button and say "greek yogurt, one hundred and twenty calories, fifteen grams protein, twenty carbs, two fat" and have the macros fill in for me
**So that** I can log what I just ate without squinting at a nutrition label, typing five numbers one-handed, or photographing a wrapper I already threw away.

---

## Context

The "Add custom food" modal currently offers two paths:

- **Scan the label** (`PhotoFoodScan` → `POST /api/foods/custom/photo`) — photograph a physical nutrition panel. Requires a camera, good light, and a label that's still in front of you.
- **Or describe it** (textarea → `POST /api/foods/custom/extract`) — type a description, the LLM fills the macros.

Neither fits the common case: the user has the macros in their head (or read them off a screen or menu), not on a wrapper in front of them. Voice bridges that gap.

**Voice is the primary path. Photo scanning stays as a secondary option** — for a physical label in front of you, a photo is still better than talking. Both remain available.

---

## Acceptance criteria

### Voice capture

- **Given** a signed-in user with an LLM key on file **when** they open "Add custom food" **then** a mic button is visible at the top of the modal, above the photo scanner.
- **Given** the user taps the mic button **when** the browser grants microphone permission **then** the button enters a visible "listening" state and interim speech appears in the transcript area as they speak.
- **Given** the user speaks a food name and macro values **when** they stop speaking **then** the transcript is written into the existing "Or describe it" textarea, with spoken number words converted to digits (e.g. "one hundred and twenty" → "120", "two point five" → "2.5").
- **Given** a transcript is present **when** the user clicks "Auto-fill macros" **then** the existing `/api/foods/custom/extract` endpoint is called and the form fields (name, brand, category, kcal, protein, carbs, fat, fiber, standard serving) are pre-filled exactly as the typed path does today.
- **Given** the user speaks **when** recognition auto-stops on a 1.5s silence **or** reaches a 15s hard cap **then** the transcript is committed to the textarea and the button returns to idle.
- **Given** the user taps the mic button a second time **when** recognition is running **then** it stops immediately and commits whatever was heard.
- **Given** the transcript is in the textarea **when** the user edits it by hand **then** the edited text — not the raw transcript — is what gets sent to the LLM.
- **Given** the voice path succeeds **when** the food is saved **then** `source` is `'llm'` and the raw transcript is persisted in the `description` column, capped at 4096 characters.

### Failure handling

- **Given** the user denies microphone permission **when** the error fires **then** a clear message appears: "Microphone blocked — allow it in your browser settings, or just type it." The textarea remains fully usable.
- **Given** the browser has no microphone attached **when** the error fires **then** a clear message appears: "No microphone found."
- **Given** no speech was detected **when** the error fires **then** a clear message appears: "Didn't catch that — try again."
- **Given** a browser without SpeechRecognition support (Firefox) **when** the modal opens **then** the mic button is **not rendered at all**, the typed textarea is unaffected, and no error is shown. The feature is absent, not broken.
- **Given** a user with no LLM key **when** the modal opens **then** the mic button is disabled with the reason "Add your AI key below to unlock voice capture" — the same gate the photo scanner and typed path already use.

### Photo scanning (unchanged)

- **Given** the photo scanner **when** it is rendered **then** it behaves exactly as it does today. Voice does not regress, remove, or reorder its internals.
- **Given** a vision-direct photo scan with no OCR text **when** the food is saved **then** `source` is `'llm'` — this fixes an existing bug where vision-direct scans were recorded as `'manual'`.

### Non-goals for this slice

- Voice must not be a *premium-gated* feature. It is a sibling of the existing photo scan, which is not gated. If the project later decides voice is premium, that is a separate story.

---

## UX / UI risks

| Risk | Mitigation |
|---|---|
| **Speech recognition transcribes words, not numbers.** "twenty five" → `"twenty five"`, not `25`. Dumping that into the LLM yields fuzzy guesses. | A deterministic client-side number normaliser converts spoken number words to digits *before* the LLM sees the text. Pure function, unit-testable. |
| **Firefox has no SpeechRecognition.** | Feature-detect at mount. Hide the mic entirely rather than showing a dead button. The typed path remains the fallback for everyone. |
| **Safari quirks.** `continuous` mode is unreliable on iOS; recognition self-terminates around 10s; installed-PWA Safari blocks the API entirely. | Use `continuous = false` with interim results. 15s hard cap. Silence auto-stop at 1.5s. PWA failure surfaces as the "unsupported" path. |
| **Mic permission denied or no mic.** | Distinct error copy per `SpeechRecognition` error code. Never a silent failure. |
| **Noisy environment** (café, gym). | Interim transcript visible in `ink/50` so the user can see it's hearing garbage and stop early. Errors are non-blocking. |
| **Macros spoken in a different order / partially.** | The LLM handles arbitrary phrasing once numbers are normalised. Missing macros stay blank in the form for the user to fill. |
| **Long transcript.** | Transcript is trimmed to the same 1000-char cap the extract endpoint enforces, from the start (macros usually come last in a spoken sentence). |
| **Two action colours in one view.** | The design system allows coral for exactly one thing per view. The mic button and "Auto-fill macros" are both coral — but they are the *same* action ("capture this food"), and the modal's coral is already committed to that intent. Mic button uses an outline coral treatment; the "Auto-fill macros" button stays the style it is today. No new colour is introduced. |
| **Design-system drift.** | Mic button is a square (0px radius) with a 1px ink rule and coral border — matches the "Or describe it" panel treatment. Not a new shape, not a new size. Panel ground is `bg-cream/30` + `border-ink/15`, identical to the existing describe panel. No shadow. Fraunces is not used for the transcript — `font-body` throughout. |
| **Reduced motion.** | The listening pulse animates at 200ms and must collapse to 0.01ms under `prefers-reduced-motion`, per the system rules. The listening state is also conveyed by colour and a text label, never by motion alone. |
| **Accessibility.** | The mic button carries an `aria-label` that changes with state ("Start voice capture" / "Stop voice capture"). Live transcript is `aria-live="polite"`. Status is never conveyed by colour alone — the button label and a visible caption both change. |
| **Privacy.** | Audio never leaves the browser. Transcription happens via the browser's own Web Speech API. Only the resulting *text* is sent to the user's own LLM, via the existing endpoint they already opt into. No audio upload, no new storage bucket, no new table. |

---

## Out of scope

- **Recording / uploading audio to a server-side speech-to-text API.** The browser's Web Speech API is free, instant, and needs no key. A server STT path would add cost, latency, an API key, a storage bucket, and a privacy surface for no user-visible gain in the target browsers.
- **A new `/api/foods/custom/voice` route or a new voice-specific system prompt.** The existing `/api/foods/custom/extract` endpoint handles the transcript once the numbers are normalised.
- **A new Supabase migration.** `description` and `source` already exist and cover voice provenance.
- **Continuous / always-listening mode.** Single utterance per tap, with a hard cap.
- **Multi-language macro vocabulary.** The number normaliser handles English number words only. Speech *recognition* is browser-provided and already handles the user's locale.
- **Streaming partial extraction** (form fields filling in live while speaking). The form fills once, after the transcript is committed.
- **Removing or deprecating the photo scanner.**
- **Gating voice behind premium.**

---

## Test plan

### Unit — pure functions

`src/lib/speech/numbers.ts`
- "twenty five" → "25"; "one hundred and twenty" → "120"; "twelve point five" → "12.5"; "zero" → "0"
- "twenty-five" → "25" (hyphen + space variants)
- Non-numeric text is left untouched: "greek yogurt" → "greek yogurt"
- Mixed: "greek yogurt 120 calories 15 protein" → "greek yogurt 120 calories 15 protein"
- Idempotence: normalising twice equals normalising once
- "one" inside a word is not replaced: "someone" → "someone"

`src/lib/speech/macros.ts`
- "calories" → "kcal"; "carbs" → "carbohydrate"; "fibre" → "fiber"; "grams" → "g"
- "per hundred grams" → "per 100 g"
- Unknown terms pass through unchanged

### Unit — hook

`src/hooks/useSpeechCapture.ts`
- `supported` is `false` when neither `SpeechRecognition` nor `webkitSpeechRecognition` exists
- `start()` transitions `listening` true; `stop()` commits the final transcript and returns it to `false`
- `error` maps `not-allowed` → permission message, `audio-capture` → no-microphone message, `no-speech` → didn't-catch message
- 15s hard cap stops recognition
- Unmounting mid-listening stops recognition and clears timers (no leaked listeners)

### Integration — modal

`src/components/food-database/AddCustomFoodModal.tsx`
- Mic renders when a key is on file; is absent when the browser lacks support
- Voice transcript lands in the textarea, and the textarea remains editable
- "Auto-fill macros" after a voice capture calls `/api/foods/custom/extract` with the *edited* textarea value
- Saving after a voice capture persists `source: 'llm'` and `description: <transcript>`
- The photo scanner still works end-to-end after the change
- No-key state disables the mic with the correct reason

### Manual

- Chrome desktop: speak a food + macros, confirm digits land correctly in the form
- iOS Safari: tap mic, speak, confirm auto-stop at silence and the 10–15s cap
- Firefox: confirm no mic button renders and the typed path is unaffected
- Deny mic permission: confirm the error copy and that typing still works
- Voice + photo in the same modal session: confirm both populate the form correctly

### Visual

- Mic button idle vs listening: square, coral outline, 1px rule, no shadow
- Listening pulse collapses under `prefers-reduced-motion`
- Transcript panel matches the "Or describe it" panel treatment exactly
- Modal at 375px and 1440px: no overflow, no clipped controls

---

## Implementation notes

**New files**

| File | Purpose |
|---|---|
| `src/lib/speech/numbers.ts` | Spoken number words → digits. Pure. |
| `src/lib/speech/macros.ts` | Spoken macro vocabulary → label phrasing. Pure. |
| `src/hooks/useSpeechCapture.ts` | Web Speech API wrapper. Feature detection, lifecycle, errors, caps. |
| `src/components/food-database/VoiceFoodCapture.tsx` | Mic button + live transcript + error states. |

**Edited files**

| File | Change |
|---|---|
| `src/components/food-database/AddCustomFoodModal.tsx` | Render `<VoiceFoodCapture>` above `<PhotoFoodScan>`. Share `extractDescription` state so there is one "Auto-fill macros" button. Track `voiceTranscript` for provenance. Fix `source` for vision-direct photo scans. |
| `src/app/account/page.tsx` | Update the marketing copy that says "photo a label" to mention speaking. |

**Not changed:** `src/app/api/foods/custom/extract/route.ts`, `src/lib/llm/*`, `package.json` (no new dependencies), any Supabase migration.
