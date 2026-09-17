import { useEffect } from 'react';
import type { Partida } from '../lib/partida';
import { millones, posiciones, pctSigno } from '../lib/formato';
import { playLeaderboardTick } from '../lib/sounds';

/**
 * Top 10 en el proyector. Solo nombres y capital: nada de lo que cada uno
 * decidió, y sin destacar a nadie (el profesor no juega).
 */
export function Ranking({ partida, capitalesAntes }: { partida: Partida; capitalesAntes?: Record<string, number> }) {
  const filas = posiciones(Object.entries(partida.capitales).filter(([uid]) => partida.jugadores[uid]), ([, c]) => c).slice(0, 10);

  useEffect(() => {
    filas.forEach((_, i) => setTimeout(() => playLeaderboardTick(i), 120 * i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida.ronda]);

  if (filas.length === 0) return <p className="text-xl text-muted">Nadie en la sala todavía.</p>;

  return (
    <ol className="space-y-2">
      {filas.map(({ item: [uid, capital], posicion }, i) => {
        const antes = capitalesAntes?.[uid];
        const cambio = antes ? capital / antes - 1 : null;
        return (
          <li
            key={uid}
            className="card-ink flex items-center gap-4 px-4 py-2.5 animate-slide-up"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className={`sticker w-10 h-10 flex items-center justify-center font-display text-lg shrink-0 ${posicion === 1 ? 'bg-amber' : posicion <= 3 ? 'bg-orange' : 'bg-surface-3'}`}>
              {posicion}
            </span>
            <span className="font-bold text-2xl truncate flex-1 min-w-0">{partida.jugadores[uid]?.nombre}</span>
            {cambio !== null && (
              <span className={`text-lg font-bold tabular ${cambio >= 0 ? 'text-gain' : 'text-loss'}`}>{pctSigno(cambio)}</span>
            )}
            <span className="font-display text-2xl tabular w-40 text-right">{millones(capital)}</span>
          </li>
        );
      })}
    </ol>
  );
}
