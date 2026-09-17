import {
  doc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db, asegurarSesion } from './firebase';
import { PAISES } from '../content/paises';
import { SENALES, sortearSenales } from '../content/senales';
import { paisesInestables, resolverCartera, sortearMundo } from '../engine/resolver';
import { rngCripto } from '../engine/rng';
import type { Cartera, Mundo, ResultadoRonda, SenalAplicada } from '../engine/tipos';

// Modelo de datos (colección `partidas`, separada de `games` de la versión 2025):
//
//   partidas/{CODIGO}                       estado público; lo escribe el profesor
//     .jugadores[uid], .capitales[uid]      cada alumno agrega SOLO su entrada al unirse
//   partidas/{CODIGO}/respuestas/{uid}_{r}  "ya decidí" (público: alimenta el contador)
//   partidas/{CODIGO}/carteras/{uid}_{r}    qué decidió (solo el profesor y el alumno)
//   partidas/{CODIGO}/jugadores/{uid}       historial con resultados (lo escribe el profesor)
//   partidas/{CODIGO}/memos/{uid}           recomendación final al directorio
//
// El navegador del profesor es el motor: abre y cierra rondas, sortea el mundo y
// escribe resultados. Si se cierra, reabrir su enlace retoma la partida.

export type Fase = 'lobby' | 'decision' | 'resultados' | 'final';

export interface Partida {
  codigo: string;
  version: 2;
  hostUid: string;
  fase: Fase;
  ronda: number;
  totalRondas: number;
  duracionSeg: number;
  anioInicial: number;
  creadaEn: number;
  /** Reloj del profesor, en ms. */
  faseTerminaEn: number | null;
  jugadores: Record<string, { nombre: string; unidoEn: number }>;
  capitales: Record<string, number>;
  /** ronda -> ids de señales del informe. */
  senales: Record<string, string[]>;
  /** ronda -> mundo sorteado. Existe solo cuando la ronda ya se resolvió. */
  mundos: Record<string, Mundo>;
}

export interface RondaJugador {
  ronda: number;
  cartera: Cartera;
  /** true si no envió y se mantuvo su cartera anterior. */
  automatica: boolean;
  resultado: ResultadoRonda;
}

export interface EstadoJugador {
  uid: string;
  nombre: string;
  historial: RondaJugador[];
}

export const CAPITAL_INICIAL = 100;
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const refPartida = (codigo: string) => doc(db, 'partidas', codigo);

