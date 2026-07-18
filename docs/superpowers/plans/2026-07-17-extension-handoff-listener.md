# Sokuji Extension — Handoff Listener for SOKUJI Allo — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-17-extension-handoff-listener-design.md`

**Goal**: Make the SOKUJI Allo webapp's extension handoff actually work end-to-end for `mode: 'local'`, by adding the `externally_connectable` manifest entry and an `onMessageExternal` listener the webapp has been calling into since the 2026-07-11 pivot.

**Architecture summary**: Two small, existing-pattern-following changes to `extension/`: a manifest permission (`externally_connectable`) and a background script listener that writes to the same `chrome.storage.sync` key the in-app Settings UI already uses, then opens the side panel via the existing `handleOpenSidePanel` helper. `mode: 'api'` is accepted but does not select a provider yet (depends on the separate `relay-backend/` work).

---

## File Structure

### Modified

| File | Change |
|---|---|
| `extension/manifest.json` | Add `externally_connectable.matches` for the webapp's production and local-dev origins. |
| `extension/background/background.js` | Add `chrome.runtime.onMessageExternal` listener handling `sokuji-allo/set-mode`. |
| `docs/spec/services/` (new file, e.g. `extension-handoff-listener.md`) | Current-state spec for the message contract, once implemented and verified. |

### Reused without modification

| File | Why |
|---|---|
| `webapp/src/lib/extensionHandoff.ts` | Already sends the exact message shape this listener expects; no webapp change needed. |
| `src/services/SettingsService.ts` | Its `chrome.storage.sync` key format (`settings.common.provider`) is reused as-is, not duplicated. |
| `extension/background/background.js`'s existing `handleOpenSidePanel` helper | Reused for opening the side panel rather than writing new side-panel-opening logic. |

---

## Steps

- [ ] Add `externally_connectable` to `extension/manifest.json` with the production (`pantarhei-int-sandbox-prd.web.app` / `.firebaseapp.com`) and local dev (`localhost:5174`) origins.
- [ ] Add the `onMessageExternal` listener to `extension/background/background.js`, handling `mode: 'local'` (write `settings.common.provider` = `local_inference`) and `mode: 'api'` (open side panel only, no provider change), per the design doc.
- [ ] Verify `chrome.sidePanel.open()` actually opens when triggered from this externally-sourced message (the design doc's flagged Open Question) — if blocked by Chrome's gesture requirement, adjust the fallback behavior accordingly.
- [ ] Build the extension and load it unpacked in Chrome; note its dev extension ID.
- [ ] Set `VITE_SOKUJI_EXTENSION_ID` in a local `webapp/.env` to that ID; run the webapp dev server (`localhost:5174`).
- [ ] Manually verify the full path: Login → Mode Select → select "ローカルモデル" → "次へ" → confirm the webapp shows the "delivered" success state, and the extension's side panel opens with Local Inference selected.
- [ ] Manually verify the `mode: 'api'` path opens the side panel without erroring, even though no provider changes yet.
- [ ] Write `docs/spec/services/extension-handoff-listener.md` reflecting the implemented/verified behavior.
- [ ] Update `docs/structure.md` if the background script gains enough new structure to be worth calling out (likely a one-line addition at most, given this reuses existing helpers).
