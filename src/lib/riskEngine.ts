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
  random: number,
  _investment?: number
): string => {
  const riskCategory = country.risk <= 3 ? 'bajo' : country.risk <= 6 ? 'medio' : 'alto';
  const returnPercent = Math.round(country.baseReturn * 100);
  const expropPercent = Math.round(country.expropriationProb * 100);
  
  if (outcome === 'success') {
    const successMessages = [
      `🎉 ¡Jackpot en ${country.name}! Tu investigación previa valió la pena. El país mantuvo estabilidad política (riesgo ${riskCategory}) y las reformas económicas impulsaron el crecimiento al ${Math.round(country.growth * 100)}%. ¡Tu cartera sonríe!`,
      `💰 ¡Excelente timing en ${country.name}! Aprovechaste una ventana de oportunidad: nuevos acuerdos comerciales, inversión en infraestructura y políticas fiscales favorables generaron retornos por encima del ${returnPercent}% esperado.`,
      `🚀 ${country.name} te recompensó por confiar en su potencial. A pesar del riesgo político ${riskCategory}, las elecciones trajeron estabilidad y el gobierno cumplió sus promesas de crecimiento. ¡Decisión ganadora!`,
      `📈 Tu apuesta estratégica en ${country.name} se materializó perfectamente. El descubrimiento de nuevos recursos naturales y la mejora en ratings crediticios internacionales dispararon los retornos. ¡Bien jugado!`,
      `✨ ${country.name} demostró que los mercados emergentes pueden sorprender positivamente. La digitalización de la economía y nuevas alianzas comerciales superaron todas las expectativas iniciales.`
    ];
    return successMessages[Math.floor(random * successMessages.length)];
  }
  
  if (outcome === 'fail') {
    const failMessages = [
      `😬 Tropezón en ${country.name}. El riesgo político ${riskCategory} se materializó: protestas masivas, cambios regulatorios inesperados y turbulencia en los mercados afectaron tu inversión. ¡Lección aprendida!`,
      `📉 ${country.name} te enseñó por qué se llaman "mercados volátiles". A pesar del potencial del ${returnPercent}%, escándalos de corrupción y tensiones geopolíticas redujeron los retornos. Es parte del juego.`,
      `⚠️ Tormenta perfecta en ${country.name}: elecciones controversiales, caída en precios de commodities y salida de capitales extranjeros crearon el ambiente perfecto para pérdidas. No todas las apuestas salen bien.`,
      `🌪️ ${country.name} experimentó turbulencia política que no viste venir. Cambios en el gabinete, nuevas regulaciones fiscales y huelgas generales golpearon el clima de inversión. A veces el riesgo se materializa.`,
      `📊 El análisis previo sobre ${country.name} no consideró el cisne negro: una crisis bancaria local y depreciación monetaria arrasaron con los retornos esperados. Esto es inversión real, no simulación.`
    ];
    return failMessages[Math.floor(random * failMessages.length)];
  }
  
  // Expropiación
  const expropriationMessages = [
    `💥 ¡GAME OVER en ${country.name}! El nuevo presidente declaró: "Los recursos pertenecen al pueblo" y nacionalizó todas las inversiones extranjeras. Tu ${expropPercent}% de riesgo de expropiación se convirtió en 100% de realidad. ¡Ouch!`,
    `🎭 Plot twist dramático en ${country.name}: un golpe de estado militar cambió las reglas del juego. El nuevo régimen confiscó todos los activos extranjeros "para proteger la soberanía nacional". Tu inversión se esfumó en el aire.`,
    `⚡ Breaking news desde ${country.name}: "Gobierno anuncia la nacionalización del sector donde invertiste". Las advertencias sobre ${expropPercent}% de riesgo de expropiación no eran solo estadísticas. ¡La política puede ser brutal!`,
    `🌋 Erupción política en ${country.name}: nueva constitución declara ilegales las inversiones extranjeras en sectores estratégicos. Tu investigación previa mencionaba el riesgo ${riskCategory}, pero esperabas que no pasara. ¡Sorpresa!`,
    `🎪 El circo político de ${country.name} terminó con tu inversión como víctima colateral. Entre protestas populistas y nacionalismo económico, el gobierno decidió que tu dinero ahora es del Estado. Lección dura aprendida.`
  ];
  return expropriationMessages[Math.floor(random * expropriationMessages.length)];
};