export function limpiarCodigo(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

export async function crearPartida(opts: { totalRondas: number; duracionSeg: number }): Promise<string> {
  const user = await asegurarSesion();
  for (let intento = 0; intento < 5; intento++) {
    const codigo = Array.from(crypto.getRandomValues(new Uint32Array(5)), (n) => LETRAS[n % LETRAS.length]).join('');
    const ref = refPartida(codigo);
    const creada = await runTransaction(db, async (tx) => {
      if ((await tx.get(ref)).exists()) return false;
      const partida: Partida = {
        codigo,
        version: 2,
        hostUid: user.uid,
        fase: 'lobby',
        ronda: 0,
        totalRondas: opts.totalRondas,
        duracionSeg: opts.duracionSeg,
        anioInicial: 2027,
        creadaEn: Date.now(),
        faseTerminaEn: null,
        jugadores: {},
        capitales: {},
        senales: {},
        mundos: {},
      };
      tx.set(ref, partida);
      return true;
    });
    if (creada) return codigo;
  }
  throw new Error('No se pudo crear la partida. Intenta de nuevo.');
}

export async function unirse(codigo: string, nombre: string): Promise<void> {
  const user = await asegurarSesion();
  const snap = await getDoc(refPartida(codigo));
  if (!snap.exists()) throw new Error('No existe una partida con ese código.');
  const p = snap.data() as Partida;
  if (p.jugadores[user.uid]) return; // ya estaba: vuelve a entrar
  if (p.fase === 'final') throw new Error('Esta partida ya terminó.');
  await updateDoc(refPartida(codigo), {
    [`jugadores.${user.uid}`]: { nombre: nombre.trim().slice(0, 24), unidoEn: Date.now() },
    [`capitales.${user.uid}`]: CAPITAL_INICIAL,
  });
}

export function escucharPartida(codigo: string, cb: (p: Partida | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(refPartida(codigo), (s) => cb(s.exists() ? (s.data() as Partida) : null), onError);
}

export function escucharRespuestas(codigo: string, ronda: number, cb: (uids: Set<string>) => void) {
  const q = query(collection(db, 'partidas', codigo, 'respuestas'), where('ronda', '==', ronda));
  return onSnapshot(q, (s) => cb(new Set(s.docs.map((d) => d.data().uid as string))));
}

export function escucharEstado(codigo: string, uid: string, cb: (e: EstadoJugador | null) => void) {
  return onSnapshot(doc(db, 'partidas', codigo, 'jugadores', uid), (s) => cb(s.exists() ? (s.data() as EstadoJugador) : null));
}

export async function enviarCartera(codigo: string, ronda: number, cartera: Cartera): Promise<void> {
  const user = await asegurarSesion();
  const id = `${user.uid}_${ronda}`;
  const batch = writeBatch(db);
  batch.set(doc(db, 'partidas', codigo, 'carteras', id), { uid: user.uid, ronda, ...cartera });
  batch.set(doc(db, 'partidas', codigo, 'respuestas', id), { uid: user.uid, ronda });
  await batch.commit();
}

export async function miCartera(codigo: string, ronda: number): Promise<Cartera | null> {
  const user = await asegurarSesion();
  const s = await getDoc(doc(db, 'partidas', codigo, 'carteras', `${user.uid}_${ronda}`));
  return s.exists() ? (s.data() as Cartera) : null;
}

export async function guardarMemo(codigo: string, texto: string): Promise<void> {
  const user = await asegurarSesion();
  await setDoc(doc(db, 'partidas', codigo, 'memos', user.uid), { uid: user.uid, texto: texto.trim().slice(0, 280), enviadoEn: Date.now() });
}

// ── Acciones del profesor ───────────────────────────────────────────────────

export function senalesDeRonda(p: Partida, ronda: number): SenalAplicada[] {
  return (p.senales[String(ronda)] ?? []).map((id) => SENALES.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
}

export async function abrirRonda(p: Partida): Promise<void> {
  const ronda = p.ronda + 1;
  const usadas = Object.values(p.senales).flat();
  const ids = p.senales[String(ronda)] ?? sortearSenales(usadas, rngCripto()).map((s) => s.id);
  await updateDoc(refPartida(p.codigo), {
    fase: 'decision',
    ronda,
    [`senales.${ronda}`]: ids,
    faseTerminaEn: Date.now() + p.duracionSeg * 1000,
  });
}

/**
 * Cierra la ronda: sortea el mundo UNA vez y resuelve todas las carteras.
 * Es idempotente: si el mundo de esta ronda ya existe (p. ej. el profesor
 * recargó a mitad de camino), se reutiliza en vez de sortear otro.
 */
export async function cerrarRonda(p: Partida): Promise<void> {
  const ronda = p.ronda;
  const clave = String(ronda);
  const anterior = p.mundos[String(ronda - 1)];
  const mundo =
    p.mundos[clave] ??
    sortearMundo(
      PAISES,
      { senales: senalesDeRonda(p, ronda), inestablesRondaAnterior: anterior ? paisesInestables(anterior) : [] },
      rngCripto(),
    );

  const [carterasSnap, estadosSnap] = await Promise.all([
    getDocs(query(collection(db, 'partidas', p.codigo, 'carteras'), where('ronda', '==', ronda))),
    getDocs(collection(db, 'partidas', p.codigo, 'jugadores')),
  ]);
  const carteras = new Map(carterasSnap.docs.map((d) => [d.data().uid as string, d.data() as Cartera]));
  const estados = new Map(estadosSnap.docs.map((d) => [d.id, d.data() as EstadoJugador]));

  const batch = writeBatch(db);
  const capitales: Record<string, number> = {};
  for (const [uid, j] of Object.entries(p.jugadores)) {
    const estado = estados.get(uid) ?? { uid, nombre: j.nombre, historial: [] };
    if (estado.historial.some((h) => h.ronda === ronda)) {
      capitales[uid] = estado.historial.find((h) => h.ronda === ronda)!.resultado.capitalFinal;
      continue;
    }
    const enviada = carteras.get(uid);
    // Quien no alcanza a decidir mantiene su cartera anterior (las inversiones no se
    // desarman solas); si nunca decidió, queda todo en caja.
    const previa = estado.historial.at(-1)?.cartera;
    const cartera: Cartera = enviada
      ? { pesos: enviada.pesos ?? {}, mitigacion: enviada.mitigacion ?? {} }
      : previa ?? { pesos: {}, mitigacion: {} };
    const capital = p.capitales[uid] ?? CAPITAL_INICIAL;
    const resultado = resolverCartera(PAISES, cartera, capital, mundo);
    capitales[uid] = resultado.capitalFinal;
    batch.set(doc(db, 'partidas', p.codigo, 'jugadores', uid), {
      uid,
      nombre: j.nombre,
      historial: [...estado.historial, { ronda, cartera, automatica: !enviada, resultado }],
    } satisfies EstadoJugador);
  }
  batch.update(refPartida(p.codigo), {
    [`mundos.${clave}`]: mundo,
    capitales: { ...p.capitales, ...capitales },
    fase: 'resultados',
    faseTerminaEn: null,
  });
  await batch.commit();
}

export async function terminarPartida(p: Partida): Promise<void> {
  await updateDoc(refPartida(p.codigo), { fase: 'final', faseTerminaEn: null });
}

export async function extenderTiempo(p: Partida, segundos: number): Promise<void> {
  await updateDoc(refPartida(p.codigo), { faseTerminaEn: Math.max(Date.now(), p.faseTerminaEn ?? 0) + segundos * 1000 });
}

export async function expulsar(p: Partida, uid: string): Promise<void> {
  await updateDoc(refPartida(p.codigo), { [`jugadores.${uid}`]: deleteField(), [`capitales.${uid}`]: deleteField() });
}

/** Solo el profesor: historiales completos y memos, para el cierre. */
export async function cargarCierre(codigo: string): Promise<{ estados: EstadoJugador[]; memos: { uid: string; texto: string }[] }> {
  const [e, m] = await Promise.all([
    getDocs(collection(db, 'partidas', codigo, 'jugadores')),
    getDocs(collection(db, 'partidas', codigo, 'memos')),
  ]);
  return {
    estados: e.docs.map((d) => d.data() as EstadoJugador),
    memos: m.docs.map((d) => d.data() as { uid: string; texto: string }),
  };
}
