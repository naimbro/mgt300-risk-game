import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudio } from '../lib/audio';

interface Player {
  id: string;
  name: string;
  capital: number;
}

export const Lobby = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const [userName] = useState(localStorage.getItem('userName') || 'Jugador');
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeToStart, setTimeToStart] = useState(30);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'starting' | 'started'>('waiting');
  
  useEffect(() => {
    // Simular otros jugadores
    const demoPlayers: Player[] = [
      { id: '1', name: userName, capital: 100 },
      { id: '2', name: 'Ana García', capital: 100 },
      { id: '3', name: 'Carlos López', capital: 100 },
      { id: '4', name: 'María Rodríguez', capital: 100 },
    ];
    setPlayers(demoPlayers);
    
    // Simular countdown
    const interval = setInterval(() => {
      setTimeToStart((prev) => {
        if (prev <= 1) {
          setGameStatus('starting');
          audio.playNewRound();
          setTimeout(() => {
            navigate(`/game/${gameId}/round`);
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameId, navigate, userName]);
  
  if (gameStatus === 'starting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">¡Iniciando el juego!</h2>
          <p className="text-gray-600">Preparando la primera ronda...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sala de Espera
            </h1>
            <p className="text-gray-600">
              Código de partida: <span className="font-mono font-bold">{localStorage.getItem('gameCode')}</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Jugadores Conectados ({players.length})
              </h2>
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {player.name} {player.name === userName && '(Tú)'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Capital: ${player.capital.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Información del Juego
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Tiempo para iniciar</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.floor(timeToStart / 60)}:{(timeToStart % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Reglas del Juego</h3>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Presupuesto inicial: $100 USD</li>
                    <li>• 10 rondas de inversión</li>
                    <li>• 2 minutos por ronda</li>
                    <li>• Elige entre 2 países por ronda</li>
                    <li>• Retornos basados en riesgo político</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800">Objetivo</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Maximiza tu capital al final de las 10 rondas. El jugador con más dinero gana.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/join')}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Salir del Juego
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};