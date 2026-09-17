// Tipos del motor. El motor es puro: no sabe de Firebase ni de React, así se
// puede testear y simular miles de partidas con el mismo código que usa el juego.

export type Region = 'norteamerica' | 'europa' | 'latam' | 'asia' | 'golfo';

export type TipoEvento =
  | 'expropiacion'
  | 'regulacion'
  | 'conflicto_social'
  | 'controles_capital'
  | 'geopolitica'
  | 'violencia'
  | 'reforma';

/** Indicadores públicos con los que se construye el perfil de riesgo. */
export interface Indicadores {
  /** WGI 2024, puntaje de gobernanza 0-100 (no es percentil). */
  estabilidadPolitica: number;
  calidadRegulatoria: number;
  estadoDeDerecho: number;
  /** V-Dem 2025, Índice de Democracia Liberal 0-1. */
  democraciaLiberal: number;
  /** Rating soberano S&P llevado a 0-1 (AAA = 1, CCC = 0,1). */
  solvencia: number;
  /** Exposición a aranceles, sanciones y controles a la exportación, 0-1. Juicio editorial documentado. */
  exposicionGeopolitica: number;
  /** Exposición a guerra o violencia armada que puede dañar activos, 0-1. Juicio editorial documentado. */
  exposicionConflictoArmado: number;
}

export interface Pais {
  iso2: string;
  nombre: string;
  region: Region;
  proyecto: string;
  indicadores: Indicadores;
  /** MIGA solo asegura inversiones en países miembros en desarrollo. */
  seguroDisponible: boolean;
}

export interface Mitigacion {
  /** Seguro de riesgo político (tipo MIGA). */
  seguro: boolean;
  /** Socio local y relación con la comunidad (licencia social). */
  comunidad: boolean;
}

/** Decisión de un jugador en una ronda: porcentaje del capital por país (el resto queda en caja). */
export interface Cartera {
  pesos: Record<string, number>; // iso2 -> 0..100
  mitigacion: Record<string, Mitigacion>;
}

/** Señal del informe previo: cambia de verdad las probabilidades de esta ronda. */
export interface SenalAplicada {
  id: string;
  iso2: string;
  multiplicadores: Partial<Record<TipoEvento, number>>;
}

export interface EventoOcurrido {
  iso2: string;
  tipo: TipoEvento;
}

/** Todo lo que pasó en el mundo en una ronda. Es igual para todo el curso. */
export interface Mundo {
  shockGlobal: number;
  shockRegional: Record<Region, number>;
  /** Componente propio de cada país (ruido idiosincrático). */
  ruido: Record<string, number>;
  eventos: EventoOcurrido[];
}

export interface ResultadoPais {
  iso2: string;
  monto: number;
  /** Retorno neto del país: mercado + eventos + seguro − costos de mitigación. */
  retorno: number;
  mercado: number;
  final: number;
  eventos: TipoEvento[];
  /** Monto que devolvió el seguro. */
  cubiertoPorSeguro: number;
  costoMitigacion: number;
}

export interface ResultadoRonda {
  capitalInicial: number;
  capitalFinal: number;
  caja: number;
  porPais: ResultadoPais[];
}
