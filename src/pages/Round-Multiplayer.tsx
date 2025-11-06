import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CountryCard } from '../components/CountryCard';
import { Timer } from '../components/Timer';
import { useAudio } from '../lib/audio';
import { useGame } from '../hooks/useGame';
import { calculateInvestmentResult } from '../lib/riskEngine';

export const Round = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const { 
    gameData, 
    currentUser, 
    currentRound,
    hasSubmitted,
    allPlayersSubmitted,
    roundTimeExpired,
    shouldEndRound,
    isAdmin,
    processRoundResults,
    submitInvestment,
    loading,
    error 
  } = useGame(gameId);

  const [allocation, setAllocation] = useState({ A: 0, B: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [investmentResults, setInvestmentResults] = useState<{
    resultA?: any;
    resultB?: any;
    netGain?: number;
  } | null>(null);
  const [showingResults, setShowingResults] = useState(false);

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

  // Auto-procesamiento para admin cuando la ronda debe terminar
  useEffect(() => {
    if (shouldEndRound && isAdmin) {
      console.log('🔄 Round should end - auto-processing results...', {
        allPlayersSubmitted,
        roundTimeExpired,
        currentRound: gameData?.currentRound
      });
      
      // Dar un pequeño delay para que se actualice la UI
      const timer = setTimeout(() => {
        processRoundResults();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldEndRound, isAdmin, allPlayersSubmitted, roundTimeExpired, gameData?.currentRound, processRoundResults]);

  const handleAllocationChange = (country: 'A' | 'B', value: number) => {
    if (submitted) return;
    
    const currentCapital = currentUser?.capital || 100;
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
      
      // Primero enviamos la inversión
      await submitInvestment(allocation);
      
      // Calcular resultados inmediatamente (sin guardarlos en Firebase)
      if (allocation.A > 0 || allocation.B > 0) {
        const resultA = allocation.A > 0 ? 
          calculateInvestmentResult(currentRound.countries.A, allocation.A, `${gameData?.currentRound}-${currentUser?.uid}-A`) : null;
        const resultB = allocation.B > 0 ? 
          calculateInvestmentResult(currentRound.countries.B, allocation.B, `${gameData?.currentRound}-${currentUser?.uid}-B`) : null;
        
        const totalPayout = (resultA?.finalAmount || 0) + (resultB?.finalAmount || 0);
        const totalInvestment = allocation.A + allocation.B;
        const netGain = Math.round(totalPayout - totalInvestment);
        
        setInvestmentResults({
          resultA,
          resultB,
          netGain
        });
        setShowingResults(true);
        
        console.log('📊 Investment results calculated:', { resultA, resultB, netGain });
      }
      
      setSubmitted(true);
      console.log('✅ Investment submitted, showing results');
      
      // Dar tiempo mínimo para leer resultados si jugando solo
      if (Object.keys(gameData?.players || {}).length === 1) {
        setTimeout(() => {
          setShowingResults(false);
        }, 8000); // 8 segundos para leer cuando juegas solo
      }
      
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
        <div className="text-center space-y-4">
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
          
          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-3">👨‍🏫 Controles de Profesor</h3>
              <button
                onClick={() => {
                  // Procesar resultados directamente y ir al leaderboard
                  console.log('🔧 Professor forcing round end...');
                  processRoundResults().then(() => {
                    navigate(`/game/${gameId}/leaderboard`);
                  }).catch(err => {
                    console.error('Error forcing round end:', err);
                  });
                }}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all duration-200 text-sm"
              >
                ⏭️ Terminar Ronda Ahora
              </button>
              <p className="text-xs text-yellow-700 mt-2">
                Procesa resultados inmediatamente sin esperar timer o submissions
              </p>
            </div>
          )}
        </div>

        {/* Waiting State - Show after submission */}
        {submitted && (
          <div className="mt-6">
            {/* Investment Results - Show immediately after submission */}
            {showingResults && investmentResults && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 shadow-lg animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  📊 Resultados de tu Inversión
                </h3>
                
                {/* Results for each country */}
                <div className="space-y-4 mb-4">
                  {investmentResults.resultA && allocation.A > 0 && (
                    <div className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                      investmentResults.resultA.outcome === 'success' ? 'border-green-500' :
                      investmentResults.resultA.outcome === 'fail' ? 'border-red-500' :
                      'border-purple-500'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-700">
                          🏳️ {currentRound.countries.A.name}
                        </span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          investmentResults.resultA.outcome === 'success' ? 'bg-green-100 text-green-700' :
                          investmentResults.resultA.outcome === 'fail' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {investmentResults.resultA.outcome === 'success' ? '✅ Éxito' :
                           investmentResults.resultA.outcome === 'fail' ? '❌ Pérdida' :
                           '💥 Expropiación'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{investmentResults.resultA.message}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        Invertido: ${allocation.A} → Retorno: ${Math.round(investmentResults.resultA.finalAmount)}
                      </div>
                    </div>
                  )}
                  
                  {investmentResults.resultB && allocation.B > 0 && (
                    <div className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                      investmentResults.resultB.outcome === 'success' ? 'border-green-500' :
                      investmentResults.resultB.outcome === 'fail' ? 'border-red-500' :
                      'border-purple-500'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-700">
                          🏳️ {currentRound.countries.B.name}
                        </span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          investmentResults.resultB.outcome === 'success' ? 'bg-green-100 text-green-700' :
                          investmentResults.resultB.outcome === 'fail' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {investmentResults.resultB.outcome === 'success' ? '✅ Éxito' :
                           investmentResults.resultB.outcome === 'fail' ? '❌ Pérdida' :
                           '💥 Expropiación'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{investmentResults.resultB.message}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        Invertido: ${allocation.B} → Retorno: ${Math.round(investmentResults.resultB.finalAmount)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Total Result */}
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Resultado Total de la Ronda</p>
                  <p className={`text-2xl font-bold ${
                    (investmentResults.netGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(investmentResults.netGain || 0) >= 0 ? '+' : ''}${investmentResults.netGain || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Object.keys(gameData?.players || {}).length === 1 && 
                      'Los resultados se mostrarán por 8 segundos'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Summary after results or if not showing results */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
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
            
            {/* Estado del progreso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso de la ronda</span>
                <span>{Object.values(gameData?.players || {}).filter(p => 
                  p.submissions && Array.isArray(p.submissions) ? 
                    p.submissions.some(sub => sub.round === gameData?.currentRound) : false
                ).length} / {Object.keys(gameData?.players || {}).length} jugadores</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(Object.values(gameData?.players || {}).filter(p => 
                      p.submissions && Array.isArray(p.submissions) ? 
                        p.submissions.some(sub => sub.round === gameData?.currentRound) : false
                    ).length / Object.keys(gameData?.players || {}).length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Mensaje dinámico */}
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              {shouldEndRound ? (
                <>
                  <div className="animate-pulse">🔄</div>
                  <p className="text-sm font-medium">
                    {allPlayersSubmitted ? '¡Todos enviaron! Procesando resultados...' : 
                     roundTimeExpired ? '¡Tiempo terminado! Procesando resultados...' : 
                     'Procesando resultados...'}
                  </p>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm">
                    {allPlayersSubmitted ? 'Todos enviaron! Terminando ronda...' :
                     `Esperando a ${Object.keys(gameData?.players || {}).length - Object.values(gameData?.players || {}).filter(p => 
                       p.submissions && Array.isArray(p.submissions) ? 
                         p.submissions.some(sub => sub.round === gameData?.currentRound) : false
                     ).length} jugadores más...`}
                  </p>
                </>
              )}
            </div>
            
            {isAdmin && shouldEndRound && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                Como admin, procesarás automáticamente los resultados
              </p>
            )}
            </div>
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