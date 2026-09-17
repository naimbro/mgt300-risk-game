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

export function useRespuestas(codigo: string | undefined, ronda: number | undefined): Set<string> {
  const [uids, setUids] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!codigo || !ronda) return;
    return escucharRespuestas(codigo, ronda, setUids);
  }, [codigo, ronda]);
  return uids;
}

export function useEstadoJugador(codigo: string | undefined, uid: string | null): EstadoJugador | null {
  const [estado, setEstado] = useState<EstadoJugador | null>(null);
  useEffect(() => {
    if (!codigo || !uid) return;
    return escucharEstado(codigo, uid, setEstado);
  }, [codigo, uid]);
  return estado;
}

/** Reloj que avanza cada `ms` para cuentas regresivas. */
export function useAhora(ms = 250): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return ahora;
}
