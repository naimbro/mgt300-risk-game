import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { paisPorIso } from '../content/paises';
import type { Senal } from '../content/senales';
import { Bandera } from './Bandera';

/** Las señales del año. Se muestran igual en el teléfono y en el proyector (con otro tamaño). */
export function InformeAnual({ senales, anio, grande = false }: { senales: Senal[]; anio: number; grande?: boolean }) {
  return (
    <section aria-labelledby="informe-titulo">
      <h2 id="informe-titulo" className={`font-display ${grande ? 'text-3xl' : 'text-lg'}`}>
        Informe de riesgo {anio}
      </h2>
      <p className={`text-muted ${grande ? 'text-lg' : 'text-sm'}`}>
        Escenarios de ficción basados en episodios reales. Una alerta sube la probabilidad de un evento este año; no lo garantiza.
      </p>
      <ul className={`mt-3 grid gap-3 ${grande ? 'lg:grid-cols-3' : ''}`}>
        {senales.map((s, i) => {
          const pais = paisPorIso(s.iso2);
          const alerta = s.tono === 'alerta';
          return (
            <li
              key={s.id}
              className={`card-ink p-3 animate-slide-up ${grande ? 'p-5' : ''} ${i % 2 ? 'tilt-b' : 'tilt-a'}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center gap-2">
                <Bandera iso2={s.iso2} className={grande ? 'h-7' : 'h-5'} />
                <span className={`font-bold ${grande ? 'text-xl' : ''}`}>{pais?.nombre}</span>
                <span className={`chip ml-auto ${alerta ? 'bg-amber border-ink text-ink' : 'bg-surface-2 border-line text-ink-soft'}`}>
                  {alerta ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                  {alerta ? 'Alerta' : 'Calma'}
                </span>
              </div>
              <p className={`mt-2 leading-snug ${grande ? 'text-xl' : 'text-[15px]'}`}>{s.titular}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
