# Sokuji Wrapper Web App — Implementation Plan (Screens-Only Phase)

**Goal:** Stand up the `webapp/` project and implement the 5-screen, no-backend UI shell described in `docs/superpowers/specs/2026-07-07-sokuji-wrapper-webapp-design.md`, then deploy it to Firebase Hosting today (2026-07-07) so stakeholders can review the flow via URL.

**Architecture:** Independent Vite + React + TypeScript project at `webapp/`, with client-side routing over `/login`, `/mode-select`, `/setup/language`, `/setup/audio`, `/setup/confirm`, `/session`, `/settings`. All screens render static/dummy data — no network calls, no Firebase Auth/Firestore wiring yet.

**Tech Stack:** React, TypeScript, Vite, SCSS, React Router, lucide-react icons.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `webapp/package.json`, `webapp/vite.config.ts`, `webapp/tsconfig.json` | New independent project scaffold. |
| `webapp/src/main.tsx`, `webapp/src/App.tsx` | App entry point and router setup for the 7 routes. |
| `webapp/src/screens/Login/Login.tsx` + `.scss` | Implements `docs/spec/screens/Login.md`. |
| `webapp/src/screens/ModeSelect/ModeSelect.tsx` + `.scss` | Implements `docs/spec/screens/ModeSelect.md`. |
| `webapp/src/screens/SetupWizard/LanguageStep.tsx`, `DevicesStep.tsx`, `ConfirmStep.tsx` + shared `.scss` | Implements the three steps in `docs/spec/screens/SetupWizard.md`. |
| `webapp/src/screens/Session/Session.tsx` + `.scss` | Implements `docs/spec/screens/Session.md`. |
| `webapp/src/screens/Settings/Settings.tsx` + `.scss` | Implements `docs/spec/screens/Settings.md`. |
| `webapp/src/components/ModeCard/ModeCard.tsx` + `.scss` | Implements `docs/spec/components/ModeCard.md`. |
| `webapp/src/components/StepIndicator/StepIndicator.tsx` + `.scss` | Implements `docs/spec/components/StepIndicator.md`. |
| `webapp/src/context/OnboardingContext.tsx` | Shared in-memory state for mode/languages/devices across the wizard + Settings. |
| `webapp/src/styles/tokens.scss`, `webapp/src/styles/global.scss` | SCSS variables generated from `docs/spec/themes/wrapper-webapp-tokens.md`, plus base reset/background. |
| `webapp/firebase.json`, `webapp/.firebaserc` | Firebase Hosting config targeting `pantarhei-int-sandbox-prd`. |
| `webapp/src/components/common/PrimaryButton.tsx`, `BackLink.tsx`, `FormSelect.tsx`, `Tooltip.tsx` (+ `.scss` each) | Shared low-level components not called out individually in the spec, factored out to avoid duplicating the same button/select/back-link markup across 5 screens. |
| `webapp/src/components/ConversationRow/ConversationRow.tsx` + `.scss` | Visual-only replica of `src/components/MainPanel/ConversationRow.tsx` for the Session screen's two dummy rows — see Reused section below for why this isn't a literal import. |
| `webapp/src/data/languages.ts` | Mirrors `simplifiedLanguages`/`fullLanguages` from `src/components/Settings/sections/LanguageSection.tsx`. |
| `webapp/index.html`, `webapp/src/vite-env.d.ts`, `webapp/tsconfig.node.json`, `webapp/.gitignore` | Standard Vite/TS project scaffolding files. |

### Modified

| File | Change |
|---|---|
| `docs/structure.md` | Added the new top-level `webapp/` entry. |

### Reused without modification

| File | Why |
|---|---|
| `src/assets/logo.png` | Copied byte-for-byte into `webapp/src/assets/logo.png` (Login and Session screens). |

### Decided at implementation time (per the "TBD" note above)

Both the existing app's `Tooltip` (`src/components/Tooltip`) and `ConversationRow` (`src/components/MainPanel/ConversationRow`) turned out to be too coupled to app-only dependencies (`@floating-ui/react` usage was fine and got reused as a library, but `ConversationRow` pulls in `react-i18next` and the `ConversationItem`/session-store types) to import across the two independent projects in this phase. Both were re-implemented locally in `webapp/` as presentational-only components matching the same visual output (same CSS class names/values for `ConversationRow`), rather than sharing code. A real shared package is deferred until there's a second consumer that justifies the extraction.

---

## Steps

- [x] Scaffold `webapp/` (Vite + React + TS), add React Router and lucide-react.
- [x] Add `webapp/src/styles/tokens.scss` from the design-tokens spec.
- [x] Build `StepIndicator` and `ModeCard` components per their specs.
- [x] Build `Login`, `ModeSelect`, the three `SetupWizard` steps, `Session`, and `Settings` screens, wiring navigation exactly as specified.
- [x] Add `OnboardingContext` and thread it through ModeSelect → SetupWizard → Settings.
- [x] Manually click through the full flow in a browser against every route (Playwright + Chromium, since no interactive browser is available in this environment; screenshots confirmed each screen and zero console errors).
- [ ] Deploy to Firebase Hosting; confirm the live URL matches the spec screen-by-screen. **Deferred** — `npm run build` succeeds and `firebase.json`/`.firebaserc` are in place, but the actual `firebase deploy` was intentionally left for the user to run (or explicitly request), since it publishes to a shared project.
- [x] Update `docs/structure.md` to reflect the new top-level `webapp/` directory.
