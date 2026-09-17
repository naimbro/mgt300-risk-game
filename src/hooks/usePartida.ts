import { useEffect, useState } from 'react';
import { asegurarSesion } from '../lib/firebase';
import { escucharEstado, escucharPartida, escucharRespuestas, type EstadoJugador, type Partida } from '../lib/partida';

export function useSesion(): string | null {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    asegurarSesion().then((u) => setUid(u.uid)).catch(() => setUid(null));
  }, []);
  return uid;
}

export function usePartida(codigo: string | undefined) {
  const [partida, setPartida] = useState<Partida | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!codigo) return;
    let off: (() => void) | undefined;
    asegurarSesion().then(() => {
      off = escucharPartida(codigo, setPartida, (e) => setError(e.message));
    });
    return () => off?.();
  }, [codigo]);
  return { partida, error };
}

/**
 * Quiénes ya decidieron en la ronda dada. Se VACÍA al cambiar de ronda: si
 * conserva las respuestas del año anterior, el cierre automático del profesor
 * cree que todos decidieron y cierra el año recién abierto al instante.
 */
export function useRespuestas(codigo: string | undefined, ronda: number | undefined): Set<string> {
  const [estado, setEstado] = useState<{ ronda: number | undefined; uids: Set<string> }>({ ronda, uids: new Set() });
  useEffect(() => {
    setEstado({ ronda, uids: new Set() });
    if (!codigo || !ronda) return;
    return escucharRespuestas(codigo, ronda, (uids) => setEstado({ ronda, uids }));
  }, [codigo, ronda]);
  return estado.ronda === ronda ? estado.uids : new Set();
}

export function useEstadoJugador(codigo: string | undefined, uid: string | null): EstadoJugador | null {
  const [estado, setEstado] = useState<EstadoJugador | null>(null);
  useEffect(() => {
    if (!codigo || !uid) return;
    return escucharEstado(codigo, uid, setEstado);
  }, [codigo, uid]);
  return estado;
}

/**
 * Reloj que avanza cada `ms` para cuentas regresivas.
 *
 * También se actualiza al volver a la pestaña: Chrome frena los temporizadores
 * de las pestañas en segundo plano, y el profesor pasa a sus diapositivas a
 * mitad de ronda. Sin esto, el año no se cierra hasta que vuelve a mirar.
 */
export function useAhora(ms = 250): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const marcar = () => setAhora(Date.now());
    const t = setInterval(marcar, ms);
    document.addEventListener('visibilitychange', marcar);
    window.addEventListener('focus', marcar);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', marcar);
      window.removeEventListener('focus', marcar);
    };
  }, [ms]);
  return ahora;
}
