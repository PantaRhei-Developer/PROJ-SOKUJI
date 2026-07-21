# SOKUJI Allo — Own Relay Backend for "API利用" Mode — Implementation Plan

**Design doc**: `docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md`

**Goal**: Stand up a PantaRhei-operated Cloud Run relay service so that SOKUJI Allo's "API利用" mode can run on Gemini without the end user ever creating or entering an API key, mirroring the existing `KIZUNA_AI_*` "no API key" pattern but under PantaRhei's own control, cost, and access list.

**Architecture summary**: A new, independent service (`relay-backend/`) deployed to Cloud Run in the existing `pantarhei-int-sandbox-prd` GCP project. The extension connects over `wss://` with a Firebase ID token; the service verifies the token (Firebase Admin SDK), checks the caller's email against a Firestore allowlist, enforces per-user rate limiting, proxies audio to/from Gemini's Live API using a PantaRhei-owned Google AI Studio key (Secret Manager), and logs per-user usage to Firestore after each session. This plan covers the backend service only — the client-side `Provider.PANTARHEI_GEMINI` / `ProviderConfig` / `ClientFactory` / relay-client changes needed for the extension to actually use this service are a separate, later plan (same "tracked as a dependency" treatment the 2026-07-11 extension-handoff plan gave to the extension's `externally_connectable` work).

---

## File Structure

### Created

| File | Responsibility |
|---|---|
| `relay-backend/package.json`, `relay-backend/tsconfig.json` | New service project setup (TypeScript, strict mode, no `any`/`unknown` per this repo's rules). |
| `relay-backend/src/server.ts` | Entry point — HTTP server with WebSocket upgrade handling, listens on Cloud Run's `PORT`. |
| `relay-backend/src/auth.ts` | Verifies the incoming Firebase ID token via the Firebase Admin SDK (`verifyIdToken`); rejects the connection if invalid/expired. |
| `relay-backend/src/allowlist.ts` | Checks the verified email against the Firestore allowlist collection; rejects the connection if not listed. |
| `relay-backend/src/rateLimit.ts` | Per-user request-rate and concurrent-connection limiting. |
| `relay-backend/src/geminiRelay.ts` | Opens a corresponding connection to Gemini's Live API using the server-held API key, and proxies audio frames in both directions between the extension's connection and Gemini's. |
| `relay-backend/src/usageLog.ts` | Writes a Firestore usage record (Firebase UID, timestamp, session duration) after each session ends. |
| `relay-backend/Dockerfile` | Container build for Cloud Run deployment. |
| `relay-backend/.env.example` | Documents required environment variables (`GEMINI_API_KEY`, Firebase project config, allowlist/Firestore config) — no real values committed. |
| `relay-backend/README.md` | How to run locally and deploy, for whoever picks this up next. |
| `relay-backend/.gitignore` | Excludes `node_modules/`, `dist/`, `.env`. |
| `relay-backend/scripts/list-models.ts` | One-off script to list which Gemini models this API key can reach with `bidiGenerateContent` (the Live API) — used to find the correct model name. |
| `relay-backend/scripts/test-gemini-live.ts` | One-off script to confirm a Live API connection succeeds against the real Gemini API, independent of the rest of the relay (auth, allowlist, a real client). |
| `docs/spec/services/allo-relay-backend.md` | Current-state spec for this service once it exists (request/response contract, auth flow, error cases) — written once the implementation stabilizes, not before. |

### Modified

| File | Change |
|---|---|
| `docs/structure.md` | Add a top-level `relay-backend/` entry once the directory exists. |

### Reused without modification

| File | Why |
|---|---|
| `webapp/src/lib/firebase.ts` | The Firebase ID token this service verifies is the one the webapp's existing Google Sign-In already produces — no change needed there. |
| Firebase project `pantarhei-int-sandbox-prd` | Reused as-is per the design doc's decision, rather than provisioning a dedicated project. |

### Explicitly out of scope for this plan (tracked as a dependency)

| Future work | Why it's separate |
|---|---|
| `src/types/Provider.ts`: add `Provider.PANTARHEI_GEMINI` | Client-side change, needs its own plan once this backend is deployed and its URL is known. |
| New `PantarheiGeminiProviderConfig` under `src/services/providers/` | Same as above. |
| `src/services/clients/ClientFactory.ts`: new case + new relay client class | Same as above — mirrors the existing `KIZUNA_AI_OPENAI_TRANSLATE` case once this service exists. |
| `src/utils/environment.ts`: `VITE_PANTARHEI_BACKEND_URL`, `getPantarheiRelayWsUrl()` | Same as above. |

---

## Steps

- [x] Scaffold `relay-backend/` (package.json, tsconfig, Dockerfile) as an independent Node/TypeScript project, matching this repo's strict-mode / no-`any` conventions.
- [x] Implement `auth.ts` (Firebase ID token verification via Admin SDK).
- [x] Implement `allowlist.ts` against a Firestore collection in `pantarhei-int-sandbox-prd`.
- [x] Implement `rateLimit.ts` (per-user rate + concurrent-connection cap).
- [x] Implement `geminiRelay.ts` against Gemini's Live API, using a Google AI Studio key issued under a PantaRhei organization account, read from a `GEMINI_API_KEY` environment variable.
  - **Model name corrected during implementation**: the initial guess (`gemini-2.0-flash-live-001`) doesn't exist for this API key (`404` on connect). Used `scripts/list-models.ts` to enumerate which models this key can actually reach with `bidiGenerateContent` (the Live API), and switched to `gemini-3.5-live-translate-preview` — purpose-built for translation, and confirmed working end-to-end (setup message received, no errors) via `scripts/test-gemini-live.ts`.
- [x] Implement `usageLog.ts` (per-user Firestore usage records; no billing logic on top, per the design doc's Non-Goals).
- [x] Wire it all together in `server.ts`.
  - **Design correction found during implementation**: the design doc originally sketched `Authorization: Bearer <token>` on the WebSocket handshake, but a browser's native `WebSocket` API can't set custom headers — the extension is the client, so this isn't reachable. Switched to sending the ID token as the first message over the socket instead (`{ type: 'auth', idToken }`); the design doc's Architecture section has been updated to match.
- [x] `npm install` + `npm run build` (`tsc`) — clean, no type errors.
- [ ] Deploy to Cloud Run in `pantarhei-int-sandbox-prd`; confirm the WebSocket connection survives a full session (not just the initial handshake).
- [ ] Manually verify: an allowlisted Firebase-authenticated caller can complete a full translate session end-to-end; a non-allowlisted caller is rejected; an expired/invalid token is rejected.
- [ ] Write `docs/spec/services/allo-relay-backend.md` reflecting the deployed service's actual contract.
- [ ] Update `docs/structure.md` with the new `relay-backend/` top-level entry.
- [x] Open the separate, later plan for the client-side `Provider.PANTARHEI_GEMINI` integration once this service's URL is live — see `docs/superpowers/plans/2026-07-21-allo-gemini-client-integration.md` (client-side code done; real end-to-end verification against a deployed/local relay is still outstanding there).
