import { useEffect, useMemo, useState } from 'react';
import { EVENTOS } from '../content/eventos';
import { PAISES } from '../content/paises';
import { concentracion, contrafactuales, riesgoDeCartera } from '../engine/contrafactuales';
import type { Mundo } from '../engine/tipos';
import { cargarCierre, type EstadoJugador, type Partida } from '../lib/partida';
import { millones, posiciones } from '../lib/formato';
import { confettiPodium } from '../lib/confetti';
import { playDrumRoll, playPodiumFanfare } from '../lib/sounds';
import { anioDeRonda } from '../content/eventos';
import { Bandera } from './Bandera';
import { IconoEvento } from './Icono';

const PESTANAS = ['Podio', '¿Suerte o decisión?', 'Riesgo y resultado', 'Lo que pasó', 'Para discutir', 'Recomendaciones'] as const;
type Pestana = (typeof PESTANAS)[number];

export function Cierre({ partida }: { partida: Partida }) {
  const [pestana, setPestana] = useState<Pestana>('Podio');
  const [datos, setDatos] = useState<{ estados: EstadoJugador[]; memos: { uid: string; texto: string }[] } | null>(null);

  useEffect(() => {
    cargarCierre(partida.codigo).then(setDatos).catch(() => setDatos({ estados: [], memos: [] }));
  }, [partida.codigo, pestana]);

  const mundos = useMemo(
    () => Object.keys(partida.mundos).map(Number).sort((a, b) => a - b).map((r) => partida.mundos[String(r)]) as Mundo[],
    [partida.mundos],
  );

  return (
    <div>
      <nav className="flex flex-wrap gap-2" aria-label="Secciones del cierre">
        {PESTANAS.map((p) => (
          <button key={p} onClick={() => setPestana(p)} className={`${pestana === p ? 'btn-primary' : 'btn-secondary'} !py-2 !px-4 !text-sm`} aria-pressed={pestana === p}>
            {p}
          </button>
        ))}
      </nav>
      <div className="mt-6">
        {pestana === 'Podio' && <Podio partida={partida} />}
        {pestana === '¿Suerte o decisión?' && <SuerteODecision partida={partida} mundos={mundos} />}
        {pestana === 'Riesgo y resultado' && <RiesgoResultado estados={datos?.estados ?? []} partida={partida} />}
        {pestana === 'Lo que pasó' && <LoQuePaso partida={partida} mundos={mundos} />}
        {pestana === 'Para discutir' && <ParaDiscutir />}
        {pestana === 'Recomendaciones' && <Memos memos={datos?.memos ?? []} />}
      </div>
    </div>
  );
}

