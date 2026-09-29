import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Read strictly from Vite environment variables or window global injection
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

// Firebase cloud sync must be explicitly enabled (VITE_ENABLE_FIREBASE_SYNC=true)
const firebaseSyncEnabled = (() => {
  const flag = (env.VITE_ENABLE_FIREBASE_SYNC || '').toString().trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
})();

export const firebaseConfig: FirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.apiKey) || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.authDomain) || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.projectId) || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.storageBucket) || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.messagingSenderId) || '',
  appId: env.VITE_FIREBASE_APP_ID || (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__?.appId) || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseSyncEnabled && firebaseConfig.projectId && firebaseConfig.apiKey
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('[Firebase] Connected to project:', firebaseConfig.projectId);
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
  }
}

export { app, db };
