import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';

// Firebase configuration - using fallback for deployment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQYD4U5LIejha6Vt8yGTWljV1Q9Q3fzMg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mgt300-risk-game.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mgt300-risk-game",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mgt300-risk-game.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "792715226145",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:792715226145:web:8995e2f6053e67d44a4760"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Helper function to ensure anonymous authentication
export const ensureAnon = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
};