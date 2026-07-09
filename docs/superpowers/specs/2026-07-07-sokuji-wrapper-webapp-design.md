# Sokuji Wrapper Web App — Design

**Date**: 2026-07-07
**Status**: Approved for implementation planning (screens-only phase)
**Scope**: A new, independent web application (`webapp/`) that wraps the existing Sokuji translation experience behind a simplified, login-gated onboarding flow. This document covers only the UI shell being deployed to Firebase Hosting today; see Non-Goals.

## Context

User research on the existing Sokuji Chrome extension surfaced two recurring pain points:

- **Setup friction**: unclear guidance on virtual microphone setup, the need to either obtain an API key or download a local model, and no guided tutorial that ends in a ready-to-use session. Installing on Apple Silicon also involves a `sudo` step, which makes some users hesitant.
- **Performance/UX trade-off**: online (API) models are slower and only marginally more accurate than local models; local models are fast but require a ~4GB download, need clear speech to transcribe well, don't distinguish speakers, and still show a translation lag after the speaker finishes talking.

The intended remedy is a wrapper application that removes decision paralysis by collapsing configuration to a single mode choice (local model vs. API), guides the user through a short mandatory setup wizard that ends with the session already running, and requires login (enabling future usage-based billing). This is a browser web app only — not a native mobile app.

## Non-Goals (this phase)

- Firebase Auth / Firestore real integration (the login button is a no-op navigation).
- Local model download or any ASR/MT execution.
- API-key collection or real provider calls.
- Usage-based billing / invoicing logic.
- Persisting onboarding selections beyond in-memory React state.
- Data sync with the existing Sokuji extension.

Everything above is deferred to a later phase once this UI shell is validated with stakeholders.

## User-Visible Behavior

Flow: Login → Mode Select → Setup Wizard (Language → Devices → Confirm) → Session → Settings.

Full per-screen layout, copy, and component specs live under `docs/spec/` (the current-state source of truth for UI):

- [screens/Login.md](../../spec/screens/Login.md)
- [screens/ModeSelect.md](../../spec/screens/ModeSelect.md)
- [screens/SetupWizard.md](../../spec/screens/SetupWizard.md)
- [screens/Session.md](../../spec/screens/Session.md)
- [screens/Settings.md](../../spec/screens/Settings.md)
- [components/ModeCard.md](../../spec/components/ModeCard.md), [components/StepIndicator.md](../../spec/components/StepIndicator.md)
- [themes/wrapper-webapp-tokens.md](../../spec/themes/wrapper-webapp-tokens.md)

This design doc intentionally does not restate that detail — it records why the flow is shaped this way and what is explicitly out of scope, per the `docs/superpowers/` change-history convention.

## Architecture

- New, fully independent project at `webapp/` (own `package.json`, own build) — not part of the existing `src/` extension/Electron codebase, since it targets different hosting (Firebase Hosting vs. Chrome Web Store/Electron installers) and different auth (Firebase Auth vs. Better Auth).
- Stack: React + TypeScript + Vite + SCSS, matching the existing codebase's conventions to ease future component/knowledge reuse, with a lightweight client-side router (e.g. React Router) covering the 5 screens / 3 wizard steps above.
- Onboarding selections (mode, languages, devices) are held in a single React context scoped to the `/mode-select` + `/setup/*` + `/settings` route tree — no global state library is needed at this phase.
- Deploy target: Firebase project `pantarhei-int-sandbox-prd`, `firebase deploy --only hosting`.

## Resolved during implementation (2026-07-07)

- **Product name**: "SOKUJI Allo" (replaces the placeholder "Sokuji" branding used in the first draft of this doc and its paired spec files).
- **UI language**: all on-screen copy is Japanese (not English), matching the target audience for this webapp. `docs/spec/` documents describe the screens in English prose but quote the actual Japanese strings shown to users, consistent with how language names elsewhere in the spec (e.g. "日本語") are already quoted verbatim.

## Open Questions

- Whether Settings' "変更" links should, in a later phase, re-run only the changed step or the full wizard.
- Billing timing/model for API usage mode (deferred; not resolved in this phase).
