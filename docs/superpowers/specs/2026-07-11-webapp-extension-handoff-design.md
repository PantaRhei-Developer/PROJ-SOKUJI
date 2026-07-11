# SOKUJI Allo Web App — Extension Handoff Pivot — Design

**Date**: 2026-07-11
**Status**: Approved for implementation planning
**Scope**: Reduce `webapp/` to exactly two screens (Login, Mode Select) and hand off to the existing Sokuji Chrome extension immediately after mode selection, instead of reimplementing the setup wizard / session / tutorial inside the web app.

## Context

The screens-only phase (`docs/superpowers/specs/2026-07-07-...-design.md`) and the "reuse Sokuji wholesale" direction from stakeholder discussion assumed the web app's Session screen could eventually run the real translation experience in a browser tab, either by importing `src/`'s code directly (monorepo) or by talking to a new backend.

Working through that, a hard technical constraint surfaced: **a plain website cannot inject a virtual microphone into other tabs/apps.** That capability (routing translated audio into Zoom/Google Meet/Microsoft Teams so the other side hears it) only exists today because the Chrome extension has host permissions and content scripts injected into those specific sites (`extension/content/virtual-microphone.js`). A website has no such privilege — this is a fundamental browser security boundary, not an implementation gap.

Given that, and the decision to drop Electron entirely from this product's distribution story, the only environment that can actually run a full Sokuji session (with virtual-mic injection) is the existing Chrome extension. So `webapp/`'s job is redefined: be the friendlier *front door* (login + one config choice), then get the user into the real extension as fast as possible. Everything the extension already does well (language/device setup, tutorial, the actual session) is left alone — the reason for this whole project was the *extension's* onboarding friction, and rebuilding a parallel copy of the extension's UI in a website would not fix that; it would just add a second, weaker copy of it.

## Non-Goals (this phase)

- Rebuilding language/device setup, tutorial, or the translation session inside `webapp/` — all deleted from this project's scope (see File Structure in the paired plan).
- Any Electron-targeted flow.
- Firestore persistence of the mode choice — it's selected fresh each time and handed to the extension; nothing is saved server-side in this phase.
- Automatic extension installation — if the extension isn't installed, the user is linked to the Chrome Web Store listing and must install manually.

## User-Visible Behavior

New, minimal flow: **Login → Mode Select → hand off to the extension.**

### Login (unchanged)
Same as `docs/spec/screens/Login.md` — Firebase Google Sign-In, protected routing via `RequireAuth`.

### Mode Select (behavior change)
Same visual design as `docs/spec/screens/ModeSelect.md` (two `ModeCard`s, no "Recommended" bias). The "次へ" button's action changes:

- If the Sokuji extension responds to a `chrome.runtime.sendMessage(extensionId, { type: 'sokuji-allo/set-mode', mode }, ...)` ping (i.e., it's installed and its manifest lists this webapp's origin under `externally_connectable`), the message is sent with the chosen mode, and — on a successful response — the page shows a short confirmation state ("拡張機能に設定を送りました。拡張機能を開いてください。" or similar) rather than navigating anywhere else in `webapp/` (there is nowhere left to navigate to; the extension itself opens its side panel independently once it receives the message, since `webapp/` cannot force-open a Chrome extension UI from a web page — messaging can only deliver data to it, not bring its UI to the foreground).
- If the extension does not respond (not installed, or messaging times out — `chrome.runtime.sendMessage` calls its callback with `undefined` and sets `chrome.runtime.lastError` when there's no receiving end), show a fallback: a link/button to the Chrome Web Store listing for Sokuji, plus a short explanation that the mode choice couldn't be delivered and will need to be re-selected inside the extension after installing.

### Removed screens

`SetupWizard` (all three steps), `Session`, and `Settings` are removed from `webapp/` — see the plan's File Structure for the exact deletions. The one thing `Settings` had that doesn't belong anywhere else is the logout action; see Open Questions.

## Architecture

- **Extension side (out of scope for this design doc, tracked as a dependency)**: the Sokuji extension's `manifest.json` needs an `externally_connectable` entry listing this webapp's origin(s) (production Firebase Hosting domain, and `http://localhost:5174` for local dev), and a `chrome.runtime.onMessageExternal` listener that accepts `{ type: 'sokuji-allo/set-mode', mode: 'local' | 'api' }` and applies it (e.g., writes to `settingsStore`) before opening/focusing its own UI. This is extension-repo work, not `webapp/` work, and is a prerequisite for the "automatic handoff" behavior to do anything — until it exists, every attempt falls through to the "not installed / no response" fallback path by design (indistinguishable from "not installed" from the webapp's point of view, which is acceptable for this phase).
- **`webapp/src/lib/extensionHandoff.ts`** (new): wraps the `chrome.runtme.sendMessage` call behind a Promise, with a timeout (e.g., 800ms) since `chrome.runtime.sendMessage` to a non-existent/non-listening extension ID does not always reject promptly. Exports `sendModeToExtension(mode): Promise<'delivered' | 'no-extension'>`.
- **`webapp/src/screens/ModeSelect/ModeSelect.tsx`**: replace the `navigate('/setup/language')` call with a call into `extensionHandoff`, and render one of three states (idle/selecting, delivered, fallback) instead of navigating.
- **`webapp/src/App.tsx`**: remove the `/setup/*`, `/session`, `/settings` routes.
- **`webapp/src/context/OnboardingContext.tsx`**: shrink to just `mode` (drop `spokenLanguage`/`targetLanguage`/`microphoneId`/`speakerId`/their setters) since nothing downstream in `webapp/` reads them anymore.
- Deleted: `webapp/src/screens/SetupWizard/*`, `webapp/src/screens/Session/*`, `webapp/src/screens/Settings/*`, and now-unused shared pieces only those screens used (`FormSelect`, `ConversationRow`, `StepIndicator` — confirmed unused elsewhere before deleting).

## Open Questions

- **Where does logout live now?** With `Settings` gone, there's no in-app place for it. Options: a small "ログアウト" link in the corner of the Mode Select screen itself, or accept that this phase has no visible logout (Firebase session just persists; a manual `signOut` isn't reachable from the UI). Needs a decision before implementation removes `Settings`.
- **Extension ID for messaging**: `chrome.runtime.sendMessage(extensionId, ...)` needs the extension's ID, which differs between the Chrome Web Store build and any unpacked/dev build. This needs to come from an env var (`VITE_SOKUJI_EXTENSION_ID`) so it isn't hardcoded per-environment.
