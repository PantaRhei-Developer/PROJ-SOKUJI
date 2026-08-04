# Virtual Mic — Duplicate Registration & Silent Reinit — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-27-virtual-mic-duplicate-and-silent-reinit-design.md`

**Goal**: Fix two virtual-microphone bugs found during live Google Meet testing — duplicate "Sokuji Virtual Microphone" entries in Meet's mic list, and total silence for the other call participant after the underlying audio stream reinitializes mid-session.

**Architecture summary**: Add an idempotency guard to the two script-injector functions in `content.js` (matching the pattern the existing permission-iframe injector already used), and make `virtual-microphone.js`'s stream-reinit path explicitly deregister + re-register the emulated device instead of silently swapping the stream underneath the device emulator's registry.

---

## File Structure

### Modified

| File | Change |
|---|---|
| `extension/content/content.js` | `injectDeviceEmulatorScript()` / `injectVirtualMicrophoneScript()` skip injection if their script tag's `id` already exists in the document. |
| `extension/content/virtual-microphone.js` | `initializeVirtualMic()`'s reinit branch now calls `removeEmulatedDevice(virtualDeviceId)` before rebuilding the stream, then `registerVirtualDevice()` again afterward. |

### Created

| File | Responsibility |
|---|---|
| `docs/superpowers/specs/2026-07-27-virtual-mic-duplicate-and-silent-reinit-design.md` | This change's design doc. |
| `docs/superpowers/plans/2026-07-27-virtual-mic-duplicate-and-silent-reinit.md` | This file. |

### Reused without modification

| File | Why |
|---|---|
| `extension/content/device-emulator.iife.js` | Already exposes `addEmulatedDevice`/`removeEmulatedDevice` — the fix only needed to call the existing `removeEmulatedDevice` from a new call site, not add API surface. |

---

## Steps

- [x] Reproduce both symptoms live in Google Meet; trace root causes via code investigation (both bugs pre-date this branch — confirmed via `git log`/`git blame` showing only upstream `kizuna-ai-lab` authorship on the touched files).
- [x] Add idempotency guards to both script injectors in `content.js`.
- [x] Add deregister-before-rebuild / re-register-after-rebuild to `initializeVirtualMic()`'s reinit path in `virtual-microphone.js`.
- [x] Syntax-check both edited files (`node --check`) — clean.
- [x] Rebuild the extension (`npm run extension:build`) and confirm both fixes are present in `dist/`.
- [x] User confirmed the fix works live in Google Meet (tested on a provider other than PantaRhei Gemini, since this branch — cut fresh from `dev` — doesn't yet include the still-unmerged PantaRhei relay CSP entry).
