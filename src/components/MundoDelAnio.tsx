import { ShieldCheck } from 'lucide-react';
import { EVENTOS, TITULARES } from '../content/eventos';
import { PAISES } from '../content/paises';
import { PARAMETROS } from '../engine/modelo';
import { resolverPais } from '../engine/resolver';
import type { Mundo } from '../engine/tipos';
import { pctSigno } from '../lib/formato';
import { Bandera } from './Bandera';
import { IconoEvento } from './Icono';

/** Proyector: qué le pasó a cada país este año, igual para todo el curso. */
export function MundoDelAnio({ mundo, anio }: { mundo: Mundo; anio: number }) {
  const global = mundo.shockGlobal;
  const hubo = mundo.eventos.filter((e) => e.tipo !== 'reforma').length;
  return (
    <section>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
        <h2 className="font-display text-4xl">El mundo en {anio}</h2>
        <p className="text-xl text-ink-soft">
          Economía global {global > 0.02 ? 'en auge' : global < -0.02 ? 'en contracción' : 'estable'} ({pctSigno(global, 0)}) · {hubo}{' '}
          {hubo === 1 ? 'evento político' : 'eventos políticos'}
        </p>
      </div>
      <ul className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        {PAISES.map((p, i) => {
          const r = resolverPais(p, mundo, undefined);
          const eventos = r.eventos;
          const golpe = eventos.some((e) => e !== 'reforma');
          return (
            <li
              key={p.iso2}
              className={`card-ink p-4 animate-slide-up ${golpe ? 'border-loss' : ''}`}
              style={{ animationDelay: `${i * 180}ms`, ...(golpe ? { boxShadow: '0 3px 0 var(--loss)' } : {}) }}
            >
              <div className="flex items-center gap-2">
                <Bandera iso2={p.iso2} className="h-7" />
                <span className="font-bold text-lg truncate flex-1">{p.nombre}</span>
                <span className={`font-display text-2xl tabular ${r.retorno >= 0 ? 'text-gain' : 'text-loss'}`}>{pctSigno(r.retorno)}</span>
              </div>
              {eventos.length === 0 ? (
                <p className="text-muted mt-2">Sin eventos políticos: el negocio rindió {pctSigno(r.mercado)}.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {eventos.map((e) => (
                    <li key={e} className={`rounded-lg p-2 ${EVENTOS[e].positivo ? 'bg-surface-2' : 'bg-[#FDECEC]'}`}>
                      <p className="font-bold flex items-center gap-1.5">
                        <IconoEvento tipo={e} size={18} /> {EVENTOS[e].nombre} {pctSigno(PARAMETROS.impacto[e])}
                        {PARAMETROS.coberturaSeguro[e] && p.seguroDisponible && (
                          <span className="chip border-ink ml-auto" title="Cubierto por el seguro">
                            <ShieldCheck size={12} /> seguro
                          </span>
                        )}
                      </p>
                      <p className="leading-snug text-[15px]">{TITULARES[p.iso2]?.[e]}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted mt-3">Retorno de un proyecto sin seguro ni relación con la comunidad. En los países riesgosos el negocio rinde más en los años normales: esa es la prima por riesgo, y es la que los eventos se llevan. Los titulares son escenarios de ficción inspirados en episodios reales.</p>
    </section>
  );
}
