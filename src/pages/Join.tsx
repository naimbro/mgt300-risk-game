import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResetGameButton } from '../components/ResetGameButton';
import { useGame } from '../hooks/useGame';

export const Join = () => {
  const navigate = useNavigate();
  const { joinGame, createGame, loading, error, clearError } = useGame();
  const [displayName, setDisplayName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      // Unirse a partida real con Firebase
      const gameId = await joinGame(gameCode.toUpperCase(), displayName);
      
      // Guardar datos del usuario
      localStorage.setItem('userName', displayName);
      localStorage.setItem('gameCode', gameCode.toUpperCase());
      localStorage.setItem('gameId', gameId);
      
      console.log('✅ Joined game:', gameId);
      
      // Navegar al lobby
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      console.error('Error joining game:', err);
      // El error ya está manejado por el hook useGame
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      setIsCreatingGame(true);
      
      // Crear nueva partida
      const gameCode = await createGame(displayName);
      const gameId = `game_${gameCode.toLowerCase()}`;
      
      // Guardar datos del usuario
      localStorage.setItem('userName', displayName);
      localStorage.setItem('gameCode', gameCode);
      localStorage.setItem('gameId', gameId);
      
      console.log('🎮 Created game:', gameCode);
      
      // Navegar al lobby como admin
      navigate(`/game/${gameId}/lobby`);
    } catch (err) {
      console.error('Error creating game:', err);
      // El error ya está manejado por el hook useGame
    } finally {
      setIsCreatingGame(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Simulador de Inversión Global
        </h1>
        
        {/* Nombre del jugador */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu Nombre
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingresa tu nombre"
          />
        </div>

        {/* Opción 1: Unirse a partida existente */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">🎮 Unirse a Partida</h3>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              required
              pattern="[A-Z0-9]{6}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-center text-lg font-mono"
              placeholder="ABC123"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={loading || !displayName.trim() || !gameCode.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? 'Uniéndose...' : 'Unirse con Código'}
            </button>
          </form>
        </div>

        {/* Separador */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O</span>
          </div>
        </div>

        {/* Opción 2: Crear nueva partida */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">🚀 Crear Nueva Partida</h3>
          <p className="text-sm text-gray-600 mb-3">Como profesor, crea una partida para tus alumnos</p>
          <button
            onClick={handleCreateGame}
            disabled={isCreatingGame || loading || !displayName.trim()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isCreatingGame ? 'Creando Partida...' : '👩‍🏫 Crear Partida (Profesor)'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Presupuesto inicial: $100,000,000 USD</p>
          <p>Compite para obtener los mejores retornos</p>
          <div className="mt-4">
            <ResetGameButton onReset={() => window.location.reload()} />
          </div>
        </div>
      </div>
    </div>
  );
};