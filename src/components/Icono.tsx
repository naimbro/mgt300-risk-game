import { Flame, Globe2, Landmark, Lock, Megaphone, Scale, Sparkles, type LucideProps } from 'lucide-react';
import type { TipoEvento } from '../engine/tipos';

const ICONOS: Record<TipoEvento, React.ComponentType<LucideProps>> = {
  expropiacion: Landmark,
  regulacion: Scale,
  conflicto_social: Megaphone,
  controles_capital: Lock,
  geopolitica: Globe2,
  violencia: Flame,
  reforma: Sparkles,
};

export function IconoEvento({ tipo, ...props }: { tipo: TipoEvento } & LucideProps) {
  const C = ICONOS[tipo];
  return <C aria-hidden {...props} />;
}
