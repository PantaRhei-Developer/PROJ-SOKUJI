# Local Inference Quick Start — Design

**Date**: 2026-07-21
**Status**: Approved for implementation planning
**Scope**: Replace the current "download ASR / download Translation / download TTS" three-separate-links onboarding for the Local Inference (Free) provider with a single "download and get started" button.

## Context

Landing on Local Inference with no models downloaded currently shows two overlapping warnings (a per-type one in Language settings, a blocking one in Provider settings), both using jargon (ASR/MT/TTS abbreviations) and requiring the user to click three separate download links one at a time before Start becomes available. Surfaced via a live screenshot during this session — confirmed confusing for a first-time user, and directly undermines SOKUJI Allo's "無料・高速" pitch for this mode.

## Non-Goals (this phase)

- **Auto-starting the session once downloads finish.** Requires deep coupling with `MainPanel.tsx`'s session-lifecycle state machine (`isInitializing`, device checks, `connectConversation`). Scoped out — the existing "セッション開始" button simply becomes enabled once ready, same as it already does when a user manually finishes downloading each model today.
- **Rewriting the detailed per-type model picker** (`ModelManagementSection.tsx`). Still reachable via "settingsLink" for the rare case where no compatible model exists for a language pair at all.
- **New locale strings in the translation JSON files.** Uses inline i18next fallback text (`t('key', 'English fallback')`), matching the existing pattern for other recently-added strings in this codebase (e.g. `providers.kizunaai_openai_translate.name`) — real localization is a follow-up.

## User-Visible Behavior

When Local Inference is selected and not yet ready for the current language pair, the Provider settings panel shows one message ("this language pair needs a one-time download, ~N MB") and one button. Clicking it downloads whatever's actually missing (skipping anything already downloaded or cloud-based, e.g. Edge TTS needs no download) with a single combined progress percentage, then leaves the existing Start button to be clicked once ready. If no compatible model exists at all for the language pair (exotic combination), the button doesn't appear — instead falls back to today's detailed per-type view.

## Architecture

- **`src/stores/modelStore.ts`**: new `getMissingModelsForLanguagePair(sourceLang, targetLang)` — resolves which of ASR/translation/TTS still need downloading, picking the recommended (`pickBestModel`) candidate for each missing type. Distinct from the existing `autoSelectModels`, which only re-validates a selection among *already-downloaded* models — this instead answers "what should I download in the first place." Returns a `noCompatibleModel` flag for the exotic-language-pair fallback case.
- **`src/components/Settings/sections/LocalInferenceQuickStart.tsx`** (new): renders the message + button, sequentially calls the existing `downloadModel(id)` for each missing entry, aggregates progress from the existing per-model `downloads` state, and — once all downloads succeed — calls `autoSelectModels` + `updateLocalInference` to persist the newly-downloaded models as this pair's selection (reusing the exact correction pattern `SettingsInitializer` already uses on language change, rather than leaving the selection implicitly empty and relying on `isProviderReady`'s "any downloaded model" fallback).
- **`src/components/Settings/sections/ProviderSection.tsx`**: replaces the old `Trans`-based blocking warning (only for `Provider.LOCAL_INFERENCE`) with `<LocalInferenceQuickStart>`; other providers' validation message display is unchanged.
