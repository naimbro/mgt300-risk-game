import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator, setPersistence, inMemoryPersistence, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Pruebas locales: `VITE_USE_EMULATOR=1 npm run dev` con los emuladores de
// auth y firestore. Sesión en memoria para que cada pestaña sea otro jugador.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  setPersistence(auth, inMemoryPersistence);
}

// Helper function to ensure anonymous authentication
export const ensureAnon = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
};