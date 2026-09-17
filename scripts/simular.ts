// Calibración del motor: juega miles de partidas con estrategias típicas de un
// curso y reporta si alguna estrategia trivial domina.
//   npm run simular            (escribe research/calibracion.md)
import { writeFileSync, mkdirSync } from 'node:fs';
import { PAISES } from '../src/content/paises';
import {
  CONTEXTO_VACIO,
  TIPOS_EVENTO,
  primaSeguro,
  probabilidadesBase,
  retornoEsperado,
  riesgoPais,
  type ContextoRonda,
} from '../src/engine/modelo';
import { paisesInestables, resolverCartera, sortearMundo } from '../src/engine/resolver';
import { rngConSemilla, type Rng } from '../src/engine/rng';
import type { Cartera, Mitigacion, Pais } from '../src/engine/tipos';
import { sortearSenales, type Senal } from '../src/content/senales';

const RONDAS = 5;
const PARTIDAS = Number(process.env.PARTIDAS ?? 4000);

const porRiesgo = [...PAISES].sort((a, b) => riesgoPais(b.indicadores) - riesgoPais(a.indicadores));
const iso = (p: Pais) => p.iso2;

function cartera(pesos: Record<string, number>, mit: (p: Pais) => Mitigacion = () => ({ seguro: false, comunidad: false })): Cartera {
  const mitigacion: Record<string, Mitigacion> = {};
  for (const p of PAISES) mitigacion[p.iso2] = mit(p);
  return { pesos, mitigacion };
}
const iguales = (lista: Pais[], total = 100) =>
  Object.fromEntries(lista.map((p) => [iso(p), Math.floor(total / lista.length)]));
const mitigarRiesgosos = (p: Pais): Mitigacion => {
  const r = riesgoPais(p.indicadores);
  return { seguro: r >= 5, comunidad: r >= 5 };
};

type Estrategia = { nombre: string; decidir: (senales: Senal[], rng: Rng) => Cartera };

const alarmados = (senales: Senal[]) => new Set(senales.filter((s) => s.tono === 'alerta').map((s) => s.iso2));

const ESTRATEGIAS: Estrategia[] = [
  { nombre: 'Todo en caja', decidir: () => cartera({}) },
  { nombre: 'Todo en Alemania', decidir: () => cartera({ DE: 100 }) },
  { nombre: 'Todo en EE.UU.', decidir: () => cartera({ US: 100 }) },
  { nombre: `Todo en el más riesgoso (${porRiesgo[0].nombre})`, decidir: () => cartera({ [iso(porRiesgo[0])]: 100 }) },
  { nombre: 'Todo en el más riesgoso, asegurado', decidir: () => cartera({ [iso(porRiesgo[0])]: 100 }, () => ({ seguro: true, comunidad: true })) },
  { nombre: 'Solo Latinoamérica, igual', decidir: () => cartera(iguales(PAISES.filter((p) => p.region === 'latam'))) },
  { nombre: 'Los 3 más riesgosos', decidir: () => cartera(iguales(porRiesgo.slice(0, 3))) },
  { nombre: 'Los 3 más riesgosos + mitigación', decidir: () => cartera(iguales(porRiesgo.slice(0, 3)), () => ({ seguro: true, comunidad: true })) },
  { nombre: '8 países iguales', decidir: () => cartera(iguales(PAISES)) },
  { nombre: '8 países iguales + mitigación en riesgosos', decidir: () => cartera(iguales(PAISES), mitigarRiesgosos) },
  {
    nombre: 'Inclinada al riesgo + mitigación',
    decidir: () => {
      const tot = PAISES.reduce((s, p) => s + riesgoPais(p.indicadores), 0);
      return cartera(Object.fromEntries(PAISES.map((p) => [iso(p), Math.floor((100 * riesgoPais(p.indicadores)) / tot)])), mitigarRiesgosos);
    },
  },
  {
    nombre: 'Lee el informe: evita alertas, mitiga',
    decidir: (senales) => {
      const evitar = alarmados(senales);
      const tot = PAISES.filter((p) => !evitar.has(iso(p))).reduce((s, p) => s + riesgoPais(p.indicadores), 0);
      return cartera(
        Object.fromEntries(PAISES.filter((p) => !evitar.has(iso(p))).map((p) => [iso(p), Math.floor((100 * riesgoPais(p.indicadores)) / tot)])),
        mitigarRiesgosos,
      );
    },
  },
  {
    nombre: 'Inclinada al riesgo, mitiga solo con alerta',
    decidir: (senales) => {
      const alerta = alarmados(senales);
      const tot = PAISES.reduce((s, p) => s + riesgoPais(p.indicadores), 0);
      return cartera(
        Object.fromEntries(PAISES.map((p) => [iso(p), Math.floor((100 * riesgoPais(p.indicadores)) / tot)])),
        (p) => ({ seguro: alerta.has(iso(p)), comunidad: alerta.has(iso(p)) }),
      );
    },
  },
  {
    nombre: 'Azar (alumno distraído)',
    decidir: (_s, rng) => {
      const elegidos = PAISES.filter(() => rng() < 0.35);
      return cartera(iguales(elegidos.length ? elegidos : [PAISES[Math.floor(rng() * PAISES.length)]], 90));
    },
  },
];

