import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, Clock, Flag, Users } from 'lucide-react';
import { BotonSonido } from '../components/BotonSonido';
import { Cierre } from '../components/Cierre';
import { InformeAnual } from '../components/InformeAnual';
import { MundoDelAnio } from '../components/MundoDelAnio';
import { Ranking } from '../components/Ranking';
import { Reloj, segundosRestantes } from '../components/Reloj';
import { Bandera } from '../components/Bandera';
import { MedidorRiesgo } from '../components/DecisionCartera';
import { anioDeRonda } from '../content/eventos';
import { PAISES } from '../content/paises';
import type { Senal } from '../content/senales';
import { retornoEsperado, riesgoPais } from '../engine/modelo';
import { useAhora, usePartida, useRespuestas, useSesion } from '../hooks/usePartida';
import { pct } from '../lib/formato';
import { currentJoinUrl } from '../lib/joinUrl';
import { abrirRonda, cerrarRonda, extenderTiempo, senalesDeRonda, terminarPartida, type Partida } from '../lib/partida';
import { initAudio, playPlayerJoin, playTensionSweep } from '../lib/sounds';

export default function Anfitrion() {
  const { codigo = '' } = useParams();
  const uid = useSesion();
  const { partida, error } = usePartida(codigo);

  if (error) return <Pantalla>No se pudo conectar: {error}</Pantalla>;
  if (partida === undefined || !uid) return <Pantalla>Conectando…</Pantalla>;
  if (partida === null) return <Pantalla>No existe la partida {codigo}.</Pantalla>;
  if (partida.hostUid !== uid) {
    return (
      <Pantalla>
        Esta partida la conduce otro navegador. Para jugar, entra como alumno.{' '}
        <Link className="underline" to={`/?codigo=${codigo}`}>Entrar</Link>
      </Pantalla>
    );
  }
  return <Conduccion partida={partida} />;
}

