import type { Indicadores, Mitigacion, Pais, Region, SenalAplicada, TipoEvento } from './tipos';

// Modelo de retorno de invertir en un país durante una ronda (un "año"):
//
//   retorno = mercado + Σ impacto de eventos políticos + lo que devuelve el seguro − costos
//   mercado = μ + β·G + R_región + ε
//
// - G y R_región son shocks compartidos: diversificar entre regiones protege más
//   que diversificar dentro de una misma región.
// - Las probabilidades de eventos salen de indicadores públicos (WGI, V-Dem,
//   rating S&P) con fórmulas que el juego muestra.
// - μ se fija para que el retorno ESPERADO suba con el riesgo: el riesgo se paga
//   en promedio, pero con más volatilidad y colas gruesas. En la versión 2025
//   pasaba lo contrario (más riesgo = menos retorno), y eso enseñaba mal.
// - Todo es aditivo, así que el retorno esperado declarado es exacto.

export const PARAMETROS = {
  tasaLibreDeRiesgo: 0.03,
  primaPorPuntoDeRiesgo: 0.013,
  sigmaGlobal: 0.06,
  sigmaRegional: 0.05,
  betaBase: 0.6,
  betaPorPunto: 0.08,
  sigmaIdioBase: 0.04,
  sigmaIdioPorPunto: 0.012,

  /** Puntaje WGI que cuenta como gobernanza "de primer nivel" y como "débil". */
  wgiAlto: 85,
  wgiBajo: 40,

  impacto: {
    expropiacion: -0.7,
    regulacion: -0.2,
    conflicto_social: -0.25,
    controles_capital: -0.3,
    geopolitica: -0.2,
    violencia: -0.35,
    reforma: 0.12,
  } satisfies Record<TipoEvento, number>,

  /**
   * Qué cubre el seguro, como MIGA: expropiación, inconvertibilidad y violencia
   * política. NO cubre cambios regulatorios de aplicación general, aranceles ni
   * conflictos por licencia social (Convenio MIGA, art. 11).
   */
  coberturaSeguro: { expropiacion: 0.9, controles_capital: 0.9, violencia: 0.9 } as Partial<Record<TipoEvento, number>>,
  /** Prima = mínimo + 1,3 × pérdida esperada cubierta (base). Sin alertas cuesta un poco más de lo que devuelve: sirve para acotar la cola, y rinde cuando el informe advierte un riesgo que el precio no incluye. */
  primaSeguroMinima: 0.004,
  primaSeguroCarga: 1.3,

  /** Relación con la comunidad: costo fijo; reduce el daño de un conflicto social y, menos, de un cambio regulatorio. */
  costoComunidad: 0.03,
  mitigacionComunidadConflicto: 0.6,
  mitigacionComunidadRegulacion: 0.25,

  /** Tras un evento negativo, el país queda más inestable la ronda siguiente. */
  persistencia: 1.3,
  probabilidadMaxima: 0.6,
} as const;

export const TIPOS_NEGATIVOS: TipoEvento[] = [
  'expropiacion',
  'regulacion',
  'conflicto_social',
  'controles_capital',
  'geopolitica',
  'violencia',
];
export const TIPOS_EVENTO: TipoEvento[] = [...TIPOS_NEGATIVOS, 'reforma'];

/** Puntaje WGI llevado a 0 (débil, ≤40) – 1 (primer nivel, ≥85). */
export function gobernanza(puntaje: number): number {
  return Math.min(1, Math.max(0, (puntaje - PARAMETROS.wgiBajo) / (PARAMETROS.wgiAlto - PARAMETROS.wgiBajo)));
}

/** Riesgo político 0-10: cuánto le falta al promedio de estabilidad, regulación y derecho para ser de primer nivel. */
export function riesgoPais(ind: Indicadores): number {
  const g = (gobernanza(ind.estabilidadPolitica) + gobernanza(ind.calidadRegulatoria) + gobernanza(ind.estadoDeDerecho)) / 3;
  return Math.round(10 * (1 - g) * 10) / 10;
}

