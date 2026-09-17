import { riesgoPais } from './modelo';
import { normalizarPesos, resolverCartera } from './resolver';
import type { Cartera, Mitigacion, Mundo, Pais } from './tipos';

// Para el cierre: qué habría pasado con estrategias típicas en EL MISMO mundo que
// vivió el curso. Es la forma más directa de separar suerte de decisión.

export interface Contrafactual {
  nombre: string;
  descripcion: string;
  capitalFinal: number;
}

function carteraFija(paises: Pais[], pesos: Record<string, number>, mitigar: (p: Pais) => Mitigacion): Cartera {
  return { pesos, mitigacion: Object.fromEntries(paises.map((p) => [p.iso2, mitigar(p)])) };
}

const sinMitigar = (): Mitigacion => ({ seguro: false, comunidad: false });

export function estrategiasDeReferencia(paises: Pais[]): { nombre: string; descripcion: string; cartera: Cartera }[] {
  const porRiesgo = [...paises].sort((a, b) => riesgoPais(b.indicadores) - riesgoPais(a.indicadores));
  const masSeguro = porRiesgo[porRiesgo.length - 1];
  const masRiesgoso = porRiesgo[0];
  const iguales = Object.fromEntries(paises.map((p) => [p.iso2, Math.floor(100 / paises.length)]));
  const totalRiesgo = paises.reduce((s, p) => s + riesgoPais(p.indicadores), 0);
  const inclinada = Object.fromEntries(paises.map((p) => [p.iso2, Math.floor((100 * riesgoPais(p.indicadores)) / totalRiesgo)]));
  const mitigarRiesgosos = (p: Pais): Mitigacion => {
    const r = riesgoPais(p.indicadores) >= 5;
    return { seguro: r && p.seguroDisponible, comunidad: r };
  };
  return [
    { nombre: 'Todo en caja', descripcion: 'No invertir nada', cartera: { pesos: {}, mitigacion: {} } },
    { nombre: `Todo en ${masSeguro.nombre}`, descripcion: 'El país de menor riesgo', cartera: carteraFija(paises, { [masSeguro.iso2]: 100 }, sinMitigar) },
    { nombre: `Todo en ${masRiesgoso.nombre}`, descripcion: 'El país de mayor riesgo, sin protección', cartera: carteraFija(paises, { [masRiesgoso.iso2]: 100 }, sinMitigar) },
    { nombre: 'Repartir en los 8', descripcion: 'Partes iguales, sin protección', cartera: carteraFija(paises, iguales, sinMitigar) },
    { nombre: 'Riesgo gestionado', descripcion: 'Más peso donde hay más prima por riesgo, con seguro y comunidad en los riesgosos', cartera: carteraFija(paises, inclinada, mitigarRiesgosos) },
  ];
}

/** Capital final de cada estrategia de referencia jugando todas las rondas con los mundos dados. */
export function contrafactuales(paises: Pais[], mundos: Mundo[], capitalInicial = 100): Contrafactual[] {
  return estrategiasDeReferencia(paises).map(({ nombre, descripcion, cartera }) => {
    let capital = capitalInicial;
    for (const m of mundos) capital = resolverCartera(paises, cartera, capital, m).capitalFinal;
    return { nombre, descripcion, capitalFinal: capital };
  });
}

/** Riesgo político promedio de una cartera, ponderado por lo invertido (la caja cuenta como 0). */
export function riesgoDeCartera(paises: Pais[], cartera: Cartera): number {
  const pesos = normalizarPesos(cartera.pesos);
  return paises.reduce((s, p) => s + ((pesos[p.iso2] ?? 0) / 100) * riesgoPais(p.indicadores), 0);
}

/** Índice de concentración (Herfindahl) de lo invertido: 1 = todo en un país. */
export function concentracion(cartera: Cartera): number {
  const pesos = Object.values(normalizarPesos(cartera.pesos));
  const total = pesos.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return pesos.reduce((s, w) => s + (w / total) ** 2, 0);
}
