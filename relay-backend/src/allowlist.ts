import { getFirestore } from 'firebase-admin/firestore';

const ALLOWLIST_COLLECTION = 'alloAllowlist';

// getFirestore() with no argument fails with a "5 NOT_FOUND" gRPC error in
// this project — the database's actual ID is the literal string "default"
// (the "(default)" with parentheses shown in the Firebase/gcloud console is
// just a display convention, not the real resource name), and the
// zero-argument overload doesn't resolve to it correctly here. Passing it
// explicitly works. Confirmed via relay-backend/scripts/test-firestore.ts
// and a raw REST call to the Firestore API during live debugging.
const DATABASE_ID = 'default';

/**
 * Checks whether an email is allowed to use the relay. Allowlist membership
 * is an operational decision (who's invited to the demo), so it lives in
 * Firestore — editable from the Firebase console with no redeploy — rather
 * than a hardcoded list or environment variable.
 *
 * Document ID is the email itself; presence of the document means allowed.
 */
export async function isAllowed(email: string): Promise<boolean> {
  const doc = await getFirestore(DATABASE_ID).collection(ALLOWLIST_COLLECTION).doc(email).get();
  return doc.exists;
}
