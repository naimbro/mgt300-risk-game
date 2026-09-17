import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence, signInAnonymously, type User } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Pruebas locales: `npm run emu` + `npm run dev:emu`. Sesión en memoria para que
// cada pestaña sea un jugador distinto.
export const usandoEmulador = import.meta.env.DEV && !!import.meta.env.VITE_USE_EMULATOR;
if (usandoEmulador) {
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, location.hostname, 8080);
  void setPersistence(auth, inMemoryPersistence);
}

/**
 * Sesión anónima. Sin cuentas: el alumno escanea y juega, y cualquier docente
 * puede crear una partida. La sesión queda guardada en el navegador, así que
 * recargar o volver a abrir el enlace recupera al mismo jugador.
 */
export async function asegurarSesion(): Promise<User> {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
