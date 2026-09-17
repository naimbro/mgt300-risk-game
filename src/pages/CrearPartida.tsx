import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { crearPartida } from '../lib/partida';
import { initAudio } from '../lib/sounds';

const OPCIONES_RONDAS = [4, 5, 6];
const OPCIONES_DURACION = [60, 90, 120];

export default function CrearPartida() {
  const navigate = useNavigate();
  const [rondas, setRondas] = useState(5);
  const [duracion, setDuracion] = useState(90);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Presupuesto de tiempo (aprendido en ml2): reloj + ~2 min de resultados por ronda + cierre.
  const minutos = Math.round((rondas * (duracion + 120) + 30) / 60) + 6;

  async function crear() {
    initAudio();
    setCreando(true);
    setError(null);
    try {
      const codigo = await crearPartida({ totalRondas: rondas, duracionSeg: duracion });
      navigate(`/profe/${codigo}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la partida.');
      setCreando(false);
    }
  }

  return (
    <main className="min-h-screen bg-trama flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg card-play p-6 sm:p-8">
        <h1 className="font-display text-3xl">Nueva partida</h1>
        <p className="text-ink-soft mt-2">
          Esta es la pantalla que se proyecta. Tu navegador conduce el juego: abre y cierra cada año y sortea lo que pasa en el mundo.
          Si se cierra, vuelve a abrir el mismo enlace y la partida sigue donde estaba.
        </p>

        <fieldset className="mt-6">
          <legend className="font-bold">Años (rondas)</legend>
          <div className="flex gap-3 mt-2">
            {OPCIONES_RONDAS.map((n) => (
              <button key={n} onClick={() => setRondas(n)} className={`${rondas === n ? 'btn-primary' : 'btn-secondary'} flex-1`} aria-pressed={rondas === n}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="font-bold">Tiempo para decidir cada año</legend>
          <div className="flex gap-3 mt-2">
            {OPCIONES_DURACION.map((s) => (
              <button key={s} onClick={() => setDuracion(s)} className={`${duracion === s ? 'btn-primary' : 'btn-secondary'} flex-1`} aria-pressed={duracion === s}>
                {s}s
              </button>
            ))}
          </div>
          <p className="text-sm text-muted mt-2">El primer año suma 30 segundos para leer las fichas.</p>
        </fieldset>

        <p className="mt-5 text-sm">
          Duración estimada, con el cierre: <strong>~{minutos} minutos</strong>.
        </p>

        {error && (
          <p className="text-loss font-semibold mt-4" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary w-full mt-6" onClick={crear} disabled={creando}>
          {creando ? 'Creando…' : 'Crear partida'}
        </button>
        <Link to="/" className="block text-center text-sm font-semibold underline underline-offset-4 mt-5">
          Volver
        </Link>
      </div>
    </main>
  );
}
