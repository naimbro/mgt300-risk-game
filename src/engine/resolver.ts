import { normal, type Rng } from './rng';
import {
  PARAMETROS,
  REGIONES,
  TIPOS_EVENTO,
  beta,
  costoMitigacion,
  mu,
  probabilidadesRonda,
  sigmaIdiosincratico,
  type ContextoRonda,
} from './modelo';
import type { Cartera, EventoOcurrido, Mitigacion, Mundo, Pais, Region, ResultadoPais, ResultadoRonda, TipoEvento } from './tipos';

/**
 * Sortea lo que pasa en el mundo en una ronda. Se hace UNA vez, en el navegador
 * del profesor y después de cerrar las inversiones: todo el curso vive el mismo
 * año y nadie puede calcular el resultado antes de decidir.
 */
export function sortearMundo(paises: Pais[], ctx: ContextoRonda, rng: Rng): Mundo {
  const shockGlobal = normal(rng) * PARAMETROS.sigmaGlobal;
  const shockRegional = {} as Record<Region, number>;
  for (const r of REGIONES) shockRegional[r] = normal(rng) * PARAMETROS.sigmaRegional;
  const ruido: Record<string, number> = {};
  const eventos: EventoOcurrido[] = [];
  for (const pais of paises) {
    ruido[pais.iso2] = normal(rng) * sigmaIdiosincratico(pais);
    const p = probabilidadesRonda(pais, ctx);
    for (const tipo of TIPOS_EVENTO) {
      if (rng() < p[tipo]) eventos.push({ iso2: pais.iso2, tipo });
    }
  }
  return { shockGlobal, shockRegional, ruido, eventos };
}

/** Retorno de mercado del país (sin eventos políticos ni mitigación). */
export function retornoMercado(pais: Pais, mundo: Mundo): number {
  return mu(pais) + beta(pais) * mundo.shockGlobal + mundo.shockRegional[pais.region] + (mundo.ruido[pais.iso2] ?? 0);
}

/** Impacto efectivo de un evento dada la mitigación (antes del seguro). */
export function impactoEvento(tipo: TipoEvento, mitigacion: Mitigacion | undefined): number {
  let impacto: number = PARAMETROS.impacto[tipo];
  if (mitigacion?.comunidad && tipo === 'conflicto_social') impacto *= 1 - PARAMETROS.mitigacionComunidadConflicto;
  if (mitigacion?.comunidad && tipo === 'regulacion') impacto *= 1 - PARAMETROS.mitigacionComunidadRegulacion;
  return impacto;
}

export interface DesglosePais {
  retorno: number;
  mercado: number;
  eventos: TipoEvento[];
  /** Fracción del monto que devuelve el seguro. */
  recuperado: number;
  costo: number;
}

/** Retorno de 1 unidad invertida en un país. Nunca se pierde más de lo invertido. */
export function resolverPais(pais: Pais, mundo: Mundo, mitigacion: Mitigacion | undefined): DesglosePais {
  const eventos = mundo.eventos.filter((e) => e.iso2 === pais.iso2).map((e) => e.tipo);
  const mitig = mitigacion?.seguro && !pais.seguroDisponible ? { ...mitigacion, seguro: false } : mitigacion;
  const mercado = retornoMercado(pais, mundo);
  let retorno = mercado;
  let recuperado = 0;
  for (const tipo of eventos) {
    const impacto = impactoEvento(tipo, mitig);
    retorno += impacto;
    if (impacto < 0 && mitig?.seguro) recuperado += -impacto * (PARAMETROS.coberturaSeguro[tipo] ?? 0);
  }
  const costo = costoMitigacion(pais, mitig);
  retorno = Math.max(-1, retorno) + recuperado - costo;
  return { retorno: Math.max(-1, retorno), mercado, eventos, recuperado, costo };
}

/** Normaliza pesos: enteros 0-100, suma ≤ 100. Lo que sobra queda en caja. */
export function normalizarPesos(pesos: Record<string, number>): Record<string, number> {
  const limpios: Record<string, number> = {};
  let suma = 0;
  for (const [k, v] of Object.entries(pesos)) {
    const n = Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 0)));
    if (n > 0) {
      limpios[k] = n;
      suma += n;
    }
  }
  if (suma > 100) {
    for (const k of Object.keys(limpios)) limpios[k] = Math.floor((limpios[k] * 100) / suma);
  }
  return limpios;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function resolverCartera(paises: Pais[], cartera: Cartera, capital: number, mundo: Mundo): ResultadoRonda {
  const pesos = normalizarPesos(cartera.pesos);
  const porPais: ResultadoPais[] = [];
  let invertido = 0;
  let total = 0;
  for (const pais of paises) {
    const peso = pesos[pais.iso2] ?? 0;
    if (peso === 0) continue;
    const monto = (capital * peso) / 100;
    const r = resolverPais(pais, mundo, cartera.mitigacion?.[pais.iso2]);
    const final = monto * (1 + r.retorno);
    invertido += monto;
    total += final;
    porPais.push({
      iso2: pais.iso2,
      monto: redondear(monto),
      retorno: r.retorno,
      mercado: r.mercado,
      final: redondear(final),
      eventos: r.eventos,
      cubiertoPorSeguro: redondear(monto * r.recuperado),
      costoMitigacion: redondear(monto * r.costo),
    });
  }
  const caja = capital - invertido;
  return {
    capitalInicial: redondear(capital),
    capitalFinal: redondear(total + caja * (1 + PARAMETROS.tasaLibreDeRiesgo)),
    caja: redondear(caja),
    porPais,
  };
}

/** Países con algún evento negativo: alimenta la persistencia de la ronda siguiente. */
export function paisesInestables(mundo: Mundo): string[] {
  return [...new Set(mundo.eventos.filter((e) => e.tipo !== 'reforma').map((e) => e.iso2))];
}
