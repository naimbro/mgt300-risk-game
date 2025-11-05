import type { Country } from '../types/game';

export interface RiskResult {
  success: boolean;
  returnRate: number;
  finalAmount: number;
  message: string;
  outcome: 'success' | 'fail' | 'expropiation';
}

// Generar mensaje personalizado según las características del país
const generatePersonalizedMessage = (
  country: Country, 
  outcome: 'success' | 'fail' | 'expropiation',
  _returnRate: number,
  random: number
): string => {
  const riskCategory = country.risk <= 3 ? 'bajo' : country.risk <= 6 ? 'medio' : 'alto';
  const returnCategory = country.baseReturn <= 0.07 ? 'conservador' : country.baseReturn <= 0.12 ? 'moderado' : 'alto';
  const riskPercent = Math.round(country.risk * 10);
  const returnPercent = Math.round(country.baseReturn * 100);
  const expropPercent = Math.round(country.expropriationProb * 100);
  
  if (outcome === 'success') {
    const successMessages = [
      `${country.name} mostró su potencial de retorno ${returnCategory} (${returnPercent}% esperado). Su riesgo político ${riskCategory} (${riskPercent}/100) se mantuvo controlado y tu inversión prosperó gracias a estabilidad institucional.`,
      `¡Inversión exitosa en ${country.name}! A pesar del riesgo político ${riskCategory}, las políticas económicas favorables y el crecimiento del ${Math.round(country.growth * 100)}% del PIB impulsaron tus retornos.`,
      `${country.name} demostró por qué es atractivo para inversores. Su retorno esperado del ${returnPercent}% se materializó gracias a reformas estructurales y estabilidad política relativa.`,
      `Tu apuesta por ${country.name} fue acertada. El país superó las expectativas con políticas pro-inversión que compensaron su nivel de riesgo político ${riskCategory} (${riskPercent}/100).`
    ];
    return successMessages[Math.floor(random * successMessages.length)];
  }
  
  if (outcome === 'fail') {
    const failMessages = [
      `${country.name} tiene retorno potencial ${returnCategory} (${returnPercent}%) pero su riesgo político ${riskCategory} (${riskPercent}/100) se materializó. Cambios regulatorios y protestas sociales afectaron tu inversión.`,
      `Tu inversión en ${country.name} fue impactada por su riesgo político ${riskCategory}. Incertidumbre política y tensiones institucionales redujeron los retornos esperados del ${returnPercent}%.`,
      `${country.name} experimentó volatilidad política típica de países con riesgo ${riskCategory} (${riskPercent}/100). Conflictos internos y políticas erráticas afectaron el clima de inversión.`,
      `El riesgo político de ${country.name} (${riskPercent}/100) se tradujo en pérdidas. A pesar del potencial de retorno del ${returnPercent}%, la inestabilidad institucional predominó.`
    ];
    return failMessages[Math.floor(random * failMessages.length)];
  }
  
  // Expropiación
  const expropriationMessages = [
    `¡Expropiación en ${country.name}! Con riesgo de expropiación del ${expropPercent}% y riesgo político ${riskCategory} (${riskPercent}/100), el gobierno nacionalizó tu inversión bajo políticas de "soberanía económica".`,
    `Desastre total en ${country.name}. Su alto riesgo de expropiación (${expropPercent}%) se materializó: el estado confiscó activos extranjeros sin compensación, típico de países con instituciones débiles.`,
    `${country.name} cumplió la pesadilla del inversor. Con riesgo político de ${riskPercent}/100 y probabilidad de expropiación del ${expropPercent}%, el gobierno cambió las reglas del juego y se apropió de tu inversión.`,
    `Crisis política en ${country.name}: el nuevo régimen expropió todas las inversiones extranjeras. Los ${expropPercent}% de probabilidad de expropiación se convirtieron en realidad.`
  ];
  return expropriationMessages[Math.floor(random * expropriationMessages.length)];
};

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
  const riskFactor = 0.6; // Peso del riesgo político
  const growthFactor = 0.3; // Peso del crecimiento económico
  const baseBonus = 0.2; // Bonus base para hacer el juego menos punitivo
  
  const normalizedGrowth = Math.max(0, Math.min(1, (country.growth + 0.05) / 0.15));
  const successProbability = (1 - country.risk / 10) * riskFactor + normalizedGrowth * growthFactor + baseBonus;
  
  // Usar la probabilidad de expropiación real del país
  const expropriationProbability = country.expropriationProb || 0;

  // Determinar resultado
  if (random1 < expropriationProbability) {
    // Expropiación total
    return {
      success: false,
      returnRate: -1,
      finalAmount: 0,
      message: generatePersonalizedMessage(country, 'expropiation', -1, random2),
      outcome: 'expropiation'
    };
  } else if (random1 < successProbability) {
    // Éxito
    const baseReturn = country.baseReturn;
    const riskPremium = (country.risk / 10) * 0.04; // Mayor riesgo = mayor retorno potencial (4% por punto de riesgo normalizado)
    const growthBonus = Math.max(0, country.growth) * 0.8;
    const volatility = 0.3 * (random2 - 0.5); // ±15% de volatilidad
    
    const totalReturn = baseReturn + riskPremium + growthBonus + volatility;
    const finalAmount = investment * (1 + Math.max(-0.5, totalReturn)); // Limitar pérdidas al 50% en éxito
    
    return {
      success: true,
      returnRate: totalReturn,
      finalAmount,
      message: generatePersonalizedMessage(country, 'success', totalReturn, random3),
      outcome: 'success'
    };
  } else {
    // Fallo
    const baseLoss = -0.1 - ((country.risk / 10) * 0.5); // -10% a -60% dependiendo del riesgo normalizado
    const economicFactor = Math.min(0, country.growth) * 2; // Crecimiento negativo empeora las pérdidas
    const volatility = 0.2 * (random2 - 0.5); // ±10% de volatilidad
    
    const totalLoss = baseLoss + economicFactor + volatility;
    const finalAmount = investment * (1 + Math.max(-0.8, totalLoss)); // Máximo 80% de pérdida
    
    return {
      success: false,
      returnRate: totalLoss,
      finalAmount,
      message: generatePersonalizedMessage(country, 'fail', totalLoss, random3),
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