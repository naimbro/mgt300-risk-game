import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { limpiarCodigo, unirse } from '../lib/partida';
import { initAudio, playClick } from '../lib/sounds';

const CLAVE_NOMBRE = 'riesgo:nombre';

function leerNombre(): string {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) ?? '';
  } catch {
    return '';
  }
}

export default function Entrar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState(() => limpiarCodigo(params.get('codigo') ?? ''));
  const [nombre, setNombre] = useState(leerNombre);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const listo = codigo.length === 5 && nombre.trim().length >= 2;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!listo) return;
    initAudio();
    playClick();
    setEnviando(true);
    setError(null);
    try {
      await unirse(codigo, nombre);
      try {
        localStorage.setItem(CLAVE_NOMBRE, nombre.trim());
      } catch {
        /* sin almacenamiento: no importa */
      }
      navigate(`/jugar/${codigo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.');
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-trama flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted text-center">Gobernar e invertir en la era de la IA</p>
        <h1 className="font-display text-5xl text-center leading-[0.95] mt-3">
          Riesgo
          <br />
          <span className="tape tilt-a mt-2">político</span>
        </h1>
        <p className="text-center text-ink-soft mt-5">
          Eres el directorio de una empresa que invierte en proyectos de IA en ocho países. Cinco años. El mundo no espera.
        </p>

        <form onSubmit={entrar} className="card-play p-5 mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">Código de la partida</span>
            <input
              className="input mt-1 font-display text-2xl tracking-[0.3em] text-center"
              value={codigo}
              onChange={(e) => setCodigo(limpiarCodigo(e.target.value))}
              placeholder="ABCDE"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Tu nombre</span>
            <input
              className="input mt-1"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.slice(0, 24))}
              placeholder="Como te conoce el curso"
              autoComplete="given-name"
              required
              minLength={2}
            />
          </label>
          {error && (
            <p className="text-loss font-semibold text-sm" role="alert">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={enviando || !listo}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="flex justify-between mt-6 text-sm">
          <Link to="/como-funciona" className="font-semibold underline underline-offset-4">
            ¿Cómo funciona?
          </Link>
          <Link to="/profe" className="font-semibold underline underline-offset-4">
            Soy docente
          </Link>
        </div>
      </div>
    </main>
  );
}
