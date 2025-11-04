import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [timeToNext, setTimeToNext] = useState(10);

  useEffect(() => {
    console.log('🏆 Simple Leaderboard mounted');
    
    const interval = setInterval(() => {
      setTimeToNext(prev => {
        if (prev <= 1) {
          console.log('🔄 Navigating to next round');
          navigate(`/game/${gameId}/round`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              🏆 Leaderboard Simplificado
            </h1>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <p className="text-lg text-gray-700 mb-4">
                Si ves este mensaje, el Leaderboard funciona correctamente.
              </p>
              
              <div className="text-2xl font-bold text-blue-600 mb-4">
                Próxima ronda en: {timeToNext}s
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="font-bold">🥇 1° lugar: Tu (Demo)</p>
                  <p>Capital: $102,000,000</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-bold">🥈 2° lugar: Ana García</p>
                  <p>Capital: $98,500,000</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/join')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              Salir del Juego
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};