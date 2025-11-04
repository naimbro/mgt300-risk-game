import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameState, isGameFinished } from '../lib/gameState';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [timeToNext, setTimeToNext] = useState(10);
  const [gameState, setGameState] = useState(getGameState());
  const [userName] = useState(localStorage.getItem('userName') || 'Jugador');

  useEffect(() => {
    console.log('🏆 Safe Leaderboard mounted');
    
    try {
      // Cargar estado del juego de forma segura
      const currentGameState = getGameState();
      setGameState(currentGameState);
      console.log('📊 Current game state:', currentGameState);
      
      // Verificar si el juego ha terminado
      if (isGameFinished()) {
        console.log('🎉 Game finished!');
        return;
      }
      
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
    } catch (error) {
      console.error('❌ Error in Leaderboard:', error);
    }
  }, [gameId, navigate]);

  // Si el juego terminó, mostrar pantalla final
  if (isGameFinished()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">¡Juego Terminado!</h1>
            
            <div className="mb-8">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <p className="text-2xl font-bold text-yellow-600">{userName}</p>
                <p className="text-xl text-gray-700">Capital final: ${gameState.capital.toLocaleString()}</p>
                <p className="text-lg text-gray-600">Completaste {gameState.roundHistory.length} rondas</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/join')}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Jugar Nueva Partida
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              🏆 Leaderboard - Ronda {gameState.currentRound - 1} de {gameState.totalRounds}
            </h1>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <div className="text-2xl font-bold text-blue-600 mb-4">
                Próxima ronda en: {timeToNext}s
              </div>
              
              {/* Tu resultado actual */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-bold text-lg">🥇 {userName}</p>
                <p className="text-gray-700">Capital: ${gameState.capital.toLocaleString()}</p>
                
                {/* Mostrar último resultado si existe */}
                {gameState.roundHistory.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {(() => {
                      const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1];
                      return (
                        <div>
                          <p>📊 Última ronda: {lastRound.countries.A} vs {lastRound.countries.B}</p>
                          <p className={lastRound.netGain >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            💰 Ganancia: {lastRound.netGain >= 0 ? '+' : ''}${lastRound.netGain.toLocaleString()}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Jugadores simulados */}
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-bold">🥈 Ana García</p>
                  <p>Capital: $98,500,000</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-bold">🥉 Carlos López</p>
                  <p>Capital: $97,200,000</p>
                </div>
              </div>
              
              {/* Progreso del juego */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Progreso del Juego</h3>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((gameState.currentRound - 1) / gameState.totalRounds) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Ronda {gameState.currentRound - 1} de {gameState.totalRounds} completada
                </p>
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