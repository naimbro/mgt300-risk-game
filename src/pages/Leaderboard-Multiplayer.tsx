import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../lib/audio';
import { useGame } from '../hooks/useGame';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const { 
    gameData, 
    currentUser,
    playersRanking,
    isAdmin,
    startNextRound,
    processRoundResults,
    loading 
  } = useGame(gameId);

  const [processingResults, setProcessingResults] = useState(false);
  const [startingNextRound, setStartingNextRound] = useState(false);
  const [timeToNext, setTimeToNext] = useState(15);

  // Procesar resultados automáticamente cuando llega el admin
  useEffect(() => {
    if (!gameData || !currentUser) return;
    
    // Si el juego terminó
    if (gameData.currentRound > gameData.totalRounds) {
      console.log('🎉 Game finished!');
      audio.playGameEnd();
      return;
    }

    // Si es admin y no está procesando, procesar inmediatamente
    if (isAdmin && !processingResults && !startingNextRound) {
      console.log('🔧 Admin detected, processing results immediately...');
      // Dar un momento para que se cargue todo y luego procesar
      setTimeout(() => {
        handleProcessAndContinue();
      }, 2000);
    }

    // Timer de respaldo para no-admin
    const interval = setInterval(() => {
      setTimeToNext(prev => {
        if (prev <= 1) {
          if (isAdmin && !processingResults && !startingNextRound) {
            handleProcessAndContinue();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData, currentUser, isAdmin]);

  const handleProcessAndContinue = async () => {
    if (!isAdmin || processingResults || startingNextRound) {
      console.log('⏭️ Skipping process - not admin or already processing', { isAdmin, processingResults, startingNextRound });
      return;
    }

    try {
      console.log('🔄 Starting handleProcessAndContinue...', { 
        gameData: gameData?.currentRound, 
        totalRounds: gameData?.totalRounds,
        playerCount: Object.keys(gameData?.players || {}).length 
      });

      // Primero procesar resultados
      setProcessingResults(true);
      console.log('📊 Processing round results...');
      await processRoundResults();
      console.log('✅ Round results processed successfully');
      
      // Verificar si el juego debe continuar
      if ((gameData?.currentRound || 0) >= (gameData?.totalRounds || 5)) {
        console.log('🎉 Game finished after processing results');
        setProcessingResults(false);
        return;
      }
      
      // Luego iniciar siguiente ronda
      setStartingNextRound(true);
      console.log('🚀 Starting next round...');
      await startNextRound();
      console.log('✅ Next round started successfully');
      
      // Reset states
      setProcessingResults(false);
      setStartingNextRound(false);
      
    } catch (err) {
      console.error('❌ Error processing results:', err);
      setProcessingResults(false);
      setStartingNextRound(false);
    }
  };

  // Navegar a la ronda solo si está activa y el usuario NO ha enviado inversión
  useEffect(() => {
    if (!gameData || !currentUser) return;
    
    const currentRoundData = gameData.rounds[gameData.currentRound];
    
    if (currentRoundData?.isActive) {
      // Solo navegar si el usuario NO ha enviado su inversión para esta ronda
      const hasSubmittedThisRound = currentUser.submissions && Array.isArray(currentUser.submissions) ? 
        currentUser.submissions.some(sub => sub.round === gameData.currentRound) : false;
      
      if (!hasSubmittedThisRound) {
        console.log('🎮 Active round detected and user has not submitted, navigating to round...');
        navigate(`/game/${gameId}/round`);
      } else {
        console.log('🎮 Active round but user already submitted, staying in leaderboard until round ends');
      }
    }
  }, [gameData, currentUser, gameId, navigate]);

  if (loading || !gameData || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const isGameFinished = gameData.currentRound > gameData.totalRounds;
  const lastCompletedRound = gameData.currentRound - 1;

  // Pantalla final del juego
  if (isGameFinished) {
    const userPosition = playersRanking.findIndex(p => p.uid === currentUser.uid) + 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-2">🏆 ¡Juego Terminado! 🏆</h1>
            <p className="text-xl text-gray-600 mb-8">
              Simulación de Inversión Global - Resultados Finales
            </p>
            
            {/* Podio Visual */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">🥇 Podio de Ganadores 🥇</h2>
              
              <div className="flex justify-center items-end space-x-4 mb-8">
                {/* Segundo lugar */}
                {playersRanking[1] && (
                  <div className="bg-gray-100 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="w-20 h-16 bg-gray-400 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                    <div className="text-4xl mb-2">🥈</div>
                    <p className="font-bold text-lg text-gray-800">{playersRanking[1].name}</p>
                    <p className="text-sm text-gray-600">${playersRanking[1].capital.toLocaleString()}</p>
                    {playersRanking[1].uid === currentUser.uid && (
                      <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">¡Eres tú!</div>
                    )}
                  </div>
                )}
                
                {/* Primer lugar */}
                {playersRanking[0] && (
                  <div className="bg-yellow-100 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300 shadow-lg">
                    <div className="w-24 h-20 bg-yellow-500 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-3xl">1</span>
                    </div>
                    <div className="text-6xl mb-4">🥇</div>
                    <p className="font-bold text-2xl text-yellow-600">{playersRanking[0].name}</p>
                    <p className="text-lg text-gray-700">${playersRanking[0].capital.toLocaleString()}</p>
                    {playersRanking[0].uid === currentUser.uid && (
                      <div className="mt-3 px-4 py-2 bg-yellow-200 text-yellow-800 rounded-full font-bold">¡CAMPEÓN!</div>
                    )}
                  </div>
                )}
                
                {/* Tercer lugar */}
                {playersRanking[2] && (
                  <div className="bg-orange-100 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="w-20 h-12 bg-orange-400 rounded-t-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">3</span>
                    </div>
                    <div className="text-4xl mb-2">🥉</div>
                    <p className="font-bold text-lg text-gray-800">{playersRanking[2].name}</p>
                    <p className="text-sm text-gray-600">${playersRanking[2].capital.toLocaleString()}</p>
                    {playersRanking[2].uid === currentUser.uid && (
                      <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">¡Eres tú!</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tu resultado */}
            <div className="mb-8 bg-blue-50 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Tu Resultado</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Posición Final</p>
                  <p className="text-3xl font-bold text-blue-600">#{userPosition}</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Capital Final</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${currentUser.capital.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Ganancia Total</p>
                  <p className={`text-2xl font-bold ${
                    currentUser.capital >= 100000000 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentUser.capital >= 100000000 ? '+' : ''}
                    ${(currentUser.capital - 100000000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking completo */}
            <div className="mb-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏅 Ranking Final Completo</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {playersRanking.map((player, index) => (
                  <div 
                    key={player.uid}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      player.uid === currentUser.uid ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <div>
                        <p className="font-bold">
                          {index + 1}. {player.name} {player.uid === currentUser.uid && '(Tú)'}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg">${player.capital.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => navigate('/join')}
              className="bg-green-600 text-white py-4 px-8 rounded-lg font-bold text-xl hover:bg-green-700 transition duration-200 shadow-lg"
            >
              🚀 Jugar Nueva Partida
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Leaderboard durante el juego
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              🏆 Ranking - Ronda {lastCompletedRound} de {gameData.totalRounds}
            </h1>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              {/* Timer o estado de procesamiento */}
              {processingResults ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-lg font-semibold text-gray-700">Procesando resultados...</p>
                </div>
              ) : startingNextRound ? (
                <div>
                  <div className="animate-pulse">
                    <p className="text-lg font-semibold text-green-600">¡Iniciando siguiente ronda!</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Próxima ronda en</p>
                  <p className="text-3xl font-bold text-blue-600">{timeToNext}s</p>
                  {isAdmin && (
                    <p className="text-xs text-gray-500 mt-2">
                      Como admin, iniciarás automáticamente la siguiente ronda
                    </p>
                  )}
                </div>
              )}
              
              {/* Ranking de jugadores reales */}
              <div className="mt-6 space-y-2">
                {playersRanking.map((player, index) => {
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

                  // Obtener resultado de la última ronda
                  const lastSubmission = player.submissions[lastCompletedRound - 1];
                  const lastResult = lastSubmission?.result;

                  return (
                    <div 
                      key={player.uid}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        player.uid === currentUser.uid 
                          ? 'bg-blue-100 border-blue-300 shadow-md' 
                          : getPositionColor(position)
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getPositionEmoji(position)}</span>
                          <div className="text-left">
                            <p className="font-bold">
                              {position}° {player.name}
                              {player.uid === currentUser.uid && ' (Tú)'}
                              {player.isAdmin && ' 👨‍🏫'}
                            </p>
                            <p className="text-sm text-gray-600">Capital: ${player.capital.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {lastResult && (
                            <p className={`text-sm font-medium ${
                              lastResult.netGain >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {lastResult.netGain >= 0 ? '+' : ''}${lastResult.netGain.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Progreso del juego */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Progreso del Juego</h3>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(lastCompletedRound / gameData.totalRounds) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {lastCompletedRound} de {gameData.totalRounds} rondas completadas
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