# PantaRhei Gemini — Language Pair Actually Reaching the Relay — Design

**Date**: 2026-07-25
**Status**: Approved for implementation
**Scope**: Fix `Provider.PANTARHEI_GEMINI` translating with the wrong language pair (or a fixed, undocumented default) regardless of what the user selects in Settings.

## Context

After deploying `relay-backend/` to Cloud Run (asia-northeast1) and verifying the demo end-to-end in Japanese↔English, testing a different language pair through PantaRhei Gemini failed to translate correctly. Investigation traced this to `docs/superpowers/specs/2026-07-21-allo-gemini-client-integration-design.md`'s client implementation: `PantarheiGeminiRelayClient.connect()` never forwarded `config.instructions` (the language-pair-aware system prompt every other Gemini-family session config carries) to the relay at all — only `{ type: 'auth', idToken }` was ever sent. `relay-backend/src/geminiRelay.ts`'s `ai.live.connect()` call had no `systemInstruction` and no way to receive one, so Google's `gemini-3.5-live-translate-preview` model ran with whatever its own default behavior is, completely independent of the UI's language selection. The Settings UI itself was never restricted — any of the 34 languages `GeminiProviderConfig` lists could be selected — but the selection was a no-op for this provider specifically.

By contrast, the direct-to-Google `GeminiClient` builds `config.instructions` from the user's source/target language selection (via `getProcessedSystemInstructions()` in `MainPanel.tsx`) and forwards it as `systemInstruction` straight to the Live API — so this gap was specific to the relay path, not the underlying Gemini model or the instructions-building logic itself.

## Non-Goals

- **Per-connection model/voice/other session fields.** Only `instructions` is threaded through in this fix — `PantarheiGeminiRelayClient.connect()` already ignores `config.model` and `config.voice` too (the relay hardcodes its own model), and that's unchanged. Widening the relay's `auth` message to carry the full session config is a larger change than this bug needs.
- **Runtime session updates.** `updateSession()` on this client already warns and no-ops ("Reconnection required") — unaffected by this fix.
- **Validating that `gemini-3.5-live-translate-preview` actually honors arbitrary `systemInstruction` language pairs as well as `GeminiClient`'s target model does.** This fix makes the relay forward the same instructions text `GeminiClient` already sends successfully; whether this specific preview model's translation quality holds up for every pair is a product/demo-content question, not a wiring bug.

## User-Visible Behavior

Selecting a language pair other than the one used during the initial Japanese↔English demo now actually affects the PantaRhei Gemini session — the relay forwards the same system-instruction text used for a direct Gemini session. No UI changes; the Settings language pickers were already fully enabled.

## Architecture

- **`src/services/clients/PantarheiGeminiRelayClient.ts`**: the `auth` message sent on `ws.onopen` now includes `instructions: config.instructions` alongside `idToken`.
- **`relay-backend/src/server.ts`**: `AuthMessage` gains an optional `instructions?: string` field; `isAuthMessage()` validates it's either absent or a string; `relayToGemini(ws, parsed.instructions)` now passes it through.
- **`relay-backend/src/geminiRelay.ts`**: `relayToGemini()` takes an optional second `instructions` parameter and, when present, adds `systemInstruction: { parts: [{ text: instructions }] }` to the `ai.live.connect()` config — the same shape `GeminiClient.ts` already sends directly to Google.

## Decisions

- **Threaded through the existing `auth` message rather than adding a second message.** The relay's protocol already treats the first client message as a one-time setup message (auth); adding one field to it is simpler than introducing a second round-trip or a separate `config` message type, and nothing else in the current design needs to send session config after connection opens.
- **`instructions` kept optional end-to-end** (both in the wire message and the `relayToGemini()` signature) rather than required, so a missing/empty value degrades to the pre-fix behavior (Google's model default) instead of throwing — matches how `GeminiClient.ts` treats `config.instructions` as optional too (`config.instructions ? {...} : undefined`).
