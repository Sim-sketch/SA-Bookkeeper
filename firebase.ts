import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigJson from "./firebase-applet-config.json";

/**
 * SECURE CONFIGURATION PATTERN
 * 
 * To prevent sensitive credentials from being exposed in version control:
 * 1. The 'firebase-applet-config.json' file is now listed in .gitignore.
 * 2. We prioritize environment variables (prefixed with VITE_) which can be 
 *    securely managed in the AI Studio Settings menu.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (firebaseConfigJson as any).apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfigJson as any).authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseConfigJson as any).projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigJson as any).storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigJson as any).messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseConfigJson as any).appId,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || (firebaseConfigJson as any).databaseURL,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (firebaseConfigJson as any).measurementId,
};

// Google Client ID is usually used separately for Auth providers if needed
export const googleClientId = import.meta.env.VITE_FIREBASE_GOOGLE_CLIENT_ID || (firebaseConfigJson as any).googleClientId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
