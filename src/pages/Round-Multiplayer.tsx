import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CountryCard } from '../components/CountryCard';
import { Timer } from '../components/Timer';
import { useAudio } from '../lib/audio';
import { useGame } from '../hooks/useGame';

export const Round = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const { 
    gameData, 
    currentUser, 
    currentRound,
    hasSubmitted,
    submitInvestment,
    loading,
    error 
  } = useGame(gameId);

  const [allocation, setAllocation] = useState({ A: 0, B: 0 });
  const [submitted, setSubmitted] = useState(false);

  // Solo navegar si no hay ronda activa (no navegar si ya envió - esperar a otros)
  useEffect(() => {
    if (!loading && gameData) {
      // Si no hay ronda activa o ya terminó, ir al leaderboard
      if (!currentRound || !currentRound.isActive) {
        console.log('📊 Round finished/inactive, navigating to leaderboard');
        navigate(`/game/${gameId}/leaderboard`);
      }
    }
  }, [gameData, currentRound, loading, navigate, gameId]);

  // Marcar como enviado si ya envió (navegación se maneja arriba)
  useEffect(() => {
    if (hasSubmitted && !submitted) {
      setSubmitted(true);
    }
  }, [hasSubmitted, submitted]);

  const handleAllocationChange = (country: 'A' | 'B', value: number) => {
    if (submitted) return;
    
    const currentCapital = currentUser?.capital || 100000000;
    const maxValue = currentCapital - allocation[country === 'A' ? 'B' : 'A'];
    const clampedValue = Math.min(Math.max(0, value), maxValue);
    
    setAllocation(prev => ({
      ...prev,
      [country]: clampedValue
    }));
  };

  const handleSubmit = async () => {
    if (submitted || !currentRound) return;
    
    try {
      console.log('💰 Submitting investment:', allocation);
      audio.playInvestmentConfirm();
      
      await submitInvestment(allocation);
      
      setSubmitted(true);
      console.log('✅ Investment submitted, waiting for others or round end');
      
    } catch (err) {
      console.error('Error submitting investment:', err);
    }
  };

  const handleTimeExpire = () => {
    if (!submitted) {
      handleSubmit();
    }
  };

  if (loading || !currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ronda {gameData?.currentRound}...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">No estás en esta partida</h2>
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }


  const totalAllocated = allocation.A + allocation.B;
  const remaining = currentUser.capital - totalAllocated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Ronda {gameData?.currentRound} de {gameData?.totalRounds}
              </h1>
              <p className="text-gray-600">Jugador: {currentUser.name}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tiempo restante</p>
              <Timer 
                endTime={currentRound.endTime.toDate()} 
                onExpire={handleTimeExpire}
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Capital disponible</p>
              <p className="text-xl font-bold text-green-600">
                ${remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Countries */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CountryCard
            country={currentRound.countries.A}
            label="A"
            allocation={allocation.A}
            onAllocationChange={(value) => handleAllocationChange('A', value)}
            disabled={submitted}
          />
          <CountryCard
            country={currentRound.countries.B}
            label="B"
            allocation={allocation.B}
            onAllocationChange={(value) => handleAllocationChange('B', value)}
            disabled={submitted}
          />
        </div>
        
        {/* Investment Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Inversión</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Invertido</p>
              <p className="text-xl font-bold text-blue-600">
                ${totalAllocated.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Sin Invertir</p>
              <p className="text-xl font-bold text-green-600">
                ${remaining.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Capital Total</p>
              <p className="text-xl font-bold text-gray-800">
                ${currentUser.capital.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={submitted || totalAllocated === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {submitted ? '✅ Enviado' : '💰 Confirmar Inversión'}
          </button>
          {totalAllocated === 0 && !submitted && (
            <p className="text-red-600 text-sm mt-2">
              Debes invertir al menos algo de dinero
            </p>
          )}
        </div>

        {/* Waiting State - Show after submission */}
        {submitted && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ¡Inversión Enviada! ✅
            </h3>
            <div className="text-left bg-white p-4 rounded-lg mb-4 max-w-md mx-auto">
              <p className="text-gray-700">
                <span className="font-semibold">{currentRound.countries.A.name}:</span> ${allocation.A.toLocaleString()}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-semibold">{currentRound.countries.B.name}:</span> ${allocation.B.toLocaleString()}
              </p>
              <p className="text-gray-700 mt-2 pt-2 border-t border-gray-200 font-bold">
                Total: ${(allocation.A + allocation.B).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm">
                Esperando a que todos los jugadores envíen sus inversiones...
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              La ronda terminará automáticamente cuando expire el tiempo o cuando todos hayan enviado
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};