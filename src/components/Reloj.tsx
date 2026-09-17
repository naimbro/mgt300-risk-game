import { useEffect, useRef } from 'react';
import { useAhora } from '../hooks/usePartida';
import { playCountdownTick } from '../lib/sounds';

export function segundosRestantes(terminaEn: number | null, ahora: number): number {
  if (!terminaEn) return 0;
  return Math.max(0, Math.ceil((terminaEn - ahora) / 1000));
}

export function Reloj({ terminaEn, grande = false, sonido = false }: { terminaEn: number | null; grande?: boolean; sonido?: boolean }) {
  const ahora = useAhora();
  const s = segundosRestantes(terminaEn, ahora);
  const ultimo = useRef(s);
  useEffect(() => {
    if (sonido && s !== ultimo.current && s <= 5 && s > 0) playCountdownTick(s);
    ultimo.current = s;
  }, [s, sonido]);
  const critico = s <= 10;
  const texto = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div
      className={`tabular font-display rounded-xl border-[2.5px] border-ink text-center ${critico ? 'bg-amber timer-critical' : 'bg-surface'} ${
        grande ? 'text-6xl px-6 py-3' : 'text-xl px-3 py-1'
      }`}
      aria-label={`Quedan ${s} segundos`}
    >
      {texto}
    </div>
  );
}
