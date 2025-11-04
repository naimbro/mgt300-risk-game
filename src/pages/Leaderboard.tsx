import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../lib/audio';
import { getGameState, isGameFinished } from '../lib/gameState';

interface Player {
  id: string;
  name: string;
  capital: number;
  position: number;
  change?: number;
}

export const Leaderboard = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const [userName] = useState(localStorage.getItem('userName') || 'Jugador');
  const [gameState, setGameState] = useState(getGameState());
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeToNextRound, setTimeToNextRound] = useState(15);
  const [gameEnded, setGameEnded] = useState(false);
  
  useEffect(() => {
    // Actualizar estado del juego
    const currentGameState = getGameState();
    setGameState(currentGameState);
    
    // Verificar si el juego ha terminado
    if (isGameFinished()) {
      setGameEnded(true);
      audio.playGameEnd();
      return;
    }
    
    // Calcular el cambio desde la ronda anterior (si existe)
    const lastRoundResult = currentGameState.roundHistory[currentGameState.roundHistory.length - 1];
    const change = lastRoundResult ? lastRoundResult.netGain : 0;
    
    // Simular otros jugadores con variaciones aleatorias basadas en la ronda actual
    const generateVariation = (base: number, round: number, seed: number) => {
      const variation = Math.sin(round * seed) * 0.1; // ±10% variation
      return Math.floor(base * (1 + variation));
    };
    
    const roundNumber = currentGameState.currentRound - 1; // La ronda que acabamos de completar
    
    const simulatedPlayers: Player[] = [
      {
        id: '1',
        name: userName,
        capital: currentGameState.capital,
        position: 1, // Se calculará después
        change: change
      },
      {
        id: '2',
        name: 'Ana García',
        capital: generateVariation(100000000, roundNumber, 1.1),
        position: 2,
        change: generateVariation(2000000, roundNumber, 1.2) - 2000000
      },
      {
        id: '3',
        name: 'Carlos López',
        capital: generateVariation(100000000, roundNumber, 0.9),
        position: 3,
        change: generateVariation(1500000, roundNumber, 0.8) - 1500000
      },
      {
        id: '4',
        name: 'María Rodríguez',
        capital: generateVariation(100000000, roundNumber, 1.3),
        position: 4,
        change: generateVariation(1800000, roundNumber, 1.1) - 1800000
      }
    ];
    
    // Ordenar por capital y asignar posiciones
    simulatedPlayers.sort((a, b) => b.capital - a.capital);
    simulatedPlayers.forEach((player, index) => {
      player.position = index + 1;
    });
    
    setPlayers(simulatedPlayers);
    
    // Timer para próxima ronda
    const interval = setInterval(() => {
      setTimeToNextRound((prev) => {
        if (prev <= 1) {
          if (currentGameState.currentRound > currentGameState.totalRounds) {
            setGameEnded(true);
            // Sonido de fin de juego
            audio.playGameEnd();
            return 0;
          } else {
            navigate(`/game/${gameId}/round`);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameId, navigate, userName, audio]);
  
  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };
  
  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };
  
  if (gameEnded) {
    const winner = players[0];
    const userPlayer = players.find(p => p.name === userName);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">¡Juego Terminado!</h1>
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">🏆 Ganador</h2>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <p className="text-3xl font-bold text-yellow-600">{winner.name}</p>
                <p className="text-xl text-gray-700">Capital final: ${winner.capital.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Tu Resultado</h3>
              <div className={`rounded-lg p-4 ${getPositionColor(userPlayer?.position || 4)}`}>
                <p className="font-bold">Posición: {userPlayer?.position}° lugar</p>
                <p>Capital final: ${userPlayer?.capital.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/join')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Jugar Nueva Partida
              </button>
              <button
                onClick={() => navigate(`/game/${gameId}/leaderboard`)}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
              >
                Ver Ranking Final
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Ranking - Ronda {gameState.currentRound - 1} de {gameState.totalRounds}
            </h1>
            <div className="bg-blue-50 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600">
                {gameState.currentRound > gameState.totalRounds ? 'Juego Terminado' : 'Próxima ronda en'}
              </p>
              {gameState.currentRound <= gameState.totalRounds && (
                <p className="text-2xl font-bold text-blue-600">{timeToNextRound}s</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-200 ${
                  player.name === userName 
                    ? 'border-blue-300 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPositionColor(player.position)}`}>
                    {getPositionEmoji(player.position)}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      {player.name} {player.name === userName && '(Tú)'}
                    </p>
                    <p className="text-sm text-gray-600">Posición #{player.position}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    ${player.capital.toLocaleString()}
                  </p>
                  {player.change && (
                    <p className={`text-sm font-medium ${
                      player.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.change >= 0 ? '+' : ''}${player.change.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
              
              {/* Mostrar historial de la última ronda */}
              {gameState.roundHistory.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">📊 Última Ronda:</h4>
                  {(() => {
                    const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1];
                    return (
                      <div className="text-sm text-gray-600">
                        <p>🌍 Países: {lastRound.countries.A} vs {lastRound.countries.B}</p>
                        <p>💰 Inversión Total: ${(lastRound.investment.A + lastRound.investment.B).toLocaleString()}</p>
                        <p className={lastRound.netGain >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          📈 Resultado: {lastRound.netGain >= 0 ? '+' : ''}${lastRound.netGain.toLocaleString()}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <button
              onClick={() => navigate('/join')}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Abandonar Juego
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};