function Conduccion({ partida }: { partida: Partida }) {
  const respondieron = useRespuestas(partida.codigo, partida.fase === 'decision' ? partida.ronda : undefined);
  const ahora = useAhora(500);
  const [ocupado, setOcupado] = useState(false);
  const [vista, setVista] = useState<'mundo' | 'ranking'>('mundo');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  // Candado sincrónico: el cierre automático y el botón pueden coincidir.
  const candado = useRef(false);

  const jugadores = Object.keys(partida.jugadores);
  const decidieron = jugadores.filter((u) => respondieron.has(u)).length;
  const anio = anioDeRonda(partida.anioInicial, Math.max(1, partida.ronda));
  const ultima = partida.ronda >= partida.totalRondas;

  async function accion(fn: () => Promise<void>) {
    if (candado.current) return;
    candado.current = true;
    setOcupado(true);
    setErrorAccion(null);
    try {
      await fn();
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'Algo falló. Intenta de nuevo.');
    } finally {
      candado.current = false;
      setOcupado(false);
    }
  }

  // Sonido al entrar alguien a la sala.
  const cantidadAnterior = useRef(jugadores.length);
  useEffect(() => {
    if (partida.fase === 'lobby' && jugadores.length > cantidadAnterior.current) playPlayerJoin();
    cantidadAnterior.current = jugadores.length;
  }, [jugadores.length, partida.fase]);

  // Cierre automático: se acabó el tiempo, o todos decidieron (con 3 s de gracia).
  const todosDecidieron = jugadores.length > 0 && decidieron === jugadores.length;
  const [todosDesde, setTodosDesde] = useState<number | null>(null);
  useEffect(() => {
    setTodosDesde(todosDecidieron ? Date.now() : null);
  }, [todosDecidieron, partida.ronda]);
  useEffect(() => {
    if (partida.fase !== 'decision' || partida.faseTerminaEn === null) return;
    // Colchón desde que se abrió el año: protege de cerrar con datos de la ronda anterior.
    const abierto = ahora - partida.faseIniciadaEn > 5000;
    const sinTiempo = segundosRestantes(partida.faseTerminaEn, ahora) === 0;
    const gracia = abierto && todosDesde !== null && ahora - todosDesde > 3000;
    if (sinTiempo || gracia) {
      void accion(async () => {
        playTensionSweep();
        await cerrarRonda(partida);
        setVista('mundo');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, partida.fase, partida.faseTerminaEn, todosDesde]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-paper">
        <div className="max-w-[1500px] mx-auto flex items-center gap-4 px-6 py-3">
          <span className="font-display text-xl">Riesgo político</span>
          <span className="chip border-orange text-orange text-base">{partida.codigo}</span>
          {partida.fase !== 'lobby' && <span className="font-display text-xl">Año {anio} · {partida.ronda}/{partida.totalRondas}</span>}
          <span className="ml-auto flex items-center gap-2 font-bold">
            <Users size={18} /> {jugadores.length}
          </span>
          <span className="[&_button]:text-paper [&_button:hover]:bg-ink-soft">
            <BotonSonido />
          </span>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 py-6">
        {errorAccion && (
          <p className="card border-loss text-loss font-semibold p-3 mb-4" role="alert">
            {errorAccion}
          </p>
        )}

        {partida.fase === 'lobby' && (
          <Sala partida={partida} ocupado={ocupado} onComenzar={() => accion(async () => { initAudio(); await abrirRonda(partida); })} />
        )}

        {partida.fase === 'decision' && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <InformeAnual senales={senalesDeRonda(partida, partida.ronda) as Senal[]} anio={anio} grande />
              <MapaRiesgo />
            </div>
            <aside className="space-y-4">
              <Reloj terminaEn={partida.faseTerminaEn} grande sonido />
              <div className="card-ink p-4 text-center">
                <p className="font-display text-5xl tabular">
                  {decidieron}
                  <span className="text-muted text-3xl">/{jugadores.length}</span>
                </p>
                <p className="font-bold">decidieron</p>
                <div className="h-3 bg-surface-3 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-orange transition-all" style={{ width: `${jugadores.length ? (100 * decidieron) / jugadores.length : 0}%` }} />
                </div>
              </div>
              <button className="btn-secondary w-full flex items-center justify-center gap-2" disabled={ocupado} onClick={() => accion(() => extenderTiempo(partida, 30))}>
                <Clock size={18} /> +30 segundos
              </button>
              <button className="btn-primary w-full" disabled={ocupado} onClick={() => accion(async () => { playTensionSweep(); await cerrarRonda(partida); setVista('mundo'); })}>
                Cerrar el año ahora
              </button>
              <p className="text-sm text-muted">Se cierra solo cuando se acaba el tiempo o cuando todos decidieron. Quien no alcance mantiene su cartera anterior.</p>
            </aside>
          </div>
        )}

        {partida.fase === 'resultados' && (
          <div>
            <div className="flex gap-3 mb-6">
              <button className={`${vista === 'mundo' ? 'btn-primary' : 'btn-secondary'} !py-2`} onClick={() => setVista('mundo')}>El mundo</button>
              <button className={`${vista === 'ranking' ? 'btn-primary' : 'btn-secondary'} !py-2`} onClick={() => setVista('ranking')}>Ranking</button>
              <div className="ml-auto flex gap-3">
                {vista === 'mundo' ? (
                  <button className="btn-primary !py-2 flex items-center gap-2" onClick={() => setVista('ranking')}>
                    Ver ranking <ArrowRight size={18} />
                  </button>
                ) : ultima ? (
                  <button className="btn-primary !py-2 flex items-center gap-2" disabled={ocupado} onClick={() => accion(() => terminarPartida(partida))}>
                    <Flag size={18} /> Terminar y ver cierre
                  </button>
                ) : (
                  <button className="btn-primary !py-2 flex items-center gap-2" disabled={ocupado} onClick={() => accion(() => abrirRonda(partida))}>
                    Año {anio + 1} <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
            {vista === 'mundo' && partida.mundos[String(partida.ronda)] && <MundoDelAnio mundo={partida.mundos[String(partida.ronda)]} anio={anio} />}
            {vista === 'ranking' && (
              <section className="max-w-4xl">
                <h2 className="font-display text-4xl mb-4">Ranking {anio}</h2>
                <Ranking partida={partida} capitalesAntes={partida.capitalesAnteriores} />
              </section>
            )}
          </div>
        )}

        {partida.fase === 'final' && <Cierre partida={partida} />}
      </main>
    </div>
  );
}

function Sala({ partida, ocupado, onComenzar }: { partida: Partida; ocupado: boolean; onComenzar: () => void }) {
  const url = currentJoinUrl(partida.codigo);
  const nombres = Object.values(partida.jugadores).sort((a, b) => a.unidoEn - b.unidoEn);
  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
      <div className="card-play p-6 text-center">
        <QRCodeSVG value={url} size={300} marginSize={1} />
        <p className="font-display text-6xl tracking-[0.2em] mt-4">{partida.codigo}</p>
        <p className="text-muted mt-1 break-all">{url.replace(/^https?:\/\//, '').replace(/\?codigo=.*/, '')}</p>
      </div>
      <div>
        <h1 className="font-display text-5xl leading-none">
          Gobernar e invertir <br />
          <span className="tape tilt-a mt-2">en la era de la IA</span>
        </h1>
        <ol className="mt-6 space-y-2 text-2xl">
          <li><strong>1.</strong> Cada año llega un informe de riesgo.</li>
          <li><strong>2.</strong> Reparten US$ 100 M entre proyectos de IA en ocho países, y deciden si asegurarse o invertir en la comunidad.</li>
          <li><strong>3.</strong> El mundo sortea economía y política. Lo que pasa es igual para todos.</li>
        </ol>
        <div className="mt-8 flex items-center gap-4">
          <button className="btn-primary text-xl !px-10 !py-4" disabled={ocupado || nombres.length === 0} onClick={onComenzar}>
            Comenzar
          </button>
          <span className="text-xl font-bold">{nombres.length} en la sala</span>
        </div>
        <ul className="flex flex-wrap gap-2 mt-6">
          {nombres.map((j, i) => (
            <li key={`${j.nombre}-${j.unidoEn}`} className={`card-ink px-3 py-1.5 text-lg font-bold animate-scale-in ${i % 2 ? 'tilt-b' : 'tilt-a'}`}>
              {j.nombre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MapaRiesgo() {
  const orden = [...PAISES].sort((a, b) => riesgoPais(a.indicadores) - riesgoPais(b.indicadores));
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">Los ocho proyectos</h2>
      <ul className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
        {orden.map((p) => (
          <li key={p.iso2} className="card p-3">
            <div className="flex items-center gap-2">
              <Bandera iso2={p.iso2} className="h-6" />
              <span className="font-bold text-lg truncate">{p.nombre}</span>
            </div>
            <p className="text-sm text-muted leading-tight mt-1">{p.proyecto}</p>
            <p className="mt-2 font-semibold"><MedidorRiesgo riesgo={riesgoPais(p.indicadores)} grande /></p>
            <p className="text-sm">Retorno esperado {pct(retornoEsperado(p), 1)} al año</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-trama flex items-center justify-center text-2xl font-semibold px-6 text-center">{children}</div>;
}
