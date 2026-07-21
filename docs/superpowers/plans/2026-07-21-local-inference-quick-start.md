# Local Inference Quick Start — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-21-local-inference-quick-start-design.md`

**Goal**: One button to download everything a language pair needs for Local Inference, replacing the current three-separate-jargon-links flow.

**Architecture summary**: A new store resolver (`getMissingModelsForLanguagePair`) picks recommended-but-not-yet-downloaded models per type; a new component (`LocalInferenceQuickStart`) downloads them sequentially with combined progress and persists the selection via existing `autoSelectModels`/`updateLocalInference`; `ProviderSection.tsx` swaps in the new component in place of the old blocking warning.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `src/components/Settings/sections/LocalInferenceQuickStart.tsx` | The one-button download-everything UI + combined progress. |
| `docs/superpowers/specs/2026-07-21-local-inference-quick-start-design.md` | This change's design doc. |
| `docs/superpowers/plans/2026-07-21-local-inference-quick-start.md` | This file. |

### Modified

| File | Change |
|---|---|
| `src/stores/modelStore.ts` | Add `getMissingModelsForLanguagePair()` + `useGetMissingModelsForLanguagePair()` selector. |
| `src/stores/modelStore.test.ts` | Tests for the new resolver (nothing downloaded / everything ready / no compatible model). |
| `src/components/Settings/sections/ProviderSection.tsx` | Render `<LocalInferenceQuickStart>` instead of the old `Trans`-based warning for `Provider.LOCAL_INFERENCE`; removed the now-unused `Trans` import. |

### Reused without modification

| File | Why |
|---|---|
| `src/stores/modelStore.ts`'s `downloadModel`, `autoSelectModels`, `isProviderReady`, `pickBestModel` (via `modelManifest.ts`) | All the actual download/readiness/ranking logic already existed — this feature is UI composition over existing primitives, not new store internals beyond the one resolver above. |
| `src/components/MainPanel/MainPanel.tsx`'s Start button / `canStartSession` | Unchanged — becomes enabled once `isProviderReady` flips true, same as before; no auto-start wired (see design doc's Non-Goals). |

---

## Steps

- [x] Add `getMissingModelsForLanguagePair()` to `modelStore.ts` + selector hook.
- [x] Add tests for the three cases (needs downloads / already ready / no compatible model).
- [x] Build `LocalInferenceQuickStart.tsx` (message, button, combined progress, post-download selection persistence, exotic-language-pair fallback).
- [x] Wire it into `ProviderSection.tsx`, removing the old warning block and unused `Trans` import.
- [x] Typecheck (`npx tsc --noEmit`) — clean.
- [x] Run test suite — all passing except two pre-existing, unrelated `localStorage` environment failures (confirmed via before/after comparison).
- [ ] Manual click-through in a real browser: select Local Inference with no models downloaded, click the new button, confirm combined progress renders sensibly and Start enables once done. Not yet done — needs an actual browser session, which this environment doesn't have.
