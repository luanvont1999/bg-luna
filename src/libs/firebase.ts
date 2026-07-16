import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Firebase configuration using Vite environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "PLACEHOLDER_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "PLACEHOLDER_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "boardgame-hub-7f7a2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "PLACEHOLDER_APP_ID"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Force long-polling to prevent Firestore connection hangs on strict networks/proxies/Vercel gates
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, messaging, googleProvider, EmailAuthProvider };