/** Probabilidad base de cada evento en una ronda. Cada fórmula se puede explicar en una línea. */
export function probabilidadesBase(ind: Indicadores): Record<TipoEvento, number> {
  const sinDerecho = 1 - gobernanza(ind.estadoDeDerecho);
  const inestable = 1 - gobernanza(ind.estabilidadPolitica);
  return {
    // Jensen (2008): los contrapesos democráticos reducen el riesgo de expropiación.
    expropiacion: 0.08 * sinDerecho * sinDerecho * (1.5 - ind.democraciaLiberal),
    regulacion: 0.04 + 0.25 * (1 - gobernanza(ind.calidadRegulatoria)),
    conflicto_social: 0.03 + 0.2 * inestable,
    controles_capital: 0.01 + 0.3 * (1 - ind.solvencia) ** 2,
    geopolitica: 0.2 * ind.exposicionGeopolitica,
    violencia: 0.01 + 0.06 * inestable + 0.15 * ind.exposicionConflictoArmado,
    reforma: 0.08,
  };
}

export interface ContextoRonda {
  senales: SenalAplicada[];
  /** Países que tuvieron un evento negativo la ronda anterior. */
  inestablesRondaAnterior: string[];
}

export const CONTEXTO_VACIO: ContextoRonda = { senales: [], inestablesRondaAnterior: [] };

/** Probabilidades de esta ronda: base × señales del informe × persistencia. */
export function probabilidadesRonda(pais: Pais, ctx: ContextoRonda): Record<TipoEvento, number> {
  const p = probabilidadesBase(pais.indicadores);
  const inestable = ctx.inestablesRondaAnterior.includes(pais.iso2);
  for (const tipo of TIPOS_EVENTO) {
    let v = p[tipo];
    if (inestable && tipo !== 'reforma') v *= PARAMETROS.persistencia;
    for (const s of ctx.senales) {
      const m = s.iso2 === pais.iso2 ? s.multiplicadores[tipo] : undefined;
      if (m !== undefined) v *= m;
    }
    p[tipo] = Math.min(PARAMETROS.probabilidadMaxima, v);
  }
  return p;
}

export function beta(pais: Pais): number {
  return PARAMETROS.betaBase + PARAMETROS.betaPorPunto * riesgoPais(pais.indicadores);
}

export function sigmaIdiosincratico(pais: Pais): number {
  return PARAMETROS.sigmaIdioBase + PARAMETROS.sigmaIdioPorPunto * riesgoPais(pais.indicadores);
}

/** Retorno esperado de un país sin mitigación: tasa libre de riesgo + prima por riesgo. */
export function retornoEsperado(pais: Pais): number {
  return PARAMETROS.tasaLibreDeRiesgo + PARAMETROS.primaPorPuntoDeRiesgo * riesgoPais(pais.indicadores);
}

/**
 * Componente de mercado esperado. Se calcula con probabilidades BASE: las señales
 * y la persistencia mueven el riesgo del año sin mover el precio, y eso es
 * justamente lo que premia leer el informe.
 */
export function mu(pais: Pais): number {
  const p = probabilidadesBase(pais.indicadores);
  return retornoEsperado(pais) - TIPOS_EVENTO.reduce((s, t) => s + p[t] * PARAMETROS.impacto[t], 0);
}

/** Prima del seguro como fracción del monto. Depende del país (base), no del año. */
export function primaSeguro(pais: Pais): number | null {
  if (!pais.seguroDisponible) return null;
  const p = probabilidadesBase(pais.indicadores);
  let perdidaCubierta = 0;
  for (const [tipo, cobertura] of Object.entries(PARAMETROS.coberturaSeguro) as [TipoEvento, number][]) {
    perdidaCubierta += p[tipo] * -PARAMETROS.impacto[tipo] * cobertura;
  }
  return Math.round((PARAMETROS.primaSeguroMinima + PARAMETROS.primaSeguroCarga * perdidaCubierta) * 1000) / 1000;
}

export function costoMitigacion(pais: Pais, m: Mitigacion | undefined): number {
  if (!m) return 0;
  const prima = m.seguro ? (primaSeguro(pais) ?? 0) : 0;
  return prima + (m.comunidad ? PARAMETROS.costoComunidad : 0);
}

export const REGIONES: Region[] = ['norteamerica', 'europa', 'latam', 'asia', 'golfo'];
