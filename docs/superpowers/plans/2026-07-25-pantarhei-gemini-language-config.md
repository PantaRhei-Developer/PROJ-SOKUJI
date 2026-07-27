# PantaRhei Gemini — Language Pair Actually Reaching the Relay — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-25-pantarhei-gemini-language-config-design.md`

**Goal**: Make the language pair selected in Settings actually reach the Gemini Live session for `Provider.PANTARHEI_GEMINI`, instead of being silently dropped by the relay client.

**Architecture summary**: Thread `config.instructions` from `PantarheiGeminiRelayClient.connect()` through the relay's existing `auth` WebSocket message into `relay-backend`'s `geminiRelay.ts`, which now forwards it to Google as `systemInstruction` — matching what `GeminiClient.ts` already does for direct-to-Google sessions.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `src/services/clients/PantarheiGeminiRelayClient.test.ts` | Regression test: `connect()` sends `instructions` in the `auth` message. |
| `docs/superpowers/specs/2026-07-25-pantarhei-gemini-language-config-design.md` | This change's design doc. |
| `docs/superpowers/plans/2026-07-25-pantarhei-gemini-language-config.md` | This file. |

### Modified

| File | Change |
|---|---|
| `src/services/clients/PantarheiGeminiRelayClient.ts` | `auth` message now includes `instructions: config.instructions`. |
| `relay-backend/src/server.ts` | `AuthMessage`/`isAuthMessage()` accept optional `instructions`; passed to `relayToGemini()`. |
| `relay-backend/src/geminiRelay.ts` | `relayToGemini()` takes optional `instructions`, adds `systemInstruction` to the Live API config when present. |

### Reused without modification

| File | Why |
|---|---|
| `src/components/MainPanel/MainPanel.tsx`'s `getSessionConfig()` / `getProcessedSystemInstructions()` | Already builds a correct, language-pair-aware `instructions` string for every Gemini-family provider, including this one — the bug was purely that the relay client discarded it, not that it was ever built wrong. |
| `src/services/providers/PantarheiGeminiProviderConfig.ts` | Language list/UI already fully enabled; no restriction existed to lift. |

---

## Steps

- [x] Trace root cause: `PantarheiGeminiRelayClient.connect()` never sent `config.instructions`; `geminiRelay.ts`'s `ai.live.connect()` had no `systemInstruction` and no way to receive one.
- [x] Add `instructions` to the client's `auth` message.
- [x] Add `instructions` to `server.ts`'s `AuthMessage` type/guard and forward it to `relayToGemini()`.
- [x] Add `systemInstruction` to `geminiRelay.ts`'s Live API config when `instructions` is present.
- [x] Typecheck `relay-backend` (`npx tsc --noEmit`) — clean.
- [x] Build `relay-backend` (`npm run build`) — clean.
- [x] Add a regression test for the client's `auth` message shape — passes.
- [ ] Redeploy `relay-backend` to Cloud Run (asia-northeast1) with this fix.
- [ ] Rebuild and reload the extension, then real end-to-end verification with a non-Japanese/English language pair through PantaRhei Gemini.
