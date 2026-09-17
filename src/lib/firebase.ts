import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Helper function to ensure anonymous authentication
export const ensureAnon = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
};