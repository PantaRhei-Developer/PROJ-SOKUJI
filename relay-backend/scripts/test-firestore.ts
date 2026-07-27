// One-off diagnostic: minimal Firestore read, isolated from server.ts/auth.ts,
// to narrow down whether the 5 NOT_FOUND is specific to how the server wires
// things up or a more fundamental project/credentials issue.
// Run with: node --env-file=.env --import tsx/esm scripts/test-firestore.ts

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: 'pantarhei-int-sandbox-prd' });
}

console.log('Reading alloAllowlist collection...');
const snap = await getFirestore('default').collection('alloAllowlist').limit(5).get();
console.log(`Success! ${snap.size} doc(s) found:`);
snap.forEach((doc) => console.log(' -', doc.id));
