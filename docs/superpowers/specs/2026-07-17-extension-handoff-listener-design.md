# Sokuji Extension — Handoff Listener for SOKUJI Allo — Design

**Date**: 2026-07-17
**Status**: Approved for implementation planning
**Scope**: The extension-side counterpart of `webapp/src/lib/extensionHandoff.ts`'s `sendModeToExtension()` — accept the `{ type: 'sokuji-allo/set-mode', mode }` message from the SOKUJI Allo webapp and act on it. This was explicitly flagged as an out-of-scope dependency in `docs/superpowers/specs/2026-07-11-webapp-extension-handoff-design.md`; this doc is that dependency.

## Context

The webapp's Mode Select screen already calls `chrome.runtime.sendMessage(extensionId, { type: 'sokuji-allo/set-mode', mode: 'local' | 'api' }, callback)` and, until now, nothing on the extension side listens for it — every attempt falls through to the webapp's "extension not found" fallback by design. This doc adds the missing listener so a real handoff can succeed.

## Non-Goals (this phase)

- **Wiring `mode: 'api'` to a working provider.** That requires `Provider.PANTARHEI_GEMINI` and the `relay-backend/` service from `docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md`, neither of which exist yet. For now, receiving `mode: 'api'` opens the confirmation tab (see User-Visible Behavior) but does not change the selected provider.
- **Changing content scripts or virtual-mic injection.** Untouched by this change.
- **Automatic extension installation.** Unchanged from the 2026-07-11 doc's decision — the webapp's fallback link to the Chrome Web Store listing is the only installation path.
- **Any change to who publishes/hosts the extension.** Purely an in-repo code change to this fork; distribution/publishing is a separate, already-raised question.

## User-Visible Behavior

When the webapp successfully delivers a `sokuji-allo/set-mode` message:

- **`mode: 'local'`** — the extension sets its provider to Local Inference (the same setting the in-app Settings UI already controls) and opens `fullpage.html` in a new, ordinary browser tab as confirmation.
- **`mode: 'api'`** — the extension opens the same confirmation tab, but does not change the currently-selected provider (there is no working "no API key" API provider to switch to yet — see Non-Goals). The user sees whatever the extension's provider was already set to.
- **This confirmation tab is not the side panel**, and deliberately so (see Architecture) — real usage still opens the side panel from the actual meeting tab (Zoom/Meet/Teams) via the action icon, exactly as it does today. The confirmation tab only exists to show the user that the handoff worked; the webapp tab itself can be closed afterward without side effects.
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
    await chrome.tabs.create({ url: chrome.runtime.getURL('fullpage.html') });
    sendResponse({ success: true });
  })().catch((error) => {
    sendResponse({ success: false, error: error.message });
  });

  return true; // keep the message channel open for the async sendResponse above
});
```

- **Storage key**: `settings.common.provider` is the exact key `src/services/SettingsService.ts` already reads/writes via `chrome.storage.sync` (confirmed by reading that file — it's the same mechanism the in-app Settings UI uses, not a new one).
- **Opens a new tab, not the side panel** (revised from this doc's original plan — see Decisions below for why).
- **No `src/` (React app) changes needed for this doc** — `local_inference` is already a fully working `Provider` value; writing directly to the storage key the app already reads accomplishes the handoff without introducing `Provider.PANTARHEI_GEMINI` early.

## Decisions (resolved 2026-07-17, during implementation)

- **Side panel, not used for the handoff confirmation.** The original plan was to call `chrome.sidePanel.open({ tabId: sender.tab.id })` on the webapp's own tab. Implementing and testing it surfaced two real problems:
  1. It initially failed with `Error: No active side panel for tabId: ...` — the existing `tabs.onUpdated`/`onActivated` listeners explicitly *disable* the side panel for any tab not in `ENABLED_SITES` (i.e., not a supported meeting site), and the webapp's tab falls into that "disabled" bucket by default.
  2. After enabling it for the webapp's tab specifically (as a first fix), manual testing confirmed that **closing the webapp tab closes the side panel with it** — side panel enablement is tab-scoped, so once its owning tab is gone, so is the panel. Since the intended UX is "confirm the handoff worked, then the webapp tab can be closed," this made the side panel a bad fit: closing the tab a moment after seeing the confirmation would immediately undo it.

  The chosen fix is opening `fullpage.html` as an ordinary new tab instead (via `chrome.tabs.create`), which has no such lifecycle coupling to the webapp's tab. This also better matches reality: Sokuji's real usage pattern is the side panel opened *from the meeting tab itself* (Zoom/Meet/Teams) via the action icon — the handoff moment was never meant to reproduce that overlay experience, just confirm the setting took effect. The `Provider` change is still written to `chrome.storage.sync` regardless, so opening the side panel later from an actual meeting tab already reflects it correctly.
- **Production URL stability**: the `externally_connectable` matches assume the webapp stays on Firebase's default domains. If a custom domain is added later, this manifest entry needs updating too — worth remembering when that happens.
