import { useState } from 'react';

interface GameConfig {
  code: string;
  roundCount: number;
  roundDurationSec: number;
  mode: 'sync' | 'perUser';
}

export const Admin = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    code: '',
    roundCount: 5,
    roundDurationSec: 120,
    mode: 'sync'
  });
  const [loading, setLoading] = useState(false);
  const [gameCreated, setGameCreated] = useState(false);
  const [error, setError] = useState('');
  
  const generateGameCode = () => {
    const code = `MGT300-${Date.now().toString().slice(-4)}`;
    setGameConfig(prev => ({ ...prev, code }));
  };
  
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implementar creación real con Firebase Functions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Creating game with config:', gameConfig);
      setGameCreated(true);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Error al crear la partida');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartGame = () => {
    // TODO: Implementar inicio de partida
    console.log('Starting game:', gameConfig.code);
    alert('Funcionalidad en desarrollo');
  };
  
  if (gameCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-green-800 mb-4">
                ✅ Partida Creada Exitosamente
              </h1>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <p className="text-lg font-semibold text-green-800">Código de Partida</p>
                <p className="text-3xl font-bold text-green-600 font-mono">{gameConfig.code}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Configuración</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Rondas: {gameConfig.roundCount}</li>
                  <li>• Duración por ronda: {gameConfig.roundDurationSec}s</li>
                  <li>• Modo: {gameConfig.mode === 'sync' ? 'Sincronizado' : 'Por Usuario'}</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleStartGame}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
              >
                Iniciar Partida
              </button>
              <button
                onClick={() => {
                  setGameCreated(false);
                  setGameConfig({ code: '', roundCount: 5, roundDurationSec: 120, mode: 'sync' });
                }}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
              >
                Crear Nueva Partida
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Comparte el código <strong>{gameConfig.code}</strong> con tus estudiantes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Panel de Administración
          </h1>
          
          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Partida
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={gameConfig.code}
                  onChange={(e) => setGameConfig(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                  pattern="[A-Z0-9\-]{6,}"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="MGT300-XXXX"
                />
                <button
                  type="button"
                  onClick={generateGameCode}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  Generar
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Rondas
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={gameConfig.roundCount}
                onChange={(e) => setGameConfig(prev => ({ ...prev, roundCount: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración por Ronda (segundos)
              </label>
              <select
                value={gameConfig.roundDurationSec}
                onChange={(e) => setGameConfig(prev => ({ ...prev, roundDurationSec: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={60}>1 minuto</option>
                <option value={120}>2 minutos</option>
                <option value={180}>3 minutos</option>
                <option value={300}>5 minutos</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modo de Juego
              </label>
              <select
                value={gameConfig.mode}
                onChange={(e) => setGameConfig(prev => ({ ...prev, mode: e.target.value as 'sync' | 'perUser' }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sync">Sincronizado (todos ven los mismos países)</option>
                <option value="perUser">Por Usuario (países aleatorios por jugador)</option>
              </select>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? 'Creando Partida...' : 'Crear Partida'}
            </button>
          </form>
          
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Configura los parámetros de la partida</li>
              <li>2. Crea la partida y obtén el código</li>
              <li>3. Comparte el código con tus estudiantes</li>
              <li>4. Inicia la partida cuando todos estén conectados</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};