export const calculateInvestmentResult = (
  country: Country,
  investment: number,
  roundSeed: string
): RiskResult => {
  if (investment === 0) {
    const noInvestMessages = [
      `Decidiste no invertir en ${country.name}. ¿Una decisión cautelosa o una oportunidad perdida? Solo el tiempo lo dirá.`,
      `Pasaste de largo en ${country.name}. A veces no arriesgar también es una estrategia.`,
      `${country.name} quedó fuera de tu portafolio. La diversificación es clave, pero ¿fue la decisión correcta?`,
      `No pusiste dinero en ${country.name}. En inversión, no hacer nada también cuenta como una decisión.`
    ];
    const randomIndex = Math.floor(seededRandom(hashString(roundSeed + country.iso2)) * noInvestMessages.length);
    return {
      success: true,
      returnRate: 0,
      finalAmount: 0,
      message: noInvestMessages[randomIndex],
      outcome: 'success'
    };
  }

  // Seed determinista por ronda, jugador y país. No incluye el monto: si lo
  // incluyera, se podría probar montos en la consola hasta dar con uno ganador.
  const seed = hashString(roundSeed + country.iso2);
  const random1 = seededRandom(seed);
  const random2 = seededRandom(seed + 1);
  const random3 = seededRandom(seed + 2);

  // Calcular probabilidad de éxito (rebalanceado para mayor realismo)
  const riskFactor = 0.8; // Peso del riesgo político (aumentado para mayor impacto)
  const growthFactor = 0.3; // Peso del crecimiento económico
  const baseBonus = 0.15; // Bonus base reducido (era demasiado alto)
  
  const normalizedGrowth = Math.max(0, Math.min(1, (country.growth + 0.05) / 0.15));
  const successProbability = (1 - country.risk / 10) * riskFactor + normalizedGrowth * growthFactor + baseBonus;
  
  // Usar la probabilidad de expropiación real del país
  const expropriationProbability = country.expropriationProb || 0;

  // Determinar resultado usando rangos no superpuestos
  if (random1 < expropriationProbability) {
    // Expropiación total
    return {
      success: false,
      returnRate: -1,
      finalAmount: 0,
      message: generatePersonalizedMessage(country, 'expropiation', -1, random2, investment),
      outcome: 'expropiation'
    };
  } else if (random1 < expropriationProbability + successProbability) {
    // Éxito
    const baseReturn = country.baseReturn;
    const riskPremium = (country.risk / 10) * 0.04; // Mayor riesgo = mayor retorno potencial (4% por punto de riesgo normalizado)
    const growthBonus = Math.max(0, country.growth) * 0.8;
    const volatility = 0.3 * (random2 - 0.5); // ±15% de volatilidad
    
    const totalReturn = baseReturn + riskPremium + growthBonus + volatility;
    const finalAmount = Math.round(investment * (1 + Math.max(-0.5, totalReturn))); // Limitar pérdidas al 50% en éxito
    
    return {
      success: true,
      returnRate: totalReturn,
      finalAmount,
      message: generatePersonalizedMessage(country, 'success', totalReturn, random3, investment),
      outcome: 'success'
    };
  } else {
    // Fallo
    const baseLoss = -0.15 - ((country.risk / 10) * 0.4); // -15% a -55% dependiendo del riesgo
    const economicFactor = Math.min(0, country.growth) * 1.5; // Crecimiento negativo empeora las pérdidas
    const volatility = 0.25 * (random2 - 0.5); // ±12.5% de volatilidad
    
    const totalLoss = baseLoss + economicFactor + volatility;
    const finalAmount = Math.round(investment * (1 + Math.max(-0.75, totalLoss))); // Máximo 75% de pérdida
    
    return {
      success: false,
      returnRate: totalLoss,
      finalAmount,
      message: generatePersonalizedMessage(country, 'fail', totalLoss, random3, investment),
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