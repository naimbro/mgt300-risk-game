// Pruebas de firestore.rules (v1 `games` y v2 `partidas`). `npm run test:rules`.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection, query, where, writeBatch, Timestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-risk',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});
let pass = 0, fail = 0;
async function check(name, p) {
  try { await p; pass++; console.log('ok  ', name); }
  catch (e) { fail++; console.log('FAIL', name, String(e.message).split('\n')[0]); }
}
const db = (uid) => env.authenticatedContext(uid).firestore();
const ref = (uid, id = 'game_abc123') => doc(db(uid), 'games', id);

const game = {
  id: 'game_abc123', code: 'ABC123', status: 'waiting', currentRound: 0, totalRounds: 10,
  createdAt: Timestamp.now(), createdBy: 'host',
  players: { host: { uid: 'host', name: 'Profe', capital: 100, isAdmin: true, joinedAt: Timestamp.now(), submissions: [] } },
  rounds: {}, settings: { roundDuration: 120, initialCapital: 100 },
};
const player = (uid) => ({ uid, name: uid, capital: 100, isAdmin: false, joinedAt: Timestamp.now(), submissions: [] });
const sub = (A, B, round = 1, extra = {}) => ({ round, allocation: { A, B }, submittedAt: Timestamp.now(), ...extra });

await check('host crea partida', assertSucceeds(setDoc(ref('host'), game)));
await check('no se crea partida a nombre de otro', assertFails(setDoc(ref('alice', 'game_zzz'), { ...game, id: 'game_zzz' })));
await check('sin sesión no lee', assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'games', 'game_abc123'))));
await check('alice lee', assertSucceeds(getDoc(ref('alice'))));
await check('alice se une', assertSucceeds(updateDoc(ref('alice'), { 'players.alice': player('alice') })));
await check('bob no se une con capital 1000', assertFails(updateDoc(ref('bob'), { 'players.bob': { ...player('bob'), capital: 1000 } })));
await check('bob no se une como admin', assertFails(updateDoc(ref('bob'), { 'players.bob': { ...player('bob'), isAdmin: true } })));
await check('bob no inscribe a otro', assertFails(updateDoc(ref('bob'), { 'players.carl': player('carl') })));
await check('bob se une', assertSucceeds(updateDoc(ref('bob'), { 'players.bob': player('bob') })));
await check('alice no inicia la partida', assertFails(updateDoc(ref('alice'), { status: 'active' })));

await check('host inicia ronda', assertSucceeds(updateDoc(ref('host'), {
  'rounds.1': { round: 1, countries: { A: { iso2: 'CL' }, B: { iso2: 'US' } }, startTime: Timestamp.now(), endTime: Timestamp.now(), isActive: true },
  currentRound: 1,
})));
await check('host activa', assertSucceeds(updateDoc(ref('host'), { status: 'active' })));
await check('carl no se une tarde', assertFails(updateDoc(ref('carl'), { 'players.carl': player('carl') })));

await check('alice no se sube el capital', assertFails(updateDoc(ref('alice'), { 'players.alice.capital': 999 })));
await check('alice no invierte más que su capital', assertFails(updateDoc(ref('alice'), { 'players.alice.submissions': [sub(80, 30)] })));
await check('alice no precarga resultado', assertFails(updateDoc(ref('alice'), { 'players.alice.submissions': [sub(10, 10, 1, { result: { newCapital: 500 } })] })));
await check('alice no invierte en otra ronda', assertFails(updateDoc(ref('alice'), { 'players.alice.submissions': [sub(10, 10, 2)] })));
await check('alice no toca a bob', assertFails(updateDoc(ref('alice'), { 'players.bob.submissions': [sub(0, 0)] })));
await check('alice invierte', assertSucceeds(updateDoc(ref('alice'), { 'players.alice.submissions': [sub(60, 40)] })));
await check('bob invierte 0/0 (se acabó el tiempo)', assertSucceeds(updateDoc(ref('bob'), { 'players.bob.submissions': [sub(0, 0)] })));
await check('host invierte', assertSucceeds(updateDoc(ref('host'), { 'players.host.submissions': [sub(50, 0)] })));

