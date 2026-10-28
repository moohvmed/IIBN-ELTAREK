import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'] as const;
const missing = required.filter((key) => !import.meta.env[key]);

// Keep startup explicit: the app must not silently connect to an unconfigured Firebase project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
};

const configured = missing.length === 0;
const app = configured
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

// Export nullable services so the public pages can load before Firebase is configured.

const useAuthEmulator =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

export const auth = app
  ? getAuth(app)
  : (null as unknown as ReturnType<typeof getAuth>);

  export const authPersistenceReady = app
  ? setPersistence(auth, browserLocalPersistence)
  : Promise.resolve();

export const db = app
  ? getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined)
  : (null as unknown as ReturnType<typeof getFirestore>);

export const googleProvider = new GoogleAuthProvider();
export const firebaseConfigured = configured;
export const firebaseMissingConfig = missing;

if (app && useAuthEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  });

  connectFirestoreEmulator(db, '127.0.0.1', 8081);
}
