import us from 'flag-icons/flags/4x3/us.svg';
import de from 'flag-icons/flags/4x3/de.svg';
import cl from 'flag-icons/flags/4x3/cl.svg';
import mx from 'flag-icons/flags/4x3/mx.svg';
import ar from 'flag-icons/flags/4x3/ar.svg';
import vn from 'flag-icons/flags/4x3/vn.svg';
import id from 'flag-icons/flags/4x3/id.svg';
import ae from 'flag-icons/flags/4x3/ae.svg';

// SVG y no emoji: Chrome en Windows (el computador del proyector) no dibuja banderas emoji.
const SRC: Record<string, string> = { US: us, DE: de, CL: cl, MX: mx, AR: ar, VN: vn, ID: id, AE: ae };

export function Bandera({ iso2, className = 'h-5' }: { iso2: string; className?: string }) {
  return (
    <img
      src={SRC[iso2]}
      alt=""
      className={`${className} aspect-[4/3] rounded-[3px] object-cover shadow-[0_0_0_1.5px_var(--ink)] shrink-0`}
    />
  );
}
