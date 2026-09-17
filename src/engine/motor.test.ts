import { describe, expect, it } from 'vitest';
import { PAISES } from '../content/paises';
import {
  CONTEXTO_VACIO,
  PARAMETROS,
  primaSeguro,
  probabilidadesBase,
  probabilidadesRonda,
  retornoEsperado,
  riesgoPais,
} from './modelo';
import { normalizarPesos, resolverCartera, resolverPais, sortearMundo } from './resolver';
import { rngConSemilla } from './rng';
import type { Mundo, Pais } from './tipos';

const pais = (iso2: string) => PAISES.find((p) => p.iso2 === iso2)!;

function mundoQuieto(eventos: Mundo['eventos'] = []): Mundo {
  return {
    shockGlobal: 0,
    shockRegional: { norteamerica: 0, europa: 0, latam: 0, asia: 0, golfo: 0 },
    ruido: {},
    eventos,
  };
}

/** Retorno medio simulado de 1 unidad en un país, sin mitigación. */
function retornoSimulado(p: Pais, n = 60000): number {
  const rng = rngConSemilla(7);
  let s = 0;
  for (let i = 0; i < n; i++) s += resolverPais(p, sortearMundo([p], CONTEXTO_VACIO, rng), undefined).retorno;
  return s / n;
}

describe('perfil de riesgo', () => {
  it('riesgo entre 0 y 10 y probabilidades válidas', () => {
    for (const p of PAISES) {
      const r = riesgoPais(p.indicadores);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(10);
      for (const v of Object.values(probabilidadesBase(p.indicadores))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(PARAMETROS.probabilidadMaxima);
      }
    }
  });

  it('las señales cambian las probabilidades de la ronda y respetan el tope', () => {
    const mx = pais('MX');
    const base = probabilidadesBase(mx.indicadores).regulacion;
    const conSenal = probabilidadesRonda(mx, {
      senales: [{ id: 's', iso2: 'MX', multiplicadores: { regulacion: 2.5 } }],
      inestablesRondaAnterior: [],
    }).regulacion;
    expect(conSenal).toBeCloseTo(Math.min(PARAMETROS.probabilidadMaxima, base * 2.5));
    const otraPais = probabilidadesRonda(pais('CL'), {
      senales: [{ id: 's', iso2: 'MX', multiplicadores: { regulacion: 2.5 } }],
      inestablesRondaAnterior: [],
    }).regulacion;
    expect(otraPais).toBeCloseTo(probabilidadesBase(pais('CL').indicadores).regulacion);
  });

  it('la prima del seguro es mayor donde el estado de derecho es más débil', () => {
    expect(primaSeguro(pais('MX'))!).toBeGreaterThan(primaSeguro(pais('CL'))!);
    expect(primaSeguro(pais('DE'))).toBeNull(); // MIGA no asegura en países desarrollados
  });
});

describe('el riesgo se paga en promedio', () => {
  it('el retorno simulado se acerca al esperado del modelo', () => {
    for (const iso of ['DE', 'MX', 'AR']) {
      expect(Math.abs(retornoSimulado(pais(iso)) - retornoEsperado(pais(iso)))).toBeLessThan(0.02);
    }
  });

  it('un país más riesgoso rinde más en promedio que uno seguro', () => {
    const [seguro, riesgoso] = [...PAISES].sort((a, b) => riesgoPais(a.indicadores) - riesgoPais(b.indicadores)).filter((_, i, xs) => i === 0 || i === xs.length - 1);
    expect(retornoSimulado(riesgoso)).toBeGreaterThan(retornoSimulado(seguro) + 0.05);
  });
});

describe('resolución', () => {
  it('todo en caja gana la tasa libre de riesgo', () => {
    const r = resolverCartera(PAISES, { pesos: {}, mitigacion: {} }, 100, mundoQuieto());
    expect(r.capitalFinal).toBeCloseTo(100 * (1 + PARAMETROS.tasaLibreDeRiesgo));
  });

  it('el seguro recupera el 90% de la pérdida por expropiación, menos la prima', () => {
    const ar = pais('AR');
    const m = mundoQuieto([{ iso2: 'AR', tipo: 'expropiacion' }]);
    const sin = resolverPais(ar, m, { seguro: false, comunidad: false }).retorno;
    const con = resolverPais(ar, m, { seguro: true, comunidad: false }).retorno;
    expect(con).toBeCloseTo(sin + 0.9 * 0.7 - primaSeguro(ar)!);
  });

  it('el seguro no cubre un cambio regulatorio', () => {
    const mx = pais('MX');
    const m = mundoQuieto([{ iso2: 'MX', tipo: 'regulacion' }]);
    const sin = resolverPais(mx, m, { seguro: false, comunidad: false }).retorno;
    const con = resolverPais(mx, m, { seguro: true, comunidad: false }).retorno;
    expect(con).toBeCloseTo(sin - primaSeguro(mx)!);
  });

  it('no se puede asegurar donde MIGA no opera', () => {
    const us = pais('US');
    const m = mundoQuieto([{ iso2: 'US', tipo: 'violencia' }]);
    expect(resolverPais(us, m, { seguro: true, comunidad: false }).retorno).toBeCloseTo(resolverPais(us, m, undefined).retorno);
  });

  it('la relación con la comunidad reduce el daño de un conflicto social', () => {
    const cl = pais('CL');
    const m = mundoQuieto([{ iso2: 'CL', tipo: 'conflicto_social' }]);
    const sin = resolverPais(cl, m, { seguro: false, comunidad: false }).retorno;
    const con = resolverPais(cl, m, { seguro: false, comunidad: true }).retorno;
    expect(con).toBeCloseTo(sin + 0.25 * 0.6 - PARAMETROS.costoComunidad);
  });

  it('nunca se pierde más de lo invertido', () => {
    const m = mundoQuieto(['expropiacion', 'violencia', 'regulacion', 'conflicto_social', 'geopolitica', 'controles_capital'].map((tipo) => ({ iso2: 'MX', tipo: tipo as never })));
    const r = resolverCartera(PAISES, { pesos: { MX: 100 }, mitigacion: {} }, 100, m);
    expect(r.capitalFinal).toBeGreaterThanOrEqual(0);
  });

  it('dos jugadores con la misma cartera en el mismo mundo obtienen lo mismo', () => {
    const mundo = sortearMundo(PAISES, CONTEXTO_VACIO, rngConSemilla(1));
    const c = { pesos: { CL: 40, VN: 30 }, mitigacion: { VN: { seguro: true, comunidad: false } } };
    expect(resolverCartera(PAISES, c, 120, mundo)).toEqual(resolverCartera(PAISES, c, 120, mundo));
  });
});

describe('normalizarPesos', () => {
  it('limpia negativos, redondea y escala si suman más de 100', () => {
    expect(normalizarPesos({ A: -5, B: 20.4, C: 0 })).toEqual({ B: 20 });
    const n = normalizarPesos({ A: 80, B: 80 });
    expect(n.A + n.B).toBeLessThanOrEqual(100);
  });
});
