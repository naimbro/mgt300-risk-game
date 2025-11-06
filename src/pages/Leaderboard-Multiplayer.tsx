import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../lib/audio';
import { useGame } from '../hooks/useGame';
import { gameService } from '../lib/gameService';

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
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showNewResults, setShowNewResults] = useState(false);

  // NO auto-procesar - solo mostrar controles para admin
  useEffect(() => {
    if (!gameData || !currentUser) return;
    
    // Debug: Check for messages
    if (currentUser.submissions && Array.isArray(currentUser.submissions)) {
      const lastSub = currentUser.submissions[currentUser.submissions.length - 1];
      if (lastSub?.result) {
        console.log('📝 User last submission result:', {
          round: lastSub.round,
          hasMessageA: !!lastSub.result.messageA,
          hasMessageB: !!lastSub.result.messageB,
          messageA: lastSub.result.messageA,
          messageB: lastSub.result.messageB,
          netGain: lastSub.result.netGain
        });
        
        // Show new results notification
        if (lastSub.round === gameData.currentRound - 1 || lastSub.round === gameData.currentRound) {
          setShowNewResults(true);
          setTimeout(() => setShowNewResults(false), 5000);
        }
      }
    }
    
    // Si el juego terminó
    if (gameData.currentRound >= gameData.totalRounds) {
      console.log('🎉 Game finished!');
      audio.playGameEnd();
      return;
    }

    // Solo log - no auto-procesamiento
    if (isAdmin) {
      console.log('🎮 Admin in leaderboard - manual controls available');
    }

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
      
      // Verificar si el juego debe continuar (después de procesar, el currentRound se actualiza)
      // Esperamos un momento para que Firebase se actualice y luego revisamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const gameSnap = await gameService.getGame(gameId!);
      if (!gameSnap) {
        throw new Error('No se pudo obtener datos del juego');
      }
      
      console.log('🔍 Checking game status after processing:', {
        currentRound: gameSnap.currentRound,
        totalRounds: gameSnap.totalRounds,
        shouldContinue: gameSnap.currentRound < gameSnap.totalRounds
      });
      
      if (gameSnap.currentRound >= gameSnap.totalRounds) {
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
      setProcessingError(err instanceof Error ? err.message : 'Error desconocido');
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

  const isGameFinished = gameData.currentRound >= gameData.totalRounds;
  const lastCompletedRound = Math.min(gameData.currentRound, gameData.totalRounds);
  
  // Debug logging
  console.log('🔍 Leaderboard Debug:', {
    currentRound: gameData.currentRound,
    lastCompletedRound,
    currentUser,
    submissions: currentUser?.submissions,
    rounds: gameData.rounds
  });

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
                    <p className="text-sm text-gray-600">${playersRanking[1].capital} USD</p>
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
                    <p className="text-lg text-gray-700">${playersRanking[0].capital} USD</p>
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
                    <p className="text-sm text-gray-600">${playersRanking[2].capital} USD</p>
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
                    ${currentUser.capital} USD
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Ganancia Total</p>
                  <p className={`text-2xl font-bold ${
                    currentUser.capital >= 100 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentUser.capital >= 100 ? '+' : ''}
                    ${(currentUser.capital - 100)} USD
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
                    <p className="font-bold text-lg">${player.capital} USD</p>
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
            
            {/* New Results Alert */}
            {showNewResults && (
              <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 mb-6 animate-pulse">
                <p className="text-green-800 font-semibold text-center">
                  ✨ ¡Nuevos resultados disponibles! Revisa el análisis de tu inversión abajo.
                </p>
              </div>
            )}
            
            {/* Display current user's investment feedback prominently */}
            {(() => {
              // Buscar la submission más reciente que tenga resultado
              const userLastSubmission = currentUser.submissions && Array.isArray(currentUser.submissions) ? 
                [...currentUser.submissions]
                  .sort((a, b) => b.round - a.round) // Ordenar por ronda descendente
                  .find(sub => sub.result) : null; // Encontrar la primera que tenga resultado
              const userLastResult = userLastSubmission?.result;
              const roundData = userLastSubmission ? gameData.rounds[userLastSubmission.round] : null;
              
              console.log('🔍 Message search debug:', {
                userLastSubmission,
                userLastResult,
                roundData: roundData ? 'Found' : 'Not found'
              });
              
              if (userLastResult && roundData) {
                const hasMessages = userLastResult.messageA || userLastResult.messageB;
                console.log('🔍 Checking user messages:', {
                  round: userLastSubmission.round,
                  hasMessages,
                  messageA: userLastResult.messageA,
                  messageB: userLastResult.messageB,
                  allocation: userLastSubmission?.allocation
                });
                
                if (!hasMessages) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800">
                        ⚠️ No se encontraron mensajes educativos para la ronda {lastCompletedRound}.
                        Esto puede indicar un problema con el procesamiento de resultados.
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 shadow-inner">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">📝</span>
                      Resultados de tu última inversión - Ronda {lastCompletedRound}
                    </h3>
                    <div className="space-y-3">
                      {userLastResult.messageA && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-gray-700">
                              🏳️ {roundData.countries.A.name}
                            </span>
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                              userLastResult.outcomeA === 'success' ? 'bg-green-100 text-green-700' :
                              userLastResult.outcomeA === 'fail' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {userLastResult.outcomeA === 'success' ? 'Éxito' :
                               userLastResult.outcomeA === 'fail' ? 'Pérdida' :
                               'Expropiación'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{userLastResult.messageA}</p>
                        </div>
                      )}
                      {userLastResult.messageB && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-gray-700">
                              🏳️ {roundData.countries.B.name}
                            </span>
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                              userLastResult.outcomeB === 'success' ? 'bg-green-100 text-green-700' :
                              userLastResult.outcomeB === 'fail' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {userLastResult.outcomeB === 'success' ? 'Éxito' :
                               userLastResult.outcomeB === 'fail' ? 'Pérdida' :
                               'Expropiación'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{userLastResult.messageB}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Resultado neto:</span>
                        <span className={`font-bold text-lg ${
                          userLastResult.netGain >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {userLastResult.netGain >= 0 ? '+' : ''}${Math.round(userLastResult.netGain)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              {/* Error de procesamiento */}
              {processingError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Error de Procesamiento</h3>
                  <p className="text-red-700 text-sm">{processingError}</p>
                  <button
                    onClick={() => {
                      setProcessingError(null);
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    🔄 Reintentar
                  </button>
                </div>
              )}
              
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
                  {isAdmin ? (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        🎮 Controles de Admin
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleProcessAndContinue}
                          disabled={processingResults || startingNextRound}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {processingResults || startingNextRound ? 
                            '⏳ Procesando...' : 
                            '🚀 Continuar a Siguiente Ronda'
                          }
                        </button>
                        <p className="text-xs text-gray-600">
                          Esto procesará los resultados e iniciará la ronda {gameData.currentRound + 1}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Esperando al profesor...</p>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-lg font-medium text-gray-700">
                          El profesor iniciará la siguiente ronda
                        </p>
                      </div>
                    </div>
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

                  // Obtener la submission más reciente con resultado
                  const lastSubmission = player.submissions && Array.isArray(player.submissions) ? 
                    [...player.submissions]
                      .sort((a, b) => b.round - a.round)
                      .find(sub => sub.result) : null;
                  const lastResult = lastSubmission?.result;
                  const currentRound = gameData.rounds[lastCompletedRound];

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
                            <p className="text-sm text-gray-600">Capital: ${player.capital} USD</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {lastResult && (
                            <p className={`text-sm font-medium ${
                              lastResult.netGain >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {lastResult.netGain >= 0 ? '+' : ''}${Math.round(lastResult.netGain)} USD
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Investment Feedback Messages - Show for ALL players */}
                      {lastResult && (
                        <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                          player.uid === currentUser.uid 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'bg-gray-50 border-gray-300'
                        }`}>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            📊 {player.uid === currentUser.uid ? 'Análisis de tu inversión:' : `Análisis de ${player.name}:`}
                          </h4>
                          {(lastResult.messageA || lastResult.messageB) ? (
                            <>
                              {lastResult.messageA && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-600">{currentRound.countries.A.name}:</span>
                                  <p className="text-xs text-gray-700 leading-relaxed">{lastResult.messageA}</p>
                                </div>
                              )}
                              {lastResult.messageB && (
                                <div className={lastResult.messageA ? '' : ''}>
                                  <span className="text-xs font-medium text-gray-600">{currentRound.countries.B.name}:</span>
                                  <p className="text-xs text-gray-700 leading-relaxed">{lastResult.messageB}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No hay mensajes disponibles para esta ronda.</p>
                          )}
                        </div>
                      )}
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