const snap = (await getDoc(ref('host'))).data();
const withResult = (subs, cap) => subs.map(s => s.round === 1 ? { ...s, result: { payout: 1, netGain: 1, newCapital: cap, messageA: 'x', messageB: 'y', outcomeA: 'success', outcomeB: 'fail' } } : s);
await check('host procesa resultados', assertSucceeds(updateDoc(ref('host'), {
  'players.alice.submissions': withResult(snap.players.alice.submissions, 120), 'players.alice.capital': 120,
  'players.bob.submissions': withResult(snap.players.bob.submissions, 100), 'players.bob.capital': 100,
  'rounds.1.isActive': false,
})));
const after = (await getDoc(ref('host'))).data();
console.log('     submissions sigue siendo arreglo:', Array.isArray(after.players.alice.submissions), '| capital nuevo:', after.players.alice.submissions[0].result?.newCapital);
await check('alice no invierte con la ronda cerrada', assertFails(updateDoc(ref('alice'), { 'players.alice.submissions': [...after.players.alice.submissions, sub(1, 1)] })));

await check('host abre ronda 2', assertSucceeds(updateDoc(ref('host'), { 'rounds.2': { round: 2, isActive: true }, currentRound: 2 })));
await check('alice no reescribe su historial', assertFails(updateDoc(ref('alice'), { 'players.alice.submissions': [sub(1, 1, 2), sub(1, 1, 2)] })));
await check('alice invierte ronda 2 con capital 120', assertSucceeds(updateDoc(ref('alice'), { 'players.alice.submissions': [...after.players.alice.submissions, sub(100, 20, 2)] })));
await check('nadie borra partidas', assertFails(deleteDoc(ref('host'))));
await check('otras colecciones cerradas', assertFails(setDoc(doc(db('alice'), 'x', 'y'), { a: 1 })));

// ════════ v2: partidas ════════
const P = (uid, ...ruta) => doc(db(uid), 'partidas', 'ABCDE', ...ruta);
const partida = {
  codigo: 'ABCDE', version: 2, hostUid: 'profe', fase: 'lobby', ronda: 0, totalRondas: 5, duracionSeg: 90,
  anioInicial: 2027, creadaEn: 1, faseTerminaEn: null, jugadores: {}, capitales: {}, capitalesAnteriores: {}, senales: {}, mundos: {},
};
const unirse = (uid, extra = {}) => updateDoc(P(uid), { [`jugadores.${uid}`]: { nombre: uid, unidoEn: 1 }, [`capitales.${uid}`]: 100, ...extra });
const cartera = (uid, ronda, extra = {}) => setDoc(P(uid, 'carteras', `${uid}_${ronda}`), { uid, ronda, pesos: { CL: 50 }, mitigacion: {}, ...extra });
const respuesta = (uid, ronda) => setDoc(P(uid, 'respuestas', `${uid}_${ronda}`), { uid, ronda });

await check('v2: profe crea partida', assertSucceeds(setDoc(P('profe'), partida)));
await check('v2: no se crea con jugadores precargados', assertFails(setDoc(doc(db('x'), 'partidas', 'ZZZZZ'), { ...partida, codigo: 'ZZZZZ', hostUid: 'x', jugadores: { x: { nombre: 'x', unidoEn: 1 } } })));
await check('v2: ana se une', assertSucceeds(unirse('ana')));
await check('v2: ana no se une dos veces para resetear capital', assertFails(unirse('ana')));
await check('v2: beto no se une con 500', assertFails(updateDoc(P('beto'), { 'jugadores.beto': { nombre: 'beto', unidoEn: 1 }, 'capitales.beto': 500 })));
await check('v2: beto no inscribe a otro', assertFails(unirse('beto', { 'jugadores.caro': { nombre: 'c', unidoEn: 1 } })));
await check('v2: beto no cambia la fase al unirse', assertFails(unirse('beto', { fase: 'final' })));
await check('v2: beto se une', assertSucceeds(unirse('beto')));
await check('v2: ana no abre el año', assertFails(updateDoc(P('ana'), { fase: 'decision', ronda: 1 })));
await check('v2: ana no envía en el lobby', assertFails(cartera('ana', 1)));
await check('v2: profe abre año 1', assertSucceeds(updateDoc(P('profe'), { fase: 'decision', ronda: 1, 'senales.1': ['CL-agua'], faseTerminaEn: 2 })));
await check('v2: dani se une tarde (permitido)', assertSucceeds(unirse('dani')));
await check('v2: ana no envía cartera a nombre de beto', assertFails(setDoc(P('ana', 'carteras', 'beto_1'), { uid: 'beto', ronda: 1, pesos: {}, mitigacion: {} })));
await check('v2: ana no envía para el año 2', assertFails(cartera('ana', 2)));
await check('v2: ana no agrega campos (resultado)', assertFails(cartera('ana', 1, { capitalFinal: 999 })));
await check('v2: ana envía cartera', assertSucceeds(cartera('ana', 1)));
await check('v2: ana marca respuesta', assertSucceeds(respuesta('ana', 1)));
await check('v2: ana no cambia su cartera después', assertFails(updateDoc(P('ana', 'carteras', 'ana_1'), { pesos: { MX: 100 } })));
await check('v2: beto lee quién respondió', assertSucceeds(getDoc(P('beto', 'respuestas', 'ana_1'))));
await check('v2: beto NO lee la cartera de ana', assertFails(getDoc(P('beto', 'carteras', 'ana_1'))));
await check('v2: ana lee su cartera', assertSucceeds(getDoc(P('ana', 'carteras', 'ana_1'))));
await check('v2: profe lee carteras del año', assertSucceeds(getDocs(query(collection(db('profe'), 'partidas', 'ABCDE', 'carteras'), where('ronda', '==', 1)))));
await check('v2: beto no puede listar carteras', assertFails(getDocs(query(collection(db('beto'), 'partidas', 'ABCDE', 'carteras'), where('ronda', '==', 1)))));
await check('v2: ana no escribe su historial', assertFails(setDoc(P('ana', 'jugadores', 'ana'), { uid: 'ana', historial: [] })));
await check('v2: ana no se sube el capital', assertFails(updateDoc(P('ana'), { 'capitales.ana': 1000 })));
const dbProfe = db('profe');
const lote = writeBatch(dbProfe);
lote.set(doc(dbProfe, 'partidas', 'ABCDE', 'jugadores', 'ana'), { uid: 'ana', nombre: 'ana', historial: [{ ronda: 1 }] });
lote.update(doc(dbProfe, 'partidas', 'ABCDE'), { 'mundos.1': { shockGlobal: 0.01, eventos: [{ iso2: 'CL', tipo: 'regulacion' }] }, 'capitales.ana': 110, fase: 'resultados' });
await check('v2: profe cierra el año en un batch', assertSucceeds(lote.commit()));
await check('v2: ana lee su historial', assertSucceeds(getDoc(P('ana', 'jugadores', 'ana'))));
await check('v2: beto no lee el historial de ana', assertFails(getDoc(P('beto', 'jugadores', 'ana'))));
await check('v2: beto no envía con el año cerrado', assertFails(cartera('beto', 1)));
await check('v2: memo antes del final no', assertFails(setDoc(P('ana', 'memos', 'ana'), { uid: 'ana', texto: 'hola', enviadoEn: 1 })));
await check('v2: profe termina', assertSucceeds(updateDoc(P('profe'), { fase: 'final' })));
await check('v2: nadie se une al final', assertFails(unirse('eli')));
await check('v2: ana deja su memo', assertSucceeds(setDoc(P('ana', 'memos', 'ana'), { uid: 'ana', texto: 'Diversificar y asegurar', enviadoEn: 1 })));
await check('v2: memo de más de 280 no', assertFails(setDoc(P('beto', 'memos', 'beto'), { uid: 'beto', texto: 'x'.repeat(281), enviadoEn: 1 })));
await check('v2: beto no lee memo de ana', assertFails(getDoc(P('beto', 'memos', 'ana'))));
await check('v2: profe lee memos', assertSucceeds(getDocs(collection(db('profe'), 'partidas', 'ABCDE', 'memos'))));
await check('v2: nadie borra partidas', assertFails(deleteDoc(P('profe'))));
await check('v2: otro no toma la partida', assertFails(updateDoc(P('ana'), { hostUid: 'ana' })));

console.log(`\n${pass} ok, ${fail} fallas`);
await env.cleanup();
process.exit(fail ? 1 : 0);
