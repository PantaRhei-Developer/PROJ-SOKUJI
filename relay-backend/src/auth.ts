import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

// Reuses Application Default Credentials — set automatically by Cloud Run
// when this service runs under a service account with Firebase Auth access.
// No key file needed in this repo.
//
// projectId is explicit rather than left to ADC auto-detection: on a
// machine whose gcloud default project differs from this one (e.g. it's
// also used for other work), initializeApp() with no args silently
// resolves to the WRONG project, and verifyIdToken() then rejects every
// token with an "incorrect aud claim" error that looks like an auth bug
// but is actually just a project mismatch. Pin it instead of depending on
// ambient gcloud state.
if (getApps().length === 0) {
  initializeApp({ projectId: 'pantarhei-int-sandbox-prd' });
}

/**
 * Verifies a Firebase ID token from the SOKUJI Allo webapp's Google Sign-In.
 * Throws if the token is missing, expired, or not issued for this project.
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth().verifyIdToken(idToken);
}
