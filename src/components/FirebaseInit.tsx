import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const FirebaseInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        setInitialized(true);
        console.log('Firebase Auth initialized');
      },
      (error) => {
        console.error('Firebase Auth error:', error);
        setError(error.message);
        setInitialized(true);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Conectando con Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Error de conexión</h3>
          <p>{error}</p>
          <p className="mt-2 text-sm">Verifica tu conexión a internet y las credenciales de Firebase.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};