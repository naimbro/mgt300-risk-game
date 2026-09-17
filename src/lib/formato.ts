/** Capital en millones de dólares: "US$ 123 M". */
export function millones(n: number, decimales = 0): string {
  return `US$ ${n.toLocaleString('es-CL', { maximumFractionDigits: decimales, minimumFractionDigits: decimales })} M`;
}

/** Porcentaje con signo: "+12%", "−8%". */
export function pctSigno(fraccion: number, decimales = 0): string {
  const v = fraccion * 100;
  const s = Math.abs(v).toLocaleString('es-CL', { maximumFractionDigits: decimales, minimumFractionDigits: decimales });
  if (Math.abs(v) < 0.5 * 10 ** -decimales) return `${s}%`;
  return `${v > 0 ? '+' : '−'}${s}%`;
}

export function pct(fraccion: number, decimales = 0): string {
  return `${(fraccion * 100).toLocaleString('es-CL', { maximumFractionDigits: decimales, minimumFractionDigits: decimales })}%`;
}

/** Posiciones con empates compartidos: 1, 2, 2, 4. */
export function posiciones<T>(items: T[], valor: (t: T) => number): { item: T; posicion: number }[] {
  const orden = [...items].sort((a, b) => valor(b) - valor(a));
  let ultimaPos = 0;
  let ultimoValor: number | null = null;
  return orden.map((item, i) => {
    const v = Math.round(valor(item) * 100);
    if (v !== ultimoValor) {
      ultimaPos = i + 1;
      ultimoValor = v;
    }
    return { item, posicion: ultimaPos };
  });
}
