import { useEffect } from 'react';
import { ShieldCheck, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { EVENTOS, TITULARES } from '../content/eventos';
import { paisPorIso } from '../content/paises';
import { PARAMETROS } from '../engine/modelo';
import type { RondaJugador } from '../lib/partida';
import { millones, pctSigno } from '../lib/formato';
import { playBadScore, playGoodScore } from '../lib/sounds';
import { useCountUp } from '../hooks/useCountUp';
import { Bandera } from './Bandera';
import { IconoEvento } from './Icono';

export function ResultadoPersonal({ ronda, anio, posicion, total }: { ronda: RondaJugador; anio: number; posicion: number | null; total: number }) {
  const r = ronda.resultado;
  const cambio = r.capitalInicial > 0 ? r.capitalFinal / r.capitalInicial - 1 : 0;
  const gano = r.capitalFinal >= r.capitalInicial;
  const valor = useCountUp(r.capitalInicial, r.capitalFinal);

  useEffect(() => {
    if (gano) playGoodScore();
    else playBadScore();
  }, [gano]);

  return (
    <div className="mt-4 space-y-4">
      <section className="card-play p-5 text-center animate-scale-in">
        <p className="text-sm font-bold uppercase tracking-wider text-muted">Tu capital al cierre de {anio}</p>
        <p className="font-display text-5xl tabular mt-2">{millones(valor)}</p>
        <p className={`inline-flex items-center gap-1 font-bold text-lg mt-1 ${gano ? 'text-gain' : 'text-loss'}`}>
          {gano ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          {pctSigno(cambio, 1)} este año
        </p>
        {posicion !== null && (
          <p className="mt-3">
            Vas <span className="tape">{posicion}°</span> de {total}
          </p>
        )}
        {ronda.automatica && (
          <p className="text-sm text-muted mt-3">No confirmaste a tiempo: se mantuvo tu cartera del año anterior.</p>
        )}
      </section>

      <ul className="space-y-3">
        {r.porPais.map((pp) => {
          const pais = paisPorIso(pp.iso2);
          return (
            <li key={pp.iso2} className={`card p-3 ${pp.eventos.some((e) => e !== 'reforma') ? 'evento-golpe' : ''}`}>
              <div className="flex items-center gap-2">
                <Bandera iso2={pp.iso2} className="h-5" />
                <span className="font-bold flex-1 truncate">{pais?.nombre}</span>
                <span className={`font-bold tabular ${pp.retorno >= 0 ? 'text-gain' : 'text-loss'}`}>{pctSigno(pp.retorno, 0)}</span>
              </div>
              <p className="text-xs text-muted tabular mt-0.5">
                {millones(pp.monto, 1)} → {millones(pp.final, 1)}
              </p>
              {pp.eventos.length === 0 && <p className="text-sm mt-1 text-ink-soft">Año sin eventos políticos: solo se movió el mercado.</p>}
              {pp.eventos.map((e) => (
                <div key={e} className={`mt-2 rounded-lg p-2 text-sm ${EVENTOS[e].positivo ? 'bg-surface-2' : 'bg-[#FDECEC]'}`}>
                  <p className="font-bold flex items-center gap-1.5">
                    <IconoEvento tipo={e} size={15} /> {EVENTOS[e].nombre}
                  </p>
                  <p className="leading-snug">{TITULARES[pp.iso2]?.[e]}</p>
                </div>
              ))}
              {pp.cubiertoPorSeguro > 0 && (
                <p className="text-sm font-semibold mt-2 flex items-center gap-1.5">
                  <ShieldCheck size={15} /> El seguro te devolvió {millones(pp.cubiertoPorSeguro, 1)}
                </p>
              )}
            </li>
          );
        })}
        {r.caja > 0 && (
          <li className="card p-3 flex items-center gap-2">
            <Wallet size={18} />
            <span className="font-bold flex-1">Caja</span>
            <span className="text-sm tabular">
              {millones(r.caja, 1)} · {pctSigno(PARAMETROS.tasaLibreDeRiesgo)}
            </span>
          </li>
        )}
      </ul>
      <p className="text-center text-sm text-muted">Mira la pantalla: ahí se ve qué pasó en el mundo.</p>
    </div>
  );
}
