# Virtual Mic — Duplicate Registration & Silent Reinit — Design

**Date**: 2026-07-27
**Status**: Fixed
**Scope**: Two pre-existing bugs in the extension's virtual-microphone content scripts, found during live Google Meet testing of the SOKUJI Allo demo. Both are upstream (Kizuna AI Lab `sokuji`) bugs — the touched files (`extension/content/content.js`, `extension/content/virtual-microphone.js`) have no PantaRhei-specific history; this is not something the Allo work introduced.

## Context

Live-testing in Google Meet surfaced two symptoms:
1. Two "Sokuji Virtual Microphone" entries appeared in Meet's own mic dropdown instead of one.
2. After selecting either one, the other call participant heard no audio at all — total silence, regardless of which entry was picked.

## Non-Goals

- Rewriting the device-emulator library (`extension/content/device-emulator.iife.js`) itself — its `addEmulatedDevice`/`removeEmulatedDevice` API already supports what's needed; only the two call sites around it needed fixing.
- Addressing the separate, unrelated audio-feedback question raised earlier in the same testing session (tab-audio-to-speaker echo when "参加者の音声" is enabled) — investigated but not reproduced under the reported conditions (headphones already in use, participant audio toggle off); no fix made.

## User-Visible Behavior

The virtual mic now registers exactly once per page load, and survives a mid-session stream reinitialization (e.g. after the underlying `MediaStream` goes inactive) without going silent — the other call participant keeps hearing translated audio across a reinit instead of losing it permanently.

## Architecture

- **Root cause 1 (duplicate entries)**: `injectDeviceEmulatorScript()` and `injectVirtualMicrophoneScript()` in `extension/content/content.js` had no idempotency guard, unlike the pre-existing `injectPermissionIframe()` in the same file. If either injector runs twice against the same page realm (e.g. the extension reloads while the Meet tab stays open), `device-emulator.iife.js`'s IIFE re-wraps `navigator.mediaDevices.enumerateDevices` a second time, and each wrap layer re-adds the same emulated device — producing duplicate entries in `enumerateDevices()`'s result.
- **Root cause 2 (silence after reinit)**: `initializeVirtualMic()` in `extension/content/virtual-microphone.js` rebuilds a fresh `MediaStreamTrackGenerator`/`MediaStream` whenever the existing one goes inactive, but never told the device emulator about the replacement. The emulator's `meta[deviceId].customStream`/`.tracks` — captured once at `addEmulatedDevice()` time — kept pointing at the dead, original stream, which is what Meet's own `getUserMedia()` call had already resolved to. Sokuji's translated audio was being written into the new, orphaned generator that nothing downstream ever read.

## Fix

- `content.js`: both injector functions now check for their script tag's `id` (`sokuji-device-emulator-script` / `sokuji-virtual-microphone-script`) before injecting, and skip (not remove-and-reinject, since re-running either script's IIFE is itself the problem) if already present.
- `virtual-microphone.js`: `initializeVirtualMic()`'s reinit path now calls `navigator.mediaDevices.removeEmulatedDevice(virtualDeviceId)` before rebuilding the stream (this stops + fires `ended` on the old track, which is the standard signal consuming apps like Meet listen for to reacquire a device), then calls `registerVirtualDevice()` again afterward to re-register the new stream under the same device ID.
