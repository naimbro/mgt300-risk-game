import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CountryCard } from '../components/CountryCard';
import { Timer } from '../components/Timer';
import type { Country } from '../types/game';
import { getGameState, addRoundResult, isGameFinished } from '../lib/gameState';
import { calculateInvestmentResult } from '../lib/riskEngine';
import { useAudio } from '../lib/audio';
import countriesData from '../data/countries.json';

export const Round = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const audio = useAudio();
  const [userName] = useState(localStorage.getItem('userName') || 'Jugador');
  const [gameState, setGameState] = useState(getGameState());
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos
  const [countries, setCountries] = useState<{ A: Country; B: Country } | null>(null);
  const [allocation, setAllocation] = useState({ A: 0, B: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('🎮 Round useEffect started');
    
    try {
      // Usar países del JSON pero de forma más segura
      const safeCountriesData = countriesData.slice(0, 8); // Solo los primeros 8
      const shuffled = [...safeCountriesData].sort(() => Math.random() - 0.5);
      
      setCountries({
        A: shuffled[0] as Country,
        B: shuffled[1] as Country
      });
      
      console.log('✅ Countries set:', shuffled[0]?.name, 'vs', shuffled[1]?.name);
      
      // Timer simple
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1 && !submitted) {
            console.log('⏰ Time expired, auto-submitting');
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
      
    } catch (error) {
      console.error('❌ Error in Round useEffect:', error);
      // Fallback a países básicos
      setCountries({
        A: { iso2: 'US', name: 'Estados Unidos', risk: 0.20, growth: 0.020, baseReturn: 0.04 },
        B: { iso2: 'MX', name: 'México', risk: 0.65, growth: 0.032, baseReturn: 0.09 }
      } as { A: Country; B: Country });
    }
  }, [submitted]);
  
  const handleAllocationChange = (country: 'A' | 'B', value: number) => {
    const currentCapital = gameState?.capital || 100000000; // Fallback seguro
    const maxValue = currentCapital - allocation[country === 'A' ? 'B' : 'A'];
    const clampedValue = Math.min(Math.max(0, value), maxValue);
    
    setAllocation(prev => ({
      ...prev,
      [country]: clampedValue
    }));
  };
  
  const handleSubmit = async () => {
    if (submitted) return;
    
    console.log('💰 Investment submitted!', allocation);
    
    // Sonido simplificado
    audio.playInvestmentConfirm();
    
    setSubmitted(true);
    
    // Resultado simplificado
    const totalInvested = allocation.A + allocation.B;
    const randomGain = Math.random() > 0.5 ? 
      Math.floor(totalInvested * 0.1) : // +10%
      -Math.floor(totalInvested * 0.05); // -5%
    
    try {
      console.log('💰 Calculating advanced results...');
      
      // Calcular resultado usando el motor de riesgo
      if (!countries) throw new Error('Countries not available');
      
      const resultA = allocation.A > 0 ? calculateInvestmentResult(countries.A, allocation.A, `${gameState.currentRound}-A`) : { finalAmount: 0, outcome: 'success' as const };
      const resultB = allocation.B > 0 ? calculateInvestmentResult(countries.B, allocation.B, `${gameState.currentRound}-B`) : { finalAmount: 0, outcome: 'success' as const };
      
      // Validar que no haya NaN
      const safePayoutA = isNaN(resultA.finalAmount) ? 0 : resultA.finalAmount;
      const safePayoutB = isNaN(resultB.finalAmount) ? 0 : resultB.finalAmount;
      
      const totalPayout = safePayoutA + safePayoutB;
      const remainingCapital = gameState.capital - totalInvested;
      const newCapital = remainingCapital + totalPayout;
      const netGain = totalPayout - totalInvested;
      
      console.log('📊 Risk engine results:', { 
        resultA: { amount: safePayoutA, outcome: resultA.outcome },
        resultB: { amount: safePayoutB, outcome: resultB.outcome },
        totalPayout, 
        netGain, 
        newCapital 
      });
      
      // Actualizar estado del juego
      const updatedState = addRoundResult({
        investment: { A: allocation.A, B: allocation.B },
        countries: { A: countries.A.name, B: countries.B.name },
        payout: totalPayout,
        netGain: netGain,
        finalCapital: newCapital
      });
      
      setGameState(updatedState);
      
      // Mostrar resultado con información de expropiación
      const hasExpropriation = resultA.outcome === 'expropiation' || resultB.outcome === 'expropiation';
      const expropriationInfo = hasExpropriation ? '\n⚠️ ¡Expropiación!' : '';
      
      // Sonidos según resultado
      if (hasExpropriation) {
        audio.playExpropriation();
      } else if (netGain > 0) {
        audio.playSuccess();
      } else {
        audio.playFailure();
      }
      
      setRoundResult(`Inversión: $${totalInvested.toLocaleString()}\nRetorno: $${totalPayout.toLocaleString()}\nGanancia: ${netGain >= 0 ? '+' : ''}$${netGain.toLocaleString()}${expropriationInfo}`);
      
      console.log('✅ Advanced round result calculated:', { netGain, newCapital, round: updatedState.currentRound });
      
    } catch (error) {
      console.error('❌ Error calculating investment result:', error);
      // Fallback a resultado simple
      setRoundResult(`Inversión: $${totalInvested.toLocaleString()}\nResultado: ${randomGain >= 0 ? '+' : ''}$${randomGain.toLocaleString()}`);
      console.log('⚠️ Using fallback result');
    }
    
    // Navegar al leaderboard después de 3 segundos
    setTimeout(() => {
      console.log('🔄 Navigating to leaderboard');
      navigate(`/game/${gameId}/leaderboard`);
    }, 3000);
  };
  
  
  if (!countries) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando ronda {gameState.currentRound}...</p>
          <p className="text-sm text-gray-500 mt-2">Capital: ${gameState.capital.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  
  if (submitted && roundResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultado de la Ronda {gameState.currentRound}</h2>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{roundResult}</pre>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">
            {isGameFinished() ? 'Cargando resultados finales...' : 'Cargando siguiente ronda...'}
          </p>
        </div>
      </div>
    );
  }
  
  const totalAllocated = allocation.A + allocation.B;
  const remaining = gameState.capital - totalAllocated;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ronda {gameState.currentRound} de {gameState.totalRounds}</h1>
              <p className="text-gray-600">Jugador: {userName}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tiempo restante</p>
              <Timer 
                endTime={new Date(Date.now() + timeLeft * 1000)} 
                onExpire={handleSubmit}
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Capital disponible</p>
              <p className="text-xl font-bold text-green-600">${remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Countries */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <CountryCard
            country={countries.A}
            label="A"
            allocation={allocation.A}
            onAllocationChange={(value) => handleAllocationChange('A', value)}
            disabled={submitted}
          />
          <CountryCard
            country={countries.B}
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
              <p className="text-xl font-bold text-blue-600">${totalAllocated.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Sin Invertir</p>
              <p className="text-xl font-bold text-green-600">${remaining.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Capital Total</p>
              <p className="text-xl font-bold text-gray-800">${gameState.capital.toLocaleString()}</p>
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
            <p className="text-red-600 text-sm mt-2">Debes invertir al menos algo de dinero</p>
          )}
        </div>
      </div>
    </div>
  );
};