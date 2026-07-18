# SOKUJI Allo — Own Relay Backend for "API利用" Mode — Design

**Date**: 2026-07-17
**Status**: Approved for implementation planning
**Scope**: A new backend service, owned and operated by PantaRhei, that lets the "API利用" mode selected in `webapp/` run without the end user ever creating or entering their own AI provider API key.

## Context

The existing Sokuji codebase already has a pattern for "no API key for the end user": the `KIZUNA_AI_OPENAI_TRANSLATE` / `KIZUNA_AI_VOLCENGINE_AST2` providers (see `src/types/Provider.ts`, `isKizunaManagedProvider()`). These work by routing the extension's connection through a relay server (`getRelayWsUrl()`, under the `sokuji.kizuna.ai` domain) that holds the real vendor API key server-side and authenticates the caller via a session token instead.

That relay server is operated by `kizuna-ai-lab` (the upstream project), not by PantaRhei, and PantaRhei has no operational relationship with them. Reusing it is therefore not an option — PantaRhei cannot grant its own demo users wallet credit, cannot control its rate limits or uptime, and has no say in the data-handling policy of infrastructure it doesn't own. To offer the same "no API key" experience under PantaRhei's own control, PantaRhei needs its own, smaller version of the same pattern: a server that holds a real API key server-side and relays authenticated requests to it.

This design doc covers only that new backend service and its API key/auth strategy. It assumes the SOKUJI Allo webapp (Login + Mode Select, see the 2026-07-11 extension-handoff design doc) and the Chrome extension's `externally_connectable` handoff already exist or are being built in parallel — this doc is specifically about what happens *after* the extension receives `mode: 'api'` and needs to actually talk to an AI provider.

## Non-Goals (this phase)

- **Vertex AI.** The relay calls the Gemini API via a Google AI Studio API key (free tier) for now. The client library (`@google/genai`) supports switching to Vertex AI later via a config change (`apiKey` → `vertexai: true, project, location`), so this is deferred, not ruled out.
- **A wallet/balance/quota UI.** Unlike Kizuna's `/wallet/status` system, this phase has no low-balance UI or billing-to-end-user flow — that's a separate, later design. It does, however, log per-user usage now (see Architecture) so that later design has data to work from instead of starting blind.
- **Any provider other than Gemini.** OpenAI is not part of this phase — see the parent conversation for why (no free tier, cost starts immediately).
- **Public, uncontrolled access.** This backend is for a controlled external demo, not a general public launch. Access is gated by an email allowlist (see Architecture), not "anyone with a Google account."
- **Production-grade hardening** (structured monitoring/alerting, autoscaling tuning, formal incident response) beyond what's needed for a short external demo.

## User-Visible Behavior

No new UI. From the end user's perspective, selecting "API利用" in the SOKUJI Allo Mode Select screen and completing the handoff to the extension results in a working translation session with no API key prompt anywhere. If the signed-in Google account is not on the allowlist, the extension should show the same kind of "couldn't connect" state it already has for other providers — the exact copy is an extension-side detail, not covered by this doc.

## Architecture

```
Chrome extension (relay client)
   │  wss:// — first message is { type: 'auth', idToken }
   ▼
Cloud Run service (new, this design)
   │  1. Verify the ID token (Firebase Admin SDK, verifyIdToken)
   │  2. Check the verified email against the allowlist
   │  3. Enforce per-user rate limit / concurrent-session cap
   │  4. Proxy audio in both directions to/from Gemini
   ▼
Gemini Live API (Google AI Studio API key, held server-side only)
```

