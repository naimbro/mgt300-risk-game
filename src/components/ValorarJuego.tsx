import { useState } from 'react';
import { Send } from 'lucide-react';
import { COMENTARIO_MAX, NOTA_MAX, NOTA_MIN } from '../lib/partida';

const ESCALA = Array.from({ length: NOTA_MAX - NOTA_MIN + 1 }, (_, i) => NOTA_MIN + i);

/**
 * Va ANTES del resultado final, en el teléfono, mientras el proyector muestra el podio.
 * Modelo de ml2-master-game: dos preguntas y se puede saltar a propósito. Obligar sube
 * la tasa de respuesta y baja la calidad: el que no quiere contestar pone un 4.
 */
export function ValorarJuego({ onEnviar, onSaltar }: { onEnviar: (nota: number | null, comentario: string) => Promise<void>; onSaltar: () => void }) {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  return (
    <section className="card-play p-5 mt-4">
      <h1 className="font-display text-2xl">Antes de tu resultado</h1>
      <p className="text-sm text-muted mt-1">Dos preguntas cortas sobre el juego de hoy. Las lee el profesor.</p>

      <p className="font-bold mt-5">¿Cuánto te gustó?</p>
      <div className="grid grid-cols-7 gap-1.5 mt-2">
        {ESCALA.map((n) => (
          <button
            key={n}
            onClick={() => setNota(n)}
            aria-pressed={nota === n}
            aria-label={`${n} de ${NOTA_MAX}`}
            className={`aspect-square rounded-xl font-display text-lg border-[2.5px] border-ink ${nota === n ? 'bg-orange' : 'bg-surface'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs font-bold text-muted mt-1 px-1">
        <span>nada</span>
        <span>me encantó</span>
      </div>

      <label className="block mt-5">
        <span className="font-bold">¿Qué cambiarías para la próxima?</span>
        <textarea
          className="input mt-2 min-h-24"
          maxLength={COMENTARIO_MAX}
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, COMENTARIO_MAX))}
          placeholder="Una cosa. La que más te molestó o la que más te faltó."
        />
        <span className="block text-right text-xs text-muted tabular">
          {comentario.length}/{COMENTARIO_MAX}
        </span>
      </label>

      <button
        className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
        disabled={enviando || (nota === null && comentario.trim() === '')}
        onClick={async () => {
          setEnviando(true);
          await onEnviar(nota, comentario);
        }}
      >
        <Send size={18} /> {enviando ? 'Enviando…' : 'Enviar y ver mi resultado'}
      </button>
      <button className="btn-ghost w-full mt-2 !py-2 text-sm" disabled={enviando} onClick={onSaltar}>
        Saltar y ver mi resultado
      </button>
    </section>
  );
}
