# Sokuji Extension — Handoff Listener for SOKUJI Allo — Design

**Date**: 2026-07-17
**Status**: Approved for implementation planning
**Scope**: The extension-side counterpart of `webapp/src/lib/extensionHandoff.ts`'s `sendModeToExtension()` — accept the `{ type: 'sokuji-allo/set-mode', mode }` message from the SOKUJI Allo webapp and act on it. This was explicitly flagged as an out-of-scope dependency in `docs/superpowers/specs/2026-07-11-webapp-extension-handoff-design.md`; this doc is that dependency.

## Context

The webapp's Mode Select screen already calls `chrome.runtime.sendMessage(extensionId, { type: 'sokuji-allo/set-mode', mode: 'local' | 'api' }, callback)` and, until now, nothing on the extension side listens for it — every attempt falls through to the webapp's "extension not found" fallback by design. This doc adds the missing listener so a real handoff can succeed.

## Non-Goals (this phase)

- **Wiring `mode: 'api'` to a working provider.** That requires `Provider.PANTARHEI_GEMINI` and the `relay-backend/` service from `docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md`, neither of which exist yet. For now, receiving `mode: 'api'` opens the extension's side panel but does not change the selected provider (see User-Visible Behavior).
- **Changing content scripts or virtual-mic injection.** Untouched by this change.
- **Automatic extension installation.** Unchanged from the 2026-07-11 doc's decision — the webapp's fallback link to the Chrome Web Store listing is the only installation path.
- **Any change to who publishes/hosts the extension.** Purely an in-repo code change to this fork; distribution/publishing is a separate, already-raised question.

## User-Visible Behavior

When the webapp successfully delivers a `sokuji-allo/set-mode` message:

- **`mode: 'local'`** — the extension sets its provider to Local Inference (the same setting the in-app Settings UI already controls) and opens its side panel. The user lands in a working, already-configured translation session with no further setup.
- **`mode: 'api'`** — the extension opens its side panel, but does not change the currently-selected provider (there is no working "no API key" API provider to switch to yet — see Non-Goals). The user sees whatever the extension's provider was already set to.
- **Any other message** (wrong `type`, missing/invalid `mode`, or a message from an origin not listed in `externally_connectable`) is ignored — Chrome itself blocks origins not in the allowlist before the listener ever runs; malformed-but-allowed messages get no response, which is indistinguishable from "not installed" on the webapp side (already documented as acceptable in the 2026-07-11 doc).

## Architecture

**`extension/manifest.json`** — add:
```json
"externally_connectable": {
  "matches": [
    "https://pantarhei-int-sandbox-prd.web.app/*",
    "https://pantarhei-int-sandbox-prd.firebaseapp.com/*",
    "http://localhost:5174/*"
  ]
}
```
(Firebase Hosting serves both the `.web.app` and `.firebaseapp.com` domains by default for this project; `localhost:5174` is the webapp's Vite dev server port, per `webapp/vite.config.ts`.)

**`extension/background/background.js`** — add a `chrome.runtime.onMessageExternal` listener, following the same `message.type` switch pattern the file already uses for its internal `chrome.runtime.onMessage` listener:

```js
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'sokuji-allo/set-mode') return; // not ours; no response
  if (message.mode !== 'local' && message.mode !== 'api') return;

  (async () => {
    if (message.mode === 'local') {
      await chrome.storage.sync.set({ 'settings.common.provider': 'local_inference' });
    }
    await handleOpenSidePanel(sender.tab?.id);
    sendResponse({ success: true });
  })();

  return true; // keep the message channel open for the async sendResponse above
});
```

- **Storage key**: `settings.common.provider` is the exact key `src/services/SettingsService.ts` already reads/writes via `chrome.storage.sync` (confirmed by reading that file — it's the same mechanism the in-app Settings UI uses, not a new one).
- **`handleOpenSidePanel`**: reuse the existing helper already defined in `background.js` for the internal `OPEN_SIDE_PANEL` message, rather than duplicating side-panel-opening logic.
- **No `src/` (React app) changes needed for this doc** — `local_inference` is already a fully working `Provider` value; writing directly to the storage key the app already reads accomplishes the handoff without introducing `Provider.PANTARHEI_GEMINI` early.

## Open Questions

- **Does `chrome.sidePanel.open()` succeed when called from an externally-triggered message handler?** Chrome's side panel API has historically required a direct user-gesture context (e.g., a click within the extension itself). The user's gesture here happened on the webapp's "次へ" button, not inside the extension, so it's unconfirmed whether Chrome treats this call as gesture-backed or blocks it. Needs to be verified during implementation; if it's blocked, a fallback (e.g., a badge/notification prompting the user to click the extension icon themselves) will be needed.
- **Production URL stability**: the `externally_connectable` matches assume the webapp stays on Firebase's default domains. If a custom domain is added later, this manifest entry needs updating too — worth remembering when that happens.
