// Aleatoriedad. En clase se usa crypto (imposible de predecir desde la consola);
// en tests y simulaciones, un generador con semilla para que sea reproducible.

export type Rng = () => number; // uniforme en [0, 1)

/** mulberry32: rápido y suficiente para simular. No usar en clase. */
export function rngConSemilla(semilla: number): Rng {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngCripto(): Rng {
  const buf = new Uint32Array(1);
  return () => {
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  };
}

/** Normal estándar por Box-Muller. */
export function normal(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
