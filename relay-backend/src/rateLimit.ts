// In-memory rate limiting — sized for the ~2-3 person demo scale in
// docs/superpowers/specs/2026-07-17-allo-relay-backend-design.md. A single
// Cloud Run instance is assumed; this would need a shared store (e.g.
// Firestore or Redis) if the service ever scales to multiple instances.

const MAX_CONCURRENT_SESSIONS_PER_USER = 2;
const MAX_CONNECTION_ATTEMPTS_PER_MINUTE = 10;
const ONE_MINUTE_MS = 60_000;

const activeSessions = new Map<string, number>();
const recentConnectionAttempts = new Map<string, number[]>();

/**
 * Call once per incoming connection, before proxying to Gemini. Returns
 * false if the user is over either the concurrent-session or
 * connection-attempts-per-minute limit — the caller should refuse the
 * connection in that case.
 */
export function tryAcquireSession(uid: string): boolean {
  const now = Date.now();

  const attempts = (recentConnectionAttempts.get(uid) ?? []).filter(
    (t) => now - t < ONE_MINUTE_MS,
  );
  attempts.push(now);
  recentConnectionAttempts.set(uid, attempts);
  if (attempts.length > MAX_CONNECTION_ATTEMPTS_PER_MINUTE) return false;

  const current = activeSessions.get(uid) ?? 0;
  if (current >= MAX_CONCURRENT_SESSIONS_PER_USER) return false;

  activeSessions.set(uid, current + 1);
  return true;
}

/** Call when a session ends (connection closed or refused), to free its slot. */
export function releaseSession(uid: string): void {
  const current = activeSessions.get(uid) ?? 0;
  if (current <= 1) {
    activeSessions.delete(uid);
  } else {
    activeSessions.set(uid, current - 1);
  }
}
