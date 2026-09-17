import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, Hourglass } from 'lucide-react';
import { BotonSonido } from '../components/BotonSonido';
import { DecisionCartera } from '../components/DecisionCartera';
import { InformeAnual } from '../components/InformeAnual';
import { Reloj } from '../components/Reloj';
import { ResultadoPersonal } from '../components/ResultadoPersonal';
import { Bandera } from '../components/Bandera';
import { anioDeRonda } from '../content/eventos';
import { paisPorIso } from '../content/paises';
import { useEstadoJugador, usePartida, useRespuestas, useSesion } from '../hooks/usePartida';
import { millones, posiciones, pctSigno } from '../lib/formato';
import { enviarCartera, guardarMemo, senalesDeRonda, type EstadoJugador, type Partida } from '../lib/partida';
import { playPodiumFanfare, playRoundStart, playSubmitSuccess } from '../lib/sounds';
import { confettiPodium } from '../lib/confetti';
import type { Senal } from '../content/senales';

export default function Jugador() {
  const { codigo = '' } = useParams();
  const uid = useSesion();
  const { partida, error } = usePartida(codigo);
  const estado = useEstadoJugador(codigo, uid);
  const respondieron = useRespuestas(codigo, partida?.fase === 'decision' ? partida.ronda : undefined);

  if (error) return <Centro>No se pudo conectar: {error}</Centro>;
  if (partida === undefined || !uid) return <Centro>Conectando…</Centro>;
  if (partida === null) return <Navigate to={`/?codigo=${codigo}`} replace />;
  if (!partida.jugadores[uid]) return <Navigate to={`/?codigo=${codigo}`} replace />;

  const capital = partida.capitales[uid] ?? 100;
  const anio = anioDeRonda(partida.anioInicial, Math.max(1, partida.ronda));

  return (
    <div className="min-h-screen bg-trama">
      <header className="sticky top-0 z-10 bg-ink text-paper">
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 py-2">
          <span className="font-display text-sm">{partida.fase === 'lobby' ? 'Sala' : `Año ${anio}`}</span>
          <span className="chip border-orange text-orange">{partida.codigo}</span>
          <span className="ml-auto font-bold tabular text-sm">{millones(capital)}</span>
          <span className="[&_button]:text-paper [&_button:hover]:bg-ink-soft">
            <BotonSonido />
          </span>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 pb-10">
        <p className="mt-3 text-sm text-muted truncate">Directorio de {partida.jugadores[uid].nombre}</p>
        <Fase partida={partida} uid={uid} estado={estado} capital={capital} anio={anio} yaRespondio={respondieron.has(uid)} />
      </main>
    </div>
  );
}

function Fase({ partida, uid, estado, capital, anio, yaRespondio }: { partida: Partida; uid: string; estado: EstadoJugador | null; capital: number; anio: number; yaRespondio: boolean }) {
  const senales = useMemo(() => senalesDeRonda(partida, partida.ronda) as Senal[], [partida]);
  const ranking = useMemo(() => posiciones(Object.entries(partida.capitales), ([, c]) => c), [partida.capitales]);
  const miPosicion = ranking.find((r) => r.item[0] === uid)?.posicion ?? null;
  const total = Object.keys(partida.jugadores).length;

  useEffect(() => {
    if (partida.fase === 'decision') playRoundStart();
  }, [partida.fase, partida.ronda]);

  switch (partida.fase) {
    case 'lobby':
      return (
        <section className="card-play p-5 mt-4">
          <CheckCircle2 className="text-gain" size={32} />
          <h1 className="font-display text-2xl mt-2">Estás dentro</h1>
          <p className="mt-2">
            Empiezas con <strong>{millones(100)}</strong>. Cada año lees un informe de riesgo, repartes tu capital entre proyectos en ocho países y
            decides si contratar seguro o invertir en la relación con la comunidad.
          </p>
          <p className="mt-3">Después, el mundo reparte suerte y política. Gana quien termine con más capital, pero en el cierre veremos quién decidió bien.</p>
          <p className="mt-4 text-sm text-muted">Espera a que tu profesor comience. Mira la pantalla.</p>
        </section>
      );

    case 'decision':
      if (yaRespondio) {
        return (
          <section className="card-play p-5 mt-4 text-center">
            <Hourglass className="mx-auto" size={32} />
            <h1 className="font-display text-2xl mt-2">Decisión enviada</h1>
            <p className="mt-2">Esperando que el resto del directorio decida y que termine el año.</p>
            <div className="flex justify-center mt-4">
              <Reloj terminaEn={partida.faseTerminaEn} />
            </div>
          </section>
        );
      }
      return (
        <>
          <div className="flex items-center justify-between mt-3">
            <h1 className="font-display text-2xl">Año {anio}</h1>
            <Reloj terminaEn={partida.faseTerminaEn} sonido />
          </div>
          <div className="mt-3">
            <InformeAnual senales={senales} anio={anio} />
          </div>
          <DecisionCartera
            key={partida.ronda}
            capital={capital}
            senales={senales}
            inicial={estado?.historial.at(-1)?.cartera ?? null}
            onConfirmar={async (c) => {
              await enviarCartera(partida.codigo, partida.ronda, c);
              playSubmitSuccess();
            }}
          />
        </>
      );

    case 'resultados': {
      const ronda = estado?.historial.find((h) => h.ronda === partida.ronda);
      if (!ronda) return <Centro>Calculando resultados…</Centro>;
      return <ResultadoPersonal key={partida.ronda} ronda={ronda} anio={anio} posicion={miPosicion} total={total} />;
    }

    case 'final':
      return <Final partida={partida} estado={estado} capital={capital} posicion={miPosicion} total={total} />;
  }
}