function Podio({ partida }: { partida: Partida }) {
  const filas = posiciones(Object.entries(partida.capitales).filter(([u]) => partida.jugadores[u]), ([, c]) => c);
  const [visibles, setVisibles] = useState(0);

  useEffect(() => {
    playDrumRoll();
    const t = [setTimeout(() => setVisibles(1), 1200), setTimeout(() => setVisibles(2), 2400), setTimeout(() => {
      setVisibles(3);
      playPodiumFanfare();
      confettiPodium();
    }, 3800)];
    return () => t.forEach(clearTimeout);
  }, []);

  // Se revela 3°, 2°, 1°.
  const lugares = [
    { puesto: 2, alto: 'h-44', color: 'bg-surface-3', aparece: 2 },
    { puesto: 1, alto: 'h-60', color: 'bg-amber', aparece: 3 },
    { puesto: 3, alto: 'h-32', color: 'bg-orange', aparece: 1 },
  ];
  return (
    <div className="flex items-end justify-center gap-6 min-h-[420px]">
      {lugares.map(({ puesto, alto, color, aparece }) => {
        const ganadores = filas.filter((f) => f.posicion === puesto);
        const mostrar = visibles >= aparece;
        return (
          <div key={puesto} className="w-64 text-center">
            <div className={`transition-opacity duration-500 ${mostrar ? 'opacity-100' : 'opacity-0'}`}>
              {ganadores.length === 0 ? (
                <p className="text-muted">—</p>
              ) : (
                ganadores.map(({ item: [uid, cap] }) => (
                  <div key={uid} className="mb-2 animate-scale-in">
                    <p className="font-bold text-2xl truncate">{partida.jugadores[uid]?.nombre}</p>
                    <p className="font-display text-xl tabular">{millones(cap)}</p>
                  </div>
                ))
              )}
            </div>
            <div className={`${alto} ${color} rounded-t-xl border-[2.5px] border-ink flex items-start justify-center pt-3`}>
              <span className="font-display text-5xl">{puesto}°</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SuerteODecision({ partida, mundos }: { partida: Partida; mundos: Mundo[] }) {
  const refs = contrafactuales(PAISES, mundos);
  const capitales = Object.entries(partida.capitales).filter(([u]) => partida.jugadores[u]).map(([, c]) => c).sort((a, b) => a - b);
  const mediana = capitales.length ? capitales[Math.floor((capitales.length - 1) / 2)] : 100;
  const mejor = capitales.at(-1) ?? 100;
  const barras = [
    ...refs.map((r) => ({ nombre: r.nombre, descripcion: r.descripcion, valor: r.capitalFinal, tipo: 'ref' as const })),
    { nombre: 'Mediana del curso', descripcion: `${capitales.length} directorios`, valor: mediana, tipo: 'curso' as const },
    { nombre: 'Mejor del curso', descripcion: 'El primer lugar', valor: mejor, tipo: 'curso' as const },
  ].sort((a, b) => b.valor - a.valor);
  const max = Math.max(...barras.map((b) => b.valor), 100);

  return (
    <section>
      <h2 className="font-display text-3xl">¿Suerte o decisión?</h2>
      <p className="text-xl text-ink-soft mt-1">Estas estrategias jugaron en exactamente el mismo mundo que ustedes.</p>
      <ul className="mt-6 space-y-3">
        {barras.map((b) => (
          <li key={b.nombre} className="grid grid-cols-[16rem_1fr_9rem] items-center gap-4">
            <div>
              <p className="font-bold text-lg leading-tight">{b.nombre}</p>
              <p className="text-sm text-muted leading-tight">{b.descripcion}</p>
            </div>
            <div className="h-9 bg-surface-2 rounded-lg overflow-hidden relative border-2 border-line">
              <div className={`h-full ${b.tipo === 'curso' ? 'bg-orange' : 'bg-ink'}`} style={{ width: `${(b.valor / max) * 100}%` }} />
              <div className="absolute inset-y-0 border-l-2 border-dashed border-muted" style={{ left: `${(100 / max) * 100}%` }} title="Capital inicial" />
            </div>
            <p className="font-display text-xl tabular text-right">{millones(b.valor)}</p>
          </li>
        ))}
      </ul>
      <p className="text-muted mt-4">La línea punteada marca el capital inicial (US$ 100 M).</p>
    </section>
  );
}

function RiesgoResultado({ estados, partida }: { estados: EstadoJugador[]; partida: Partida }) {
  const puntos = estados
    .filter((e) => e.historial.length > 0 && partida.capitales[e.uid] !== undefined)
    .map((e) => {
      const riesgo = e.historial.reduce((s, h) => s + riesgoDeCartera(PAISES, h.cartera), 0) / e.historial.length;
      const conc = e.historial.reduce((s, h) => s + concentracion(h.cartera), 0) / e.historial.length;
      const mitigo = e.historial.some((h) => Object.values(h.cartera.mitigacion ?? {}).some((m) => m.seguro || m.comunidad));
      return { riesgo, capital: partida.capitales[e.uid], conc, mitigo };
    });
  if (puntos.length === 0) return <p className="text-xl text-muted">Cargando…</p>;

  const W = 900, H = 440, M = { l: 80, r: 20, t: 20, b: 60 };
  const maxR = Math.max(7, ...puntos.map((p) => p.riesgo));
  const caps = puntos.map((p) => p.capital);
  const minC = Math.min(60, ...caps), maxC = Math.max(160, ...caps);
  const x = (r: number) => M.l + (r / maxR) * (W - M.l - M.r);
  const y = (c: number) => H - M.b - ((c - minC) / (maxC - minC)) * (H - M.t - M.b);
  const concentrados = puntos.filter((p) => p.conc > 0.5);
  const diversificados = puntos.filter((p) => p.conc <= 0.5 && p.conc > 0);
  const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  return (
    <section>
      <h2 className="font-display text-3xl">Riesgo asumido y resultado</h2>
      <p className="text-xl text-ink-soft mt-1">
        Cada punto es un directorio, sin nombres. Relleno: usó seguro o comunidad alguna vez. Tamaño: qué tan concentrada estuvo la cartera.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-5xl mt-4" role="img" aria-label="Riesgo promedio de la cartera versus capital final">
        <line x1={M.l} x2={W - M.r} y1={y(100)} y2={y(100)} stroke="var(--muted)" strokeDasharray="6 5" />
        <text x={W - M.r} y={y(100) - 6} textAnchor="end" fontSize="14" fill="var(--muted)">capital inicial</text>
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="var(--ink)" strokeWidth="2" />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeWidth="2" />
        {[0, 2, 4, 6, 8].filter((t) => t <= maxR).map((t) => (
          <text key={t} x={x(t)} y={H - M.b + 22} textAnchor="middle" fontSize="15" fill="var(--ink)">{t}</text>
        ))}
        <text x={(W + M.l) / 2} y={H - 10} textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--ink)">Riesgo político promedio de la cartera (caja = 0)</text>
        {[minC, 100, maxC].map((c) => (
          <text key={c} x={M.l - 10} y={y(c) + 5} textAnchor="end" fontSize="15" fill="var(--ink)">{Math.round(c)}</text>
        ))}
        <text transform={`translate(20 ${(H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--ink)">Capital final (US$ M)</text>
        {puntos.map((p, i) => (
          <circle key={i} cx={x(p.riesgo)} cy={y(p.capital)} r={7 + p.conc * 12} fill={p.mitigo ? 'var(--orange)' : 'var(--surface)'} stroke="var(--ink)" strokeWidth="2.5" opacity="0.9" />
        ))}
      </svg>
      <div className="flex gap-8 text-lg mt-2">
        <p>Carteras concentradas: <strong>{concentrados.length}</strong>{prom(concentrados.map((p) => p.capital)) !== null && <> · promedio {millones(prom(concentrados.map((p) => p.capital))!)}</>}</p>
        <p>Diversificadas: <strong>{diversificados.length}</strong>{prom(diversificados.map((p) => p.capital)) !== null && <> · promedio {millones(prom(diversificados.map((p) => p.capital))!)}</>}</p>
      </div>
    </section>
  );
}

function LoQuePaso({ partida, mundos }: { partida: Partida; mundos: Mundo[] }) {
  return (
    <section>
      <h2 className="font-display text-3xl">Lo que pasó, año por año</h2>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-lg border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left">
              <th className="pr-4">País</th>
              {mundos.map((_, i) => (
                <th key={i} className="px-2 font-display">{anioDeRonda(partida.anioInicial, i + 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAISES.map((p) => (
              <tr key={p.iso2} className="bg-surface">
                <td className="pr-4 py-2">
                  <span className="flex items-center gap-2 font-bold"><Bandera iso2={p.iso2} className="h-5" /> {p.nombre}</span>
                </td>
                {mundos.map((m, i) => {
                  const ev = m.eventos.filter((e) => e.iso2 === p.iso2);
                  return (
                    <td key={i} className="px-2 py-2">
                      <span className="flex gap-1.5 flex-wrap">
                        {ev.length === 0 ? <span className="text-faint">·</span> : ev.map((e) => (
                          <span key={e.tipo} title={EVENTOS[e.tipo].nombre} className={`chip ${EVENTOS[e.tipo].positivo ? 'border-gain text-gain' : 'border-loss text-loss'}`}>
                            <IconoEvento tipo={e.tipo} size={14} /> {EVENTOS[e.tipo].nombre}
                          </span>
                        ))}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted mt-3">
        ¿Qué países concentraron los golpes? ¿Coincide con los que tenían peores indicadores de gobernanza, o hubo sorpresas (por ejemplo, riesgo geopolítico en países
        con buen estado de derecho)?
      </p>
    </section>
  );
}

function ParaDiscutir() {
  const preguntas = [
    {
      titulo: 'Entender el riesgo',
      texto: 'Rice y Zegart proponen cuatro capacidades: entender, analizar, mitigar y responder. ¿Cuál usaron de verdad durante el juego y cuál ignoraron?',
    },
    {
      titulo: 'Instituciones',
      texto: 'Emiratos tiene buen estado de derecho y es una autocracia; México es una democracia debilitada. ¿Qué dice Acemoglu y Robinson sobre instituciones inclusivas y extractivas, y cuál de los dos riesgos es más predecible?',
    },
    {
      titulo: 'Lo que no se asegura',
      texto: 'El seguro cubre expropiación, controles de capital y violencia, pero no cambios regulatorios, aranceles ni conflictos con la comunidad. ¿Por qué un asegurador no cubriría esos riesgos? ¿Cómo se gestionan entonces?',
    },
    {
      titulo: 'Torneo o directorio',
      texto: 'Apostar todo al país más riesgoso a veces gana el curso, pero la mayoría de las veces pierde plata. ¿Qué incentivos tiene un gerente que compite por un bono versus un directorio que responde a accionistas?',
    },
    {
      titulo: 'IA y soberanía',
      texto: 'Data centers, chips y minerales críticos quedaron en el centro de la geopolítica. ¿Qué riesgo nuevo trae la dependencia de proveedores (chips, licencias de exportación, energía) que no aparece en los indicadores tradicionales?',
    },
  ];
  return (
    <section>
      <h2 className="font-display text-3xl">Para discutir</h2>
      <ol className="grid lg:grid-cols-2 gap-4 mt-4">
        {preguntas.map((p, i) => (
          <li key={p.titulo} className={`card-ink p-5 ${i % 2 ? 'tilt-b' : 'tilt-a'}`}>
            <p className="font-display text-xl">{i + 1}. {p.titulo}</p>
            <p className="text-xl mt-2 leading-snug">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Memos({ memos }: { memos: { uid: string; texto: string }[] }) {
  return (
    <section>
      <h2 className="font-display text-3xl">Recomendaciones al directorio</h2>
      <p className="text-xl text-ink-soft mt-1">{memos.length} recibidas, sin nombres. Pídelas en los teléfonos y vuelve a abrir esta pestaña.</p>
      <ul className="grid lg:grid-cols-2 gap-3 mt-4">
        {memos.map((m) => (
          <li key={m.uid} className="card p-4 text-xl leading-snug">“{m.texto}”</li>
        ))}
      </ul>
    </section>
  );
}

