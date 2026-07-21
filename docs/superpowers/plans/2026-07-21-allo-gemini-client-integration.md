# SOKUJI Allo — Client-Side PantaRhei Gemini Integration — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-21-allo-gemini-client-integration-design.md`

**Goal**: Make `Provider.PANTARHEI_GEMINI` (already writable to storage by the extension's handoff listener since 2026-07-17) resolve to a real, working client — closing the "tracked as a dependency" gap left by `docs/superpowers/plans/2026-07-17-allo-relay-backend.md`.

**Architecture summary**: A new `PantarheiGeminiRelayClient` (simplified port of `GeminiClient`'s message handling, connecting to PantaRhei's own relay instead of Google) plus the enum/config/factory plumbing to reach it, plus the minimum call-site changes (`MainPanel.tsx` apiKey resolution, `settingsStore.ts` session config, `ProviderSection.tsx` Settings UI) needed for that plumbing to actually run.

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `src/services/providers/PantarheiGeminiProviderConfig.ts` | Relay-managed twin of `GeminiProviderConfig` — same languages/voices, overrides identity + auth-related fields. |
| `src/services/clients/PantarheiGeminiRelayClient.ts` | `IClient` implementation — plain `WebSocket` to the relay, ID-token-as-first-message auth, simplified Gemini Live message handling. |
| `docs/superpowers/specs/2026-07-21-allo-gemini-client-integration-design.md` | This change's design doc. |
| `docs/superpowers/plans/2026-07-21-allo-gemini-client-integration.md` | This file. |

### Modified

| File | Change |
|---|---|
| `src/types/Provider.ts` | Add `Provider.PANTARHEI_GEMINI`; `isPantarheiManagedProvider()` / `pantarheiBaseProvider()` helpers; add to `SUPPORTED_PROVIDERS` (gated) and `getProviderDisplayName()`. |
| `src/types/Provider.test.ts` | Tests for the two new helpers, mirroring the existing Kizuna ones. |
| `src/utils/environment.ts` | `getPantarheiRelayWsUrl()`; `isPantarheiGeminiEnabled()` feature flag. |
| `src/vite-env.d.ts` | `VITE_PANTARHEI_BACKEND_URL`, `VITE_ENABLE_PANTARHEI_GEMINI` env var types. |
| `src/services/providers/ProviderConfigFactory.ts` | Register `PantarheiGeminiProviderConfig` behind `isPantarheiGeminiEnabled()`. |
| `src/services/clients/ClientFactory.ts` | New `Provider.PANTARHEI_GEMINI` case constructing `PantarheiGeminiRelayClient(apiKey)`. |
| `src/components/MainPanel/MainPanel.tsx` | `apiKey` resolution switch reads the ID token from `chrome.storage.local` for this provider. |
| `src/stores/settingsStore.ts` | `createSessionConfig` switch reuses `createGeminiSessionConfig(state.gemini, ...)` for this provider. |
| `src/components/Settings/sections/ProviderSection.tsx` | Separate "auto-authenticated" branch for `isPantarheiManagedProvider(provider)`, distinct from Kizuna's Better-Auth-coupled branch. |

### Reused without modification

| File | Why |
|---|---|
| `src/services/providers/GeminiProviderConfig.ts` | Base config `PantarheiGeminiProviderConfig` extends — languages/voices/capabilities are identical. |
| `extension/background/background.js`'s `onMessageExternal` listener | Already stores the ID token and flips the provider setting (shipped 2026-07-17); no changes needed on that side for this piece. |
| `relay-backend/` | Already implements the server side of this same auth handshake and Gemini relay; no changes needed here either. |

---

## Steps

- [x] Add `Provider.PANTARHEI_GEMINI` + helpers + tests.
- [x] Add `getPantarheiRelayWsUrl()` / `isPantarheiGeminiEnabled()` + env var types.
- [x] Add `PantarheiGeminiProviderConfig`, register in `ProviderConfigFactory`.
- [x] Add `PantarheiGeminiRelayClient` (simplified port of `GeminiClient`'s message handling over a plain relay `WebSocket`).
- [x] Wire the new case into `ClientFactory`.
- [x] Wire `MainPanel.tsx`'s apiKey resolution to read the stored ID token.
- [x] Wire `settingsStore.ts`'s session config to reuse `state.gemini`.
- [x] Fix `ProviderSection.tsx` so the API key field doesn't show for this provider.
- [x] Typecheck (`npx tsc --noEmit`) — clean for all touched files (pre-existing, unrelated errors elsewhere in the codebase confirmed via before/after comparison).
- [x] Run existing test suites (`Provider.test.ts`, `src/services/clients/*`) — all 74 tests pass.
- [ ] Real end-to-end verification: build the extension, complete a webapp login → "API利用" handoff → confirm a translation session actually runs through the relay to Gemini and back. Needs either a deployed relay or a locally-running one (`relay-backend/`'s `npm run dev`) reachable from the built extension — not yet done.
- [ ] Deploy `relay-backend/` to Cloud Run (tracked in the 2026-07-17 relay-backend plan, still outstanding).