const COPIAS = 2; // un curso de ~26 alumnos: 2 por estrategia
const finales: number[][] = ESTRATEGIAS.map(() => []);
const victorias = ESTRATEGIAS.map(() => 0);
const percentiles = ESTRATEGIAS.map(() => 0);

const rng = rngConSemilla(20261117);
for (let g = 0; g < PARTIDAS; g++) {
  const capital = ESTRATEGIAS.map(() => Array(COPIAS).fill(100) as number[]);
  let ctx: ContextoRonda = CONTEXTO_VACIO;
  for (let r = 0; r < RONDAS; r++) {
    const senales = sortearSenales([], rng);
    ctx = { ...ctx, senales };
    const decisiones = ESTRATEGIAS.map((e) => Array.from({ length: COPIAS }, () => e.decidir(senales, rng)));
    const mundo = sortearMundo(PAISES, ctx, rng);
    ESTRATEGIAS.forEach((_, i) => {
      for (let c = 0; c < COPIAS; c++) capital[i][c] = resolverCartera(PAISES, decisiones[i][c], capital[i][c], mundo).capitalFinal;
    });
    ctx = { senales: [], inestablesRondaAnterior: paisesInestables(mundo) };
  }
  const todos = capital.flatMap((cs, i) => cs.map((v) => ({ i, v })));
  todos.sort((a, b) => b.v - a.v);
  victorias[todos[0].i] += 1;
  todos.forEach((t, pos) => (percentiles[t.i] += 1 - pos / (todos.length - 1)));
  capital.forEach((cs, i) => finales[i].push(...cs));
}

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(p * (s.length - 1))];
};
const f = (n: number, d = 0) => n.toFixed(d);

let md = `# Calibración del motor (${PARTIDAS} partidas × ${RONDAS} rondas, ${ESTRATEGIAS.length * COPIAS} jugadores)\n\n`;
md += `## Perfil de países (probabilidades base por ronda)\n\n| País | Riesgo | E[ret] | Prima seguro | ${TIPOS_EVENTO.join(' | ')} |\n|---|---|---|---|${TIPOS_EVENTO.map(() => '---').join('|')}|\n`;
for (const p of porRiesgo) {
  const pb = probabilidadesBase(p.indicadores);
  md += `| ${p.nombre} | ${riesgoPais(p.indicadores)} | ${f(retornoEsperado(p) * 100, 1)}% | ${primaSeguro(p) === null ? '—' : f(primaSeguro(p)! * 100, 1) + '%'} | ${TIPOS_EVENTO.map((t) => f(pb[t] * 100, 1) + '%').join(' | ')} |\n`;
}
md += `\n## Estrategias\n\n| Estrategia | Media | Mediana | P10 | P90 | P(pierde) | Gana el curso | Percentil medio |\n|---|---|---|---|---|---|---|---|\n`;
ESTRATEGIAS.forEach((e, i) => {
  const xs = finales[i];
  md += `| ${e.nombre} | ${f(xs.reduce((a, b) => a + b, 0) / xs.length)} | ${f(q(xs, 0.5))} | ${f(q(xs, 0.1))} | ${f(q(xs, 0.9))} | ${f((100 * xs.filter((x) => x < 100).length) / xs.length)}% | ${f((100 * victorias[i]) / PARTIDAS, 1)}% | ${f((100 * percentiles[i]) / (PARTIDAS * COPIAS))} |\n`;
});
mkdirSync('research', { recursive: true });
writeFileSync('research/calibracion.md', md);
console.log(md);
