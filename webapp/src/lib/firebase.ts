import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Web apiKey values are not secret — access is controlled by Firebase security
// rules, not by hiding this key. Analytics (measurementId) is intentionally
// left unwired; this app only uses Auth for now.
const firebaseConfig = {
  apiKey: 'AIzaSyCT5rzwi2YjU9e1ybHgZU9jZ-T34qrWwVE',
  authDomain: 'pantarhei-int-sandbox-prd.firebaseapp.com',
  projectId: 'pantarhei-int-sandbox-prd',
  storageBucket: 'pantarhei-int-sandbox-prd.firebasestorage.app',
  messagingSenderId: '822022072206',
  appId: '1:822022072206:web:0069728737b446ca3ae6df',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
