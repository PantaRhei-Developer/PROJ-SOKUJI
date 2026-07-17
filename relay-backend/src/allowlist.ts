import { getFirestore } from 'firebase-admin/firestore';

const ALLOWLIST_COLLECTION = 'alloAllowlist';

/**
 * Checks whether an email is allowed to use the relay. Allowlist membership
 * is an operational decision (who's invited to the demo), so it lives in
 * Firestore — editable from the Firebase console with no redeploy — rather
 * than a hardcoded list or environment variable.
 *
 * Document ID is the email itself; presence of the document means allowed.
 */
export async function isAllowed(email: string): Promise<boolean> {
  const doc = await getFirestore().collection(ALLOWLIST_COLLECTION).doc(email).get();
  return doc.exists;
}
