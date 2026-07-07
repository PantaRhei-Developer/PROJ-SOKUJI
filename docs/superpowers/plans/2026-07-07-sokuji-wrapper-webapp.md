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
| `webapp/src/styles/tokens.scss` | SCSS variables generated from `docs/spec/themes/wrapper-webapp-tokens.md`. |
| `webapp/firebase.json`, `webapp/.firebaserc` | Firebase Hosting config targeting `pantarhei-int-sandbox-prd`. |

### Modified

| File | Change |
|---|---|
| none | This phase does not touch the existing `src/`, `extension/`, or `electron/` trees. |

### Reused without modification

| File | Why |
|---|---|
| Existing Tooltip component (from `src/components/`) | `docs/spec/screens/SetupWizard.md` step 2 reuses the existing app's Tooltip for the virtual-mic hint; exact reuse mechanism (copy vs. shared package) to be decided at implementation time. |

---

## Steps

- [ ] Scaffold `webapp/` (Vite + React + TS), add React Router and lucide-react.
- [ ] Add `webapp/src/styles/tokens.scss` from the design-tokens spec.
- [ ] Build `StepIndicator` and `ModeCard` components per their specs.
- [ ] Build `Login`, `ModeSelect`, the three `SetupWizard` steps, `Session`, and `Settings` screens, wiring navigation exactly as specified.
- [ ] Add `OnboardingContext` and thread it through ModeSelect → SetupWizard → Settings.
- [ ] Manually click through the full flow in a browser against every route.
- [ ] Add Firebase Hosting config and deploy; confirm the live URL matches the spec screen-by-screen.
- [ ] Update `docs/structure.md` if the new top-level `webapp/` directory should be reflected there.
