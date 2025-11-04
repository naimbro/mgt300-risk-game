import type { Country } from '../types/game';

export interface RiskResult {
  success: boolean;
  returnRate: number;
  finalAmount: number;
  message: string;
  outcome: 'success' | 'fail' | 'expropiation';
}

// Mensajes de resultado por tipo
const successMessages = [
  "¡Excelente decisión! El país experimentó estabilidad política y crecimiento económico.",
  "Reformas pro-mercado impulsaron tus retornos significativamente.",
  "La estabilidad institucional y el crecimiento del PIB generaron ganancias sólidas.",
  "Condiciones favorables del mercado y baja volatilidad política beneficiaron tu inversión.",
  "El país mantuvo políticas económicas estables que favorecieron a los inversores extranjeros."
];

const failMessages = [
  "Cambios regulatorios inesperados redujeron los márgenes de ganancia.",
  "Protestas sociales y bloqueos logísticos afectaron la economía local.",
  "Incertidumbre política generó volatilidad en los mercados financieros.",
  "Políticas fiscales restrictivas impactaron negativamente el crecimiento.",
  "Tensiones geopolíticas crearon un ambiente desfavorable para la inversión."
];

const expropriationMessages = [
  "¡Desastre! El gobierno expropió tu inversión debido a cambios en la política nacionalista.",
  "Crisis política severa: el estado confiscó activos extranjeros, perdiste tu inversión.",
  "Golpe de estado: el nuevo régimen nacionalizó todas las inversiones extranjeras.",
  "Ley de emergencia económica: el gobierno requisó tu inversión para fondos públicos.",
  "Revolución popular: los activos extranjeros fueron expropiados por el nuevo gobierno."
];

export const calculateInvestmentResult = (
  country: Country,
  investment: number,
  roundSeed: string
): RiskResult => {
  if (investment === 0) {
    return {
      success: true,
      returnRate: 0,
      finalAmount: 0,
      message: "No invertiste en este país.",
      outcome: 'success'
    };
  }

  // Crear un seed determinista pero variable por ronda
  const seed = hashString(roundSeed + country.iso2 + investment.toString());
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  const random3 = seededRandom(seed + 2);

  // Calcular probabilidad de éxito
  const riskFactor = 0.7; // Peso del riesgo político
  const growthFactor = 0.3; // Peso del crecimiento económico
  
  const normalizedGrowth = Math.max(0, Math.min(1, (country.growth + 0.05) / 0.15));
  const successProbability = (1 - country.risk) * riskFactor + normalizedGrowth * growthFactor;
  
  // Probabilidad de expropiación para países de alto riesgo
  const expropriationThreshold = 0.8;
  const expropriationProbability = country.risk >= expropriationThreshold ? 
    0.15 * ((country.risk - expropriationThreshold) / (1 - expropriationThreshold)) : 0;

  // Determinar resultado
  if (random1 < expropriationProbability) {
    // Expropiación total
    return {
      success: false,
      returnRate: -1,
      finalAmount: 0,
      message: expropriationMessages[Math.floor(random2 * expropriationMessages.length)],
      outcome: 'expropiation'
    };
  } else if (random1 < successProbability) {
    // Éxito
    const baseReturn = country.baseReturn;
    const riskPremium = country.risk * 0.4; // Mayor riesgo = mayor retorno potencial
    const growthBonus = Math.max(0, country.growth) * 0.8;
    const volatility = 0.3 * (random2 - 0.5); // ±15% de volatilidad
    
    const totalReturn = baseReturn + riskPremium + growthBonus + volatility;
    const finalAmount = investment * (1 + Math.max(-0.5, totalReturn)); // Limitar pérdidas al 50% en éxito
    
    return {
      success: true,
      returnRate: totalReturn,
      finalAmount,
      message: successMessages[Math.floor(random3 * successMessages.length)],
      outcome: 'success'
    };
  } else {
    // Fallo
    const baseLoss = -0.1 - (country.risk * 0.5); // -10% a -60% dependiendo del riesgo
    const economicFactor = Math.min(0, country.growth) * 2; // Crecimiento negativo empeora las pérdidas
    const volatility = 0.2 * (random2 - 0.5); // ±10% de volatilidad
    
    const totalLoss = baseLoss + economicFactor + volatility;
    const finalAmount = investment * (1 + Math.max(-0.8, totalLoss)); // Máximo 80% de pérdida
    
    return {
      success: false,
      returnRate: totalLoss,
      finalAmount,
      message: failMessages[Math.floor(random3 * failMessages.length)],
      outcome: 'fail'
    };
  }
};

// Función hash simple para generar seeds deterministas
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generador de números pseudo-aleatorios con seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}