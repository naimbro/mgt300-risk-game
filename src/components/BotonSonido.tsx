import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getMuted, toggleMute } from '../lib/sounds';

export function BotonSonido() {
  const [mudo, setMudo] = useState(getMuted());
  return (
    <button className="btn-ghost" onClick={() => setMudo(toggleMute())} aria-label={mudo ? 'Activar sonido' : 'Silenciar'}>
      {mudo ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