function Final({ partida, estado, capital, posicion, total }: { partida: Partida; estado: EstadoJugador | null; capital: number; posicion: number | null; total: number }) {
  const [memo, setMemo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (posicion !== null && posicion <= 3) {
      playPodiumFanfare();
      confettiPodium();
    }
  }, [posicion]);

  const historial = estado?.historial ?? [];
  const peorAnio = historial.reduce<{ anio: number; cambio: number } | null>((peor, h) => {
    const cambio = h.resultado.capitalFinal / h.resultado.capitalInicial - 1;
    return !peor || cambio < peor.cambio ? { anio: anioDeRonda(partida.anioInicial, h.ronda), cambio } : peor;
  }, null);
  const paisesUsados = new Set(historial.flatMap((h) => Object.keys(h.cartera.pesos)));

  return (
    <div className="mt-4 space-y-4">
      <section className="card-play p-5 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-muted">Resultado final</p>
        <p className="font-display text-5xl tabular mt-2">{millones(capital)}</p>
        <p className={`font-bold ${capital >= 100 ? 'text-gain' : 'text-loss'}`}>{pctSigno(capital / 100 - 1)} en {historial.length} años</p>
        {posicion !== null && (
          <p className="mt-3 text-lg">
            Terminaste <span className="tape">{posicion}°</span> de {total}
          </p>
        )}
        {peorAnio && (
          <p className="text-sm text-ink-soft mt-3">
            Tu peor año fue {peorAnio.anio} ({pctSigno(peorAnio.cambio)}). Invertiste en {paisesUsados.size} de 8 países.
          </p>
        )}
        {paisesUsados.size > 0 && (
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
            {[...paisesUsados].map((iso) => (
              <span key={iso} title={paisPorIso(iso)?.nombre}>
                <Bandera iso2={iso} className="h-5" />
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-display text-lg">Tu recomendación al directorio</h2>
        <p className="text-sm text-ink-soft mt-1">
          En una o dos frases: ¿dónde invertirías y cómo gestionarías el riesgo político? Tu profesor la verá sin tu nombre.
        </p>
        {enviado ? (
          <p className="mt-3 font-semibold text-gain">Recibida. Gracias.</p>
        ) : (
          <form
            className="mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                await guardarMemo(partida.codigo, memo);
                setEnviado(true);
              } catch {
                setError('No se pudo enviar.');
              }
            }}
          >
            <textarea className="input min-h-28" maxLength={280} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Recomendaría…" />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted tabular">{memo.length}/280</span>
              <button className="btn-primary !py-2" disabled={memo.trim().length < 10}>
                Enviar
              </button>
            </div>
            {error && <p className="text-loss text-sm mt-2">{error}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[50vh] flex items-center justify-center text-center px-6 font-semibold">{children}</div>;
}
