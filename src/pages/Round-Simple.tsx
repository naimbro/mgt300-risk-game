import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const Round = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎮 Simple Round component mounted');
    
    // Simular carga
    setTimeout(() => {
      console.log('✅ Loading complete');
      setLoading(false);
    }, 1000);
    
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ronda simple...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            🎯 Ronda de Prueba
          </h1>
          
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-600">
              Si ves este mensaje, el componente Round funciona correctamente.
            </p>
            
            <button
              onClick={() => navigate('/join')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Volver al Join
            </button>
            
            <button
              onClick={() => navigate(`/game/${gameId}/leaderboard`)}
              className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              Ir a Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};