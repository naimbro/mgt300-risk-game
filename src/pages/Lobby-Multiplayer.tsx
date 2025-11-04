import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../lib/audio';
import { useGame } from '../hooks/useGame';

export const Lobby = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const { 
    gameData, 
    currentUser, 
    loading, 
    error, 
    isAdmin, 
    playerCount, 
    playersRanking,
    startGame,
    clearError 
  } = useGame(gameId);

  const [startingGame, setStartingGame] = useState(false);
  const [showGameCode, setShowGameCode] = useState(true);

  // Efectos de sonido y navegación
  useEffect(() => {
    if (!gameData) return;

    // Si el juego ya comenzó, ir a la ronda actual
    if (gameData.status === 'active') {
      console.log('🎮 Game is active, navigating to round');
      audio.playNewRound();
      navigate(`/game/${gameId}/round`);
    }
  }, [gameData, gameId, navigate, audio]);

  // Iniciar juego (solo admin)
  const handleStartGame = async () => {
    try {
      setStartingGame(true);
      clearError();
      
      console.log('🚀 Starting game...');
      await startGame();
      
      // El useEffect de arriba se encargará de la navegación
    } catch (err) {
      console.error('Error starting game:', err);
      setStartingGame(false);
    }
  };

  // Copiar código al portapapeles
  const copyGameCode = async () => {
    if (gameData?.code) {
      try {
        await navigator.clipboard.writeText(gameData.code);
        setShowGameCode(false);
        setTimeout(() => setShowGameCode(true), 2000);
      } catch (err) {
        console.log('Código:', gameData.code);
      }
    }
  };

  if (loading && !gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando al lobby...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Partida no encontrada</h1>
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header del lobby */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🏛️ Lobby de Inversión Global
            </h1>
            <p className="text-gray-600 mb-4">
              Esperando jugadores para comenzar la simulación
            </p>
            
            {/* Código de partida */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4 inline-block">
              <p className="text-sm text-gray-600 mb-2">Código de partida:</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl font-mono font-bold text-blue-600">
                  {gameData.code}
                </span>
                <button
                  onClick={copyGameCode}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition duration-200"
                >
                  {showGameCode ? '📋 Copiar' : '✅ Copiado'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Comparte este código con los estudiantes
              </p>
            </div>

            {/* Contador de jugadores */}
            <div className="flex justify-center items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{playerCount}</p>
                <p className="text-sm text-gray-600">Jugadores conectados</p>
              </div>
              
              {isAdmin && (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800">
                    {gameData.status === 'waiting' ? '⏳ Esperando' : '🎮 En juego'}
                  </p>
                  <p className="text-sm text-gray-600">Estado del juego</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de jugadores */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            👥 Jugadores en el lobby ({playerCount})
          </h2>
          
          <div className="grid gap-3">
            {playersRanking.map((player, index) => (
              <div
                key={player.uid}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                  player.uid === currentUser?.uid
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                } ${player.isAdmin ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    player.isAdmin ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {player.isAdmin ? '👨‍🏫' : `${index + 1}`}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {player.name}
                      {player.uid === currentUser?.uid && ' (Tú)'}
                      {player.isAdmin && ' (Profesor)'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Capital: ${player.capital.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    player.isAdmin 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {player.isAdmin ? 'Admin' : 'Jugador'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {playerCount === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay jugadores en el lobby aún...</p>
            </div>
          )}
        </div>

        {/* Controles de admin */}
        {isAdmin && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🎛️ Controles de Profesor</h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Jugadores mínimos recomendados</p>
                  <p className="text-2xl font-bold text-gray-800">2+</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Duración estimada</p>
                  <p className="text-2xl font-bold text-gray-800">15 min</p>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                disabled={startingGame || playerCount < 1}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition duration-200 ${
                  playerCount >= 1 && !startingGame
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {startingGame 
                  ? '🚀 Iniciando juego...' 
                  : playerCount < 1 
                    ? '⏳ Esperando jugadores...'
                    : `🎮 Iniciar Simulación (${playerCount} jugadores)`
                }
              </button>

              {playerCount >= 1 && (
                <p className="text-sm text-green-600 text-center">
                  ✅ Listo para comenzar
                </p>
              )}
            </div>
          </div>
        )}

        {/* Instrucciones para estudiantes */}
        {!isAdmin && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Instrucciones</h3>
            <div className="space-y-2 text-gray-700">
              <p>• Espera a que el profesor inicie la simulación</p>
              <p>• Tendrás $100,000,000 USD para invertir</p>
              <p>• Cada ronda: elige entre 2 países y decide cuánto invertir</p>
              <p>• Los retornos dependen del riesgo político y crecimiento económico</p>
              <p>• ¡Compite por el primer lugar!</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            Salir del lobby
          </button>
        </div>
      </div>
    </div>
  );
};