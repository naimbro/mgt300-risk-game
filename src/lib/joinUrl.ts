/**
 * URL absoluta para entrar a una partida (la del QR). Absoluta porque va en un QR
 * y debe respetar BASE_URL: sin /mgt300-risk-game/ da 404 solo en producción.
 */
export function buildJoinUrl(codigo: string, origin: string, baseUrl: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${origin.replace(/\/$/, '')}${base}?codigo=${codigo.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
}

export function currentJoinUrl(codigo: string): string {
  return buildJoinUrl(codigo, window.location.origin, import.meta.env.BASE_URL || '/');
}
