# SOKUJI Allo Web App — Extension Handoff Pivot — Implementation Plan

**Goal:** Shrink `webapp/` down to Login + Mode Select, wire the Mode Select screen to hand its choice off to the Sokuji Chrome extension (with a Chrome Web Store fallback when the extension isn't reachable), add a small logout link to Mode Select, and delete the now-superseded SetupWizard/Session/Settings screens, per `docs/superpowers/specs/2026-07-11-webapp-extension-handoff-design.md`.

**Architecture:** `webapp/src/lib/extensionHandoff.ts` wraps `chrome.runtime.sendMessage` with a timeout-based Promise. `ModeSelect.tsx` calls it instead of navigating to a wizard route, and renders idle/delivered/fallback states. `OnboardingContext` shrinks to just `mode`.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `webapp/src/lib/extensionHandoff.ts` | `sendModeToExtension(mode)` — Promise-wrapped `chrome.runtime.sendMessage` with timeout; resolves `'delivered'` or `'no-extension'`. |
| `webapp/.env.example` | Documents `VITE_SOKUJI_EXTENSION_ID` (not committed with a real value; each environment sets its own). |

### Modified

| File | Change |
|---|---|
| `webapp/src/screens/ModeSelect/ModeSelect.tsx` | "次へ" button calls `sendModeToExtension`; renders idle / "delivered" confirmation / Chrome Web Store fallback state instead of navigating to `/setup/language`. Adds a small "ログアウト" link (calls `signOut(auth)` then navigates to `/login`). |
| `webapp/src/screens/ModeSelect/ModeSelect.scss` | Styles for the confirmation/fallback states and the logout link. |
| `webapp/src/App.tsx` | Remove `/setup/language`, `/setup/audio`, `/setup/confirm`, `/session`, `/settings` routes and their imports. |
| `webapp/src/context/OnboardingContext.tsx` | Drop `spokenLanguage`, `targetLanguage`, `microphoneId`, `microphoneLabel`, `speakerId`, `speakerLabel` and their setters — keep only `mode`/`setMode`. |
| `docs/spec/screens/ModeSelect.md` | Update Navigation section: "次へ" now triggers the extension handoff, not a route change. |
| `docs/spec/screens/Login.md` | No content change expected, but re-check cross-references to removed screens. |
| `docs/structure.md` | Update the `webapp/src/screens/` listing to drop the removed screen names. |

### Deleted

| File | Why |
|---|---|
| `webapp/src/screens/SetupWizard/` (all files) | Language/device setup is the extension's job now. |
| `webapp/src/screens/Session/` (all files) | The actual session only ever runs in the extension; a browser tab can't do virtual-mic injection (see design doc Context). |
| `webapp/src/screens/Settings/` (all files) | Its only still-needed piece (logout) moves onto Mode Select. |
| `webapp/src/components/ConversationRow/` | Only used by the deleted Session screen. |
| `webapp/src/components/StepIndicator/` | Only used by the deleted SetupWizard. |
| `webapp/src/components/common/FormSelect.tsx`/`.scss` | Only used by the deleted SetupWizard language/device steps. |
| `webapp/src/components/common/Tooltip.tsx`/`.scss` | Only used by the deleted SetupWizard's virtual-mic hint. |
| `webapp/src/data/languages.ts` | Only used by the deleted SetupWizard/Settings language display. |
| `webapp/src/utils/modeLabel.ts` | Only used by the deleted SetupWizard/Settings; `ModeSelect` doesn't need a mode→label helper (it shows the cards directly, not a summary string) — confirm during implementation and keep it only if actually still referenced. |
| `docs/spec/screens/SetupWizard.md`, `Session.md`, `Settings.md` | Superseded; `docs/spec/` reflects current state only, so these are removed rather than kept as dead documentation (the *why* is preserved in `docs/superpowers/specs/2026-07-11-webapp-extension-handoff-design.md`, which is never deleted). |
| `docs/spec/components/StepIndicator.md` | Same reasoning — component deleted, spec removed. |

### Reused without modification

| File | Why |
|---|---|
| `webapp/src/screens/Login/*`, `webapp/src/context/AuthContext.tsx`, `webapp/src/components/common/RequireAuth.*`, `webapp/src/lib/firebase.ts` | Login and auth gating are unaffected by this pivot. |
| `webapp/src/components/ModeCard/*` | Still used by Mode Select as-is. |
| `webapp/src/components/common/PrimaryButton.*`, `BackLink.tsx`/`.scss` | `PrimaryButton` still used by Mode Select's "次へ"; `BackLink` still used for "← 戻る" to Login. |

---

## Steps

- [x] Create `extensionHandoff.ts` with the timeout-wrapped `sendModeToExtension`.
- [x] Add `VITE_SOKUJI_EXTENSION_ID` handling (`.env.example` + read via `import.meta.env`).
- [x] Update `ModeSelect.tsx`/`.scss`: new button behavior, idle/delivered/fallback states.
  - **Scope note**: this branch (`feat/webapp-tutorial`) was branched from `dev` *before* Firebase Auth was merged in from `feat/webapp-backend` (commits `5c20b00b`, `3a7a0fff`). There is no `AuthContext`/`useAuth`/`lib/firebase.ts` here, so the logout link planned in the design doc's Open Questions was **not** added in this pass — deliberately deferred until the two branches converge. Re-add it (Mode Select, small link, per the design doc's resolved Open Question — "モード選択画面の隣やフッターに小さく置く") once auth lands on this branch.
- [x] Trim `OnboardingContext.tsx` to just `mode`.
- [x] Remove the now-dead routes from `App.tsx`.
- [x] Delete `SetupWizard/`, `Session/`, `Settings/` screen directories and the components/utilities only they used (confirmed via grep that `FormSelect`, `Tooltip`, `StepIndicator`, `ConversationRow`, `data/languages.ts`, `utils/modeLabel.ts` were each only referenced from the deleted screens before deleting them).
- [x] Update `docs/spec/screens/ModeSelect.md`; delete `docs/spec/screens/SetupWizard.md`, `Session.md`, `Settings.md`, `docs/spec/components/StepIndicator.md`.
- [x] Update `docs/structure.md`.
- [x] Typecheck (`npm run typecheck`, clean) and manually click through via Playwright: login → mode select → select a card → "次へ" → confirmed the fallback state renders (no extension installed in this dev environment) with a working Chrome Web Store link, no console errors. The "delivered" success state and the real extension-side listener are unverified — that requires the actual extension's `externally_connectable`/`onMessageExternal` wiring, which is out of scope for this plan (see design doc's Architecture section).
