import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, Minus, Plus, ShieldCheck, Users } from 'lucide-react';
import { EVENTOS } from '../content/eventos';
import { PAISES, type FichaPais } from '../content/paises';
import type { Senal } from '../content/senales';
import { PARAMETROS, TIPOS_EVENTO, primaSeguro, probabilidadesBase, retornoEsperado, riesgoPais } from '../engine/modelo';
import type { Cartera, Mitigacion, TipoEvento } from '../engine/tipos';
import { millones, pct } from '../lib/formato';
import { playClick } from '../lib/sounds';
import { Bandera } from './Bandera';
import { IconoEvento } from './Icono';

const PASO = 10;

interface Props {
  capital: number;
  senales: Senal[];
  inicial: Cartera | null;
  onConfirmar: (c: Cartera) => Promise<void>;
}

export function DecisionCartera({ capital, senales, inicial, onConfirmar }: Props) {
  const [pesos, setPesos] = useState<Record<string, number>>(() => ({ ...(inicial?.pesos ?? {}) }));
  const [mitigacion, setMitigacion] = useState<Record<string, Mitigacion>>(() => ({ ...(inicial?.mitigacion ?? {}) }));
  const [abierto, setAbierto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Candado sincrónico: en ml2 dos envíos salieron con 2 ms de diferencia usando estado.
  const candado = useRef(false);

  const invertido = Object.values(pesos).reduce((a, b) => a + b, 0);
  const caja = 100 - invertido;

  const alertas = useMemo(() => {
    const m = new Map<string, Set<TipoEvento>>();
    for (const s of senales) {
      if (s.tono !== 'alerta') continue;
      const set = m.get(s.iso2) ?? new Set<TipoEvento>();
      for (const [t, v] of Object.entries(s.multiplicadores)) if ((v ?? 1) > 1) set.add(t as TipoEvento);
      m.set(s.iso2, set);
    }
    return m;
  }, [senales]);

  function cambiarPeso(iso2: string, delta: number) {
    playClick();
    setPesos((prev) => {
      const actual = prev[iso2] ?? 0;
      const libre = 100 - Object.values(prev).reduce((a, b) => a + b, 0);
      const nuevo = Math.max(0, Math.min(actual + Math.min(delta, libre), 100));
      return { ...prev, [iso2]: nuevo };
    });
  }

  function alternar(iso2: string, clave: keyof Mitigacion) {
    playClick();
    setMitigacion((prev) => {
      const m = prev[iso2] ?? { seguro: false, comunidad: false };
      return { ...prev, [iso2]: { ...m, [clave]: !m[clave] } };
    });
  }

  async function confirmar() {
    if (candado.current) return;
    candado.current = true;
    setEnviando(true);
    setError(null);
    const limpios = Object.fromEntries(Object.entries(pesos).filter(([, v]) => v > 0));
    const mit = Object.fromEntries(
      Object.entries(mitigacion).filter(([k, m]) => limpios[k] && (m.seguro || m.comunidad)),
    );
    try {
      await onConfirmar({ pesos: limpios, mitigacion: mit });
    } catch (e) {
      candado.current = false;
      setEnviando(false);
      setError(e instanceof Error && e.message.includes('permission') ? 'El año ya se cerró.' : 'No se pudo enviar. Intenta otra vez.');
    }
  }

  return (
    <div className="pb-40">
      <p className="text-sm text-ink-soft mt-4">
        Reparte tu capital de <strong>{millones(capital)}</strong> en proyectos. Lo que no inviertas queda en caja y rinde{' '}
        {pct(PARAMETROS.tasaLibreDeRiesgo)} seguro. Si no confirmas a tiempo, se mantiene tu cartera del año anterior.
      </p>

      <ul className="mt-4 space-y-3">
        {PAISES.map((p) => (
          <FilaPais
            key={p.iso2}
            pais={p}
            peso={pesos[p.iso2] ?? 0}
            capital={capital}
            mitigacion={mitigacion[p.iso2]}
            alertas={alertas.get(p.iso2)}
            abierto={abierto === p.iso2}
            onAbrir={() => setAbierto(abierto === p.iso2 ? null : p.iso2)}
            onPeso={(d) => cambiarPeso(p.iso2, d)}
            onMitigar={(k) => alternar(p.iso2, k)}
            libre={caja}
          />
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-paper/95 backdrop-blur border-t-[2.5px] border-ink px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm font-bold tabular">
            <span>Invertido {invertido}%</span>
            <span>Caja {caja}%</span>
          </div>
          <div className="h-3 rounded-full bg-surface-3 mt-1 overflow-hidden border-2 border-ink" aria-hidden>
            <div className="h-full bg-orange transition-all" style={{ width: `${invertido}%` }} />
          </div>
          {error && (
            <p className="text-loss text-sm font-semibold mt-2" role="alert">
              {error}
            </p>
          )}
          <button className="btn-primary w-full mt-3" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Confirmar decisión'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FilaProps {
  pais: FichaPais;
  peso: number;
  capital: number;
  libre: number;
  mitigacion: Mitigacion | undefined;
  alertas: Set<TipoEvento> | undefined;
  abierto: boolean;
  onAbrir: () => void;
  onPeso: (delta: number) => void;
  onMitigar: (k: keyof Mitigacion) => void;
}

function FilaPais({ pais, peso, capital, libre, mitigacion, alertas, abierto, onAbrir, onPeso, onMitigar }: FilaProps) {
  const riesgo = riesgoPais(pais.indicadores);
  const prima = primaSeguro(pais);
  const probs = probabilidadesBase(pais.indicadores);
  const principales = TIPOS_EVENTO.filter((t) => t !== 'reforma').sort((a, b) => probs[b] - probs[a]);

  return (
    <li className={`card p-3 ${peso > 0 ? 'border-ink' : ''} ${alertas ? 'ring-2 ring-amber ring-offset-2 ring-offset-paper' : ''}`}>
      <div className="flex items-start gap-3">
        <Bandera iso2={pais.iso2} className="h-7 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{pais.nombre}</h3>
            {alertas && (
              <span className="chip bg-amber border-ink text-ink">
                <AlertTriangle size={11} /> Alerta
              </span>
            )}
          </div>
          <p className="text-xs text-muted leading-tight">{pais.proyecto}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-semibold">
            <MedidorRiesgo riesgo={riesgo} />
            <span>Retorno esperado {pct(retornoEsperado(pais), 1)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button className="btn-secondary !px-3 !py-2" onClick={() => onPeso(-PASO)} disabled={peso === 0} aria-label={`Menos en ${pais.nombre}`}>
          <Minus size={18} />
        </button>
        <div className="flex-1 text-center">
          <div className="font-display text-2xl tabular leading-none">{peso}%</div>
          <div className="text-xs text-muted tabular">{millones((capital * peso) / 100, 1)}</div>
        </div>
        <button className="btn-secondary !px-3 !py-2" onClick={() => onPeso(PASO)} disabled={libre === 0} aria-label={`Más en ${pais.nombre}`}>
          <Plus size={18} />
        </button>
      </div>

      {peso > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Interruptor
            activo={!!mitigacion?.seguro}
            deshabilitado={prima === null}
            onClick={() => onMitigar('seguro')}
            icono={<ShieldCheck size={16} />}
            titulo="Seguro"
            detalle={prima === null ? 'MIGA no opera aquí' : `cuesta ${pct(prima, 1)}`}
          />
          <Interruptor
            activo={!!mitigacion?.comunidad}
            onClick={() => onMitigar('comunidad')}
            icono={<Users size={16} />}
            titulo="Comunidad"
            detalle={`cuesta ${pct(PARAMETROS.costoComunidad, 1)}`}
          />
        </div>
      )}

      <button className="btn-ghost w-full mt-2 flex items-center justify-center gap-1 !py-1" onClick={onAbrir} aria-expanded={abierto}>
        {abierto ? 'Ocultar ficha' : 'Ver ficha de riesgo'}
        <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="mt-2 border-t-2 border-line pt-3 text-sm space-y-3">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
            <Dato nombre="Estabilidad política" valor={`${pais.indicadores.estabilidadPolitica.toFixed(0)}/100`} />
            <Dato nombre="Calidad regulatoria" valor={`${pais.indicadores.calidadRegulatoria.toFixed(0)}/100`} />
            <Dato nombre="Estado de derecho" valor={`${pais.indicadores.estadoDeDerecho.toFixed(0)}/100`} />
            <Dato nombre="Democracia (V-Dem)" valor={pais.indicadores.democraciaLiberal.toFixed(2)} />
            <Dato nombre="Régimen" valor={pais.regimen} />
            <Dato nombre="Rating S&P" valor={pais.rating} />
            <Dato nombre="Crecimiento 2026 (FMI)" valor={`${pais.crecimiento2026.toLocaleString('es-CL')}%`} />
          </dl>
          <div>
            <p className="font-bold">Probabilidad de cada evento en un año normal</p>
            <ul className="mt-1 space-y-1">
              {principales.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <IconoEvento tipo={t} size={14} />
                  <span className="w-36 shrink-0 text-xs">{EVENTOS[t].nombre}</span>
                  <span className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                    <span className="block h-full bg-ink" style={{ width: `${Math.min(100, probs[t] * 250)}%` }} />
                  </span>
                  <span className="w-10 text-right text-xs tabular">{pct(probs[t])}</span>
                  {alertas?.has(t) && <AlertTriangle size={13} className="text-amber-ink" aria-label="alerta este año" />}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted">WGI 2024 (Banco Mundial), V-Dem 2025, FMI WEO 2026, S&P 2025-26.</p>
        </div>
      )}
    </li>
  );
}

export function MedidorRiesgo({ riesgo, grande = false }: { riesgo: number; grande?: boolean }) {
  const nivel = riesgo >= 6 ? 'Alto' : riesgo >= 3.5 ? 'Medio' : 'Bajo';
  const color = riesgo >= 6 ? 'bg-loss' : riesgo >= 3.5 ? 'bg-amber' : 'bg-gain';
  return (
    <span className={`inline-flex items-center gap-1.5 ${grande ? 'text-base' : ''}`}>
      <span className={`inline-block rounded-full ${color} ${grande ? 'h-3 w-3' : 'h-2 w-2'}`} aria-hidden />
      Riesgo {riesgo.toLocaleString('es-CL')} · {nivel}
    </span>
  );
}

function Dato({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <>
      <dt className="text-muted text-xs">{nombre}</dt>
      <dd className="font-semibold text-xs text-right">{valor}</dd>
    </>
  );
}

function Interruptor(props: { activo: boolean; deshabilitado?: boolean; onClick: () => void; icono: React.ReactNode; titulo: string; detalle: string }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.deshabilitado}
      aria-pressed={props.activo}
      className={`rounded-lg border-2 px-2 py-1.5 text-left transition-colors disabled:opacity-50 ${
        props.activo ? 'bg-ink text-paper border-ink' : 'bg-surface border-line text-ink'
      }`}
    >
      <span className="flex items-center gap-1.5 font-bold text-sm">
        {props.icono}
        {props.titulo}
      </span>
      <span className={`block text-[11px] ${props.activo ? 'text-paper/80' : 'text-muted'}`}>{props.detalle}</span>
    </button>
  );
}
