import { getFirestore } from 'firebase-admin/firestore';

const USAGE_LOG_COLLECTION = 'alloUsageLog';

// See allowlist.ts for why this is explicit rather than getFirestore()'s
// zero-argument form.
const DATABASE_ID = 'default';

/**
 * Records that a user completed a relay session. Google's own AI Studio
 * console only reports usage per API key/project, not per PantaRhei end
 * user — this is what makes future per-user billing possible. No billing
 * logic reads this yet (see design doc's Non-Goals); it's captured so the
 * data exists when that design happens.
 */
export async function logUsage(uid: string, sessionDurationMs: number): Promise<void> {
  await getFirestore(DATABASE_ID).collection(USAGE_LOG_COLLECTION).add({
    uid,
    sessionDurationMs,
    endedAt: new Date(),
  });
}