- **Hosting**: Cloud Run, in the same GCP project backing the existing Firebase project (`pantarhei-int-sandbox-prd`), so it shares billing and can still be deployed via the Firebase CLI if desired. Cloud Run is chosen over a plain Firebase Cloud Function because the relay is a long-lived WebSocket connection (audio streaming both ways), which Cloud Run supports natively.
- **Auth**: no new auth system. The client sends the Firebase ID token it already has from the webapp's Google Sign-In (`webapp/src/lib/firebase.ts`) — but not as an `Authorization` header, since a browser's native `WebSocket` API can't set custom headers on the handshake request. Instead, the token is sent as the **first message** over the socket (`{ type: 'auth', idToken }`), and the server waits for it (with a timeout) before doing anything else. The Cloud Run service verifies it with the Firebase Admin SDK's `verifyIdToken`, which cryptographically confirms it's a genuine, unexpired token for this Firebase project and yields the user's UID/email. No session store, no separate login step.
- **Abuse prevention**: after verifying the token, the service checks the user's email against an allowlist stored in Firestore. Only allowlisted users get proxied through to Gemini. On top of that, a per-user rate limit and a concurrent-connection cap protect both the Gemini free-tier quota and against a compromised/leaked token being abused.
- **API key custody**: a single Gemini API key (issued via Google AI Studio, under a PantaRhei organization Google account — not a personal account) is stored as a Cloud Run environment variable backed by Secret Manager. It is never sent to, or reachable from, the client.
- **Per-user usage logging**: Google's own AI Studio/Cloud console only reports usage aggregated per API key/project — it cannot tell which of PantaRhei's end users made which call, since every call uses the same key. To make future per-user billing possible, the Cloud Run service writes a usage record (Firebase UID, timestamp, session duration or token count) to Firestore after each session. This phase does not build any billing logic on top of that data — it's just captured so it exists when that design happens.
- **Client-side changes needed (tracked as a dependency, not covered by this doc)**: a new `Provider.PANTARHEI_GEMINI` entry analogous to `KIZUNA_AI_OPENAI_TRANSLATE`, a matching `ProviderConfig` subclass, a `ClientFactory` case, and a new relay client class that connects to this Cloud Run service's WebSocket URL (read via `VITE_PANTARHEI_BACKEND_URL`, see Decisions) instead of `getRelayWsUrl()`. This mirrors the existing Kizuna-twin pattern closely enough that it should be a small, well-precedented change once this backend exists.

## Decisions (resolved 2026-07-17)

- **Expected demo scale**: ~2–3 concurrent users. Comfortably within Google AI Studio's free-tier rate limits.
- **New provider ID/display name**: `Provider.PANTARHEI_GEMINI = 'pantarhei_gemini'`, display name `"PantaRhei Gemini"`. Follows the existing `kizunaai_*` naming style (org-prefixed, vendor-suffixed) closely enough to stay consistent with `src/types/Provider.ts`.
- **Gemini Live API confirmed**: yes — this must use Gemini's bidirectional streaming "Live API," not a plain single-shot text-generation call, since Sokuji's pipeline sends/receives continuous audio for the duration of a session (same shape as the existing OpenAI Realtime / Volcengine AST2 integrations). Model: `gemini-3.5-live-translate-preview`, confirmed against a real connection during implementation (see `relay-backend/scripts/test-gemini-live.ts`) — it's purpose-built for translation, unlike the initially-guessed `gemini-2.0-flash-live-001`, which doesn't exist for this API key.
- **GCP/Firebase project**: stays in the existing `pantarhei-int-sandbox-prd` project rather than a dedicated one, since other work already runs there.
- **Allowlist storage**: a Firestore collection, not an environment variable. Reconsidered from the initial "env var is simpler" instinct — allowlist membership is an operational/business decision (who's invited to the demo), not a code change, and shouldn't require an engineer to redeploy the service to add or remove someone. Firestore lets it be edited directly from the Firebase console with no deploy at all. This also pairs naturally with per-user usage logging (see Architecture), which needs Firestore access from the Cloud Run service anyway.
- **New relay URL / env var naming**: `VITE_PANTARHEI_BACKEND_URL`, mirroring the existing `VITE_BACKEND_URL` (which points at Kizuna's backend and can't be reused without conflating the two). A new `getPantarheiRelayWsUrl()` helper in `src/utils/environment.ts`, analogous to the existing `getRelayWsUrl()`, derives the `wss://` URL from it the same way.

All decisions above are now settled — no remaining Open Questions. Ready for an implementation plan.
