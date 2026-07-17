import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

// Reuses Application Default Credentials — set automatically by Cloud Run
// when this service runs under a service account with Firebase Auth access.
// No key file needed in this repo.
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Verifies a Firebase ID token from the SOKUJI Allo webapp's Google Sign-In.
 * Throws if the token is missing, expired, or not issued for this project.
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth().verifyIdToken(idToken);
}
