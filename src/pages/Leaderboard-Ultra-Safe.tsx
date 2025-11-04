import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameState, isGameFinished } from '../lib/gameState';
import { useAudio } from '../lib/audio';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const [timeToNext, setTimeToNext] = useState(10);
  const [gameState, setGameState] = useState(getGameState());
  const [userName] = useState(localStorage.getItem('userName') || 'Jugador');

  useEffect(() => {
    console.log('🏆 Ultra-Safe Leaderboard mounted');
    
    try {
      // Cargar estado del juego de forma ultra segura
      const currentGameState = getGameState();
      setGameState(currentGameState);
      console.log('📊 Current game state:', currentGameState);
      
      // Verificar si el juego ha terminado
      if (isGameFinished()) {
        console.log('🎉 Game finished!');
        audio.playGameEnd();
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
  }, [gameId, navigate, audio]);

  // Datos seguros con fallbacks (mover antes del check final)
  const safeCapital = gameState?.capital || 100000000;
  const safeCurrentRound = gameState?.currentRound || 1;
  const safeTotalRounds = gameState?.totalRounds || 5;
  const safeRoundHistory = gameState?.roundHistory || [];
  
  // Si el juego terminó, mostrar pantalla final con podio
  if (isGameFinished()) {
    // Crear ranking final con los mismos jugadores
    const finalPlayers = [
      {
        name: userName,
        capital: safeCapital,
        isUser: true
      },
      {
        name: 'Ana García',
        capital: 98500000 + Math.floor(Math.sin(safeCurrentRound * 100) * 5000000),
        isUser: false
      },
      {
        name: 'Carlos López',
        capital: 97200000 + Math.floor(Math.cos(safeCurrentRound * 200) * 4000000),
        isUser: false
      },
      {
        name: 'María Rodríguez',
        capital: 96800000 + Math.floor(Math.sin(safeCurrentRound * 300) * 3000000),
        isUser: false
      },
      {
        name: 'Roberto Silva',
        capital: 95500000 + Math.floor(Math.cos(safeCurrentRound * 400) * 4500000),
        isUser: false
      }
    ].sort((a, b) => b.capital - a.capital);

    const userPosition = finalPlayers.findIndex(p => p.isUser) + 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-2">🏆 ¡Juego Terminado! 🏆</h1>
            <p className="text-xl text-gray-600 mb-8">Simulación de Inversión Global - Resultados Finales</p>
            
            {/* Podio Visual */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">🥇 Podio de Ganadores 🥇</h2>
              
              <div className="flex justify-center items-end space-x-4 mb-8">
                {/* Segundo lugar */}
                {finalPlayers[1] && (
                  <div className="bg-gray-100 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="w-20 h-16 bg-gray-400 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                    <div className="text-4xl mb-2">🥈</div>
                    <p className="font-bold text-lg text-gray-800">{finalPlayers[1].name}</p>
                    <p className="text-sm text-gray-600">${finalPlayers[1].capital.toLocaleString()}</p>
                    {finalPlayers[1].isUser && (
                      <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">¡Eres tú!</div>
                    )}
                  </div>
                )}
                
                {/* Primer lugar */}
                {finalPlayers[0] && (
                  <div className="bg-yellow-100 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300 shadow-lg">
                    <div className="w-24 h-20 bg-yellow-500 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">1</span>
                    </div>
                    <div className="text-6xl mb-4">🥇</div>
                    <p className="font-bold text-2xl text-yellow-600">{finalPlayers[0].name}</p>
                    <p className="text-lg text-gray-700">${finalPlayers[0].capital.toLocaleString()}</p>
                    {finalPlayers[0].isUser && (
                      <div className="mt-3 px-4 py-2 bg-yellow-200 text-yellow-800 rounded-full font-bold">¡CAMPEÓN!</div>
                    )}
                  </div>
                )}
                
                {/* Tercer lugar */}
                {finalPlayers[2] && (
                  <div className="bg-orange-100 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="w-20 h-12 bg-orange-400 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">3</span>
                    </div>
                    <div className="text-4xl mb-2">🥉</div>
                    <p className="font-bold text-lg text-gray-800">{finalPlayers[2].name}</p>
                    <p className="text-sm text-gray-600">${finalPlayers[2].capital.toLocaleString()}</p>
                    {finalPlayers[2].isUser && (
                      <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">¡Eres tú!</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tu resultado personal */}
            <div className="mb-8 bg-blue-50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Tu Resultado</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Posición Final</p>
                  <p className="text-3xl font-bold text-blue-600">#{userPosition}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Capital Final</p>
                  <p className="text-2xl font-bold text-green-600">${safeCapital.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Ganancia Total</p>
                  <p className={`text-2xl font-bold ${safeCapital >= 100000000 ? 'text-green-600' : 'text-red-600'}`}>
                    {safeCapital >= 100000000 ? '+' : ''}${(safeCapital - 100000000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking completo */}
            <div className="mb-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏅 Ranking Completo</h3>
              <div className="space-y-2">
                {finalPlayers.map((player, index) => (
                  <div 
                    key={player.name}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      player.isUser ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <div>
                        <p className="font-bold">{index + 1}. {player.name} {player.isUser && '(Tú)'}</p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">${player.capital.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/join')}
                className="w-full bg-green-600 text-white py-4 px-8 rounded-lg font-bold text-xl hover:bg-green-700 transition duration-200 shadow-lg"
              >
                🚀 Jugar Nueva Partida
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
              >
                🔄 Reiniciar Completamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Último resultado seguro
  const lastRound = safeRoundHistory.length > 0 ? safeRoundHistory[safeRoundHistory.length - 1] : null;
  const safeNetGain = lastRound?.netGain ?? 0;
  const safeInvestmentA = lastRound?.investment?.A ?? 0;
  const safeInvestmentB = lastRound?.investment?.B ?? 0;
  const safeCountryA = lastRound?.countries?.A || 'País A';
  const safeCountryB = lastRound?.countries?.B || 'País B';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              🏆 Leaderboard - Ronda {Math.max(1, safeCurrentRound - 1)} de {safeTotalRounds}
            </h1>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <div className="text-2xl font-bold text-blue-600 mb-4">
                Próxima ronda en: {timeToNext}s
              </div>
              
              {/* Resumen de la última ronda */}
              {lastRound && (
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <p className="font-medium text-gray-800 mb-2">📊 Última ronda completada:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>🌍 Países: {safeCountryA} vs {safeCountryB}</p>
                    <p>💰 Inversión: ${(safeInvestmentA + safeInvestmentB).toLocaleString()}</p>
                  </div>
                  <p className={`text-center mt-2 font-semibold ${safeNetGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    📈 Resultado: {safeNetGain >= 0 ? '+' : ''}${Math.abs(safeNetGain).toLocaleString()}
                  </p>
                </div>
              )}
              
              {/* Jugadores ordenados por capital */}
              {(() => {
                // Crear jugadores simulados con variaciones basadas en la ronda
                const roundSeed = safeCurrentRound * 1000;
                const players = [
                  {
                    name: userName,
                    capital: safeCapital,
                    isUser: true
                  },
                  {
                    name: 'Ana García',
                    capital: 98500000 + Math.floor(Math.sin(roundSeed * 0.1) * 5000000),
                    isUser: false
                  },
                  {
                    name: 'Carlos López',
                    capital: 97200000 + Math.floor(Math.cos(roundSeed * 0.2) * 4000000),
                    isUser: false
                  },
                  {
                    name: 'María Rodríguez',
                    capital: 96800000 + Math.floor(Math.sin(roundSeed * 0.3) * 3000000),
                    isUser: false
                  },
                  {
                    name: 'Roberto Silva',
                    capital: 95500000 + Math.floor(Math.cos(roundSeed * 0.4) * 4500000),
                    isUser: false
                  }
                ];

                // Ordenar por capital (mayor a menor)
                const sortedPlayers = players.sort((a, b) => b.capital - a.capital);

                return (
                  <div className="space-y-2">
                    {sortedPlayers.map((player, index) => {
                      const position = index + 1;
                      const getPositionEmoji = (pos: number) => {
                        switch (pos) {
                          case 1: return '🥇';
                          case 2: return '🥈';
                          case 3: return '🥉';
                          default: return '🏅';
                        }
                      };
                      
                      const getPositionColor = (pos: number) => {
                        switch (pos) {
                          case 1: return 'bg-yellow-50 border-yellow-200';
                          case 2: return 'bg-gray-50 border-gray-200';
                          case 3: return 'bg-orange-50 border-orange-200';
                          default: return 'bg-blue-50 border-blue-200';
                        }
                      };

                      return (
                        <div 
                          key={player.name}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            player.isUser 
                              ? 'bg-blue-100 border-blue-300 shadow-md' 
                              : getPositionColor(position)
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold">
                                {getPositionEmoji(position)} {position}° {player.name}
                                {player.isUser && ' (Tú)'}
                              </p>
                              <p className="text-sm text-gray-600">Posición #{position}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                ${player.capital.toLocaleString()}
                              </p>
                              {player.isUser && lastRound && (
                                <p className={`text-sm font-medium ${
                                  safeNetGain >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {safeNetGain >= 0 ? '+' : ''}${Math.abs(safeNetGain).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              
              {/* Progreso del juego */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Progreso del Juego</h3>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, ((safeCurrentRound - 1) / safeTotalRounds) * 100))}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Ronda {Math.max(1, safeCurrentRound - 1)} de {safeTotalRounds} completada
                </p>
                
                {/* Estadísticas del juego */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="font-medium">Rondas jugadas</p>
                    <p className="text-lg font-bold text-blue-600">{safeRoundHistory.length}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="font-medium">Ganancia total</p>
                    <p className="text-lg font-bold text-green-600">
                      ${Math.max(0, safeCapital - 100000000).toLocaleString()}
                    </p>
                  </div>
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