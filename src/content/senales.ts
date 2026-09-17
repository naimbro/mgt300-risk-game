import type { Rng } from '../engine/rng';
import type { SenalAplicada } from '../engine/tipos';

// Señales del "informe de riesgo" que abre cada año. No son adornos: cambian de
// verdad la probabilidad de los eventos de ese año (×2 = el doble de probable,
// ×0,5 = la mitad). Una alerta no garantiza el evento; una calma no lo descarta.
// Así, leer el informe paga en promedio, pero no siempre, como en la realidad.
//
// Los textos son escenarios plausibles, NO noticias reales. Cada uno se apoya en
// un tipo de episodio que sí ocurrió (ver research/datos-paises-2026.json).

export interface Senal extends SenalAplicada {
  titular: string;
  tono: 'alerta' | 'calma';
}

export const SENALES: Senal[] = [
  // Estados Unidos
  { id: 'US-aranceles', iso2: 'US', tono: 'alerta', titular: 'Washington anuncia una revisión de aranceles y créditos fiscales a la industria de chips.', multiplicadores: { regulacion: 2, geopolitica: 2 } },
  { id: 'US-polarizacion', iso2: 'US', tono: 'alerta', titular: 'Elecciones de mitad de período muy disputadas: protestas en varias ciudades.', multiplicadores: { conflicto_social: 2.5 } },
  { id: 'US-acuerdo', iso2: 'US', tono: 'calma', titular: 'Acuerdo bipartidista extiende por diez años los incentivos a la manufactura avanzada.', multiplicadores: { regulacion: 0.4, reforma: 2 } },
  // Alemania
  { id: 'DE-ley-ia', iso2: 'DE', tono: 'alerta', titular: 'Entran en vigor nuevas obligaciones europeas para sistemas de IA de alto riesgo.', multiplicadores: { regulacion: 2.5 } },
  { id: 'DE-energia', iso2: 'DE', tono: 'alerta', titular: 'Sube el precio de la energía industrial y los sindicatos convocan a paro.', multiplicadores: { conflicto_social: 2 } },
  { id: 'DE-coalicion', iso2: 'DE', tono: 'calma', titular: 'La coalición de gobierno acuerda simplificar permisos para data centers.', multiplicadores: { regulacion: 0.5, reforma: 2 } },
  // Chile
  { id: 'CL-agua', iso2: 'CL', tono: 'alerta', titular: 'Comunidades de la Región Metropolitana se oponen al consumo de agua de los data centers.', multiplicadores: { conflicto_social: 2.5 } },
  { id: 'CL-royalty', iso2: 'CL', tono: 'alerta', titular: 'El Congreso discute cambiar el régimen de permisos y royalties para proyectos estratégicos.', multiplicadores: { regulacion: 2 } },
  { id: 'CL-permisos', iso2: 'CL', tono: 'calma', titular: 'Se aprueba una ley que acorta los plazos de evaluación ambiental con participación temprana.', multiplicadores: { conflicto_social: 0.5, regulacion: 0.5 } },
  // México
  { id: 'MX-reforma-judicial', iso2: 'MX', tono: 'alerta', titular: 'Inversionistas cuestionan la independencia de los tribunales tras la reforma judicial.', multiplicadores: { expropiacion: 2, regulacion: 1.5 } },
  { id: 'MX-tmec', iso2: 'MX', tono: 'alerta', titular: 'Se tensiona la revisión del T-MEC: Estados Unidos amenaza con aranceles.', multiplicadores: { geopolitica: 2.5 } },
  { id: 'MX-nearshoring', iso2: 'MX', tono: 'calma', titular: 'Nuevo acuerdo de seguridad en el corredor industrial del norte baja los robos a camiones.', multiplicadores: { conflicto_social: 0.5 } },
  // Argentina
  { id: 'AR-reservas', iso2: 'AR', tono: 'alerta', titular: 'Caen las reservas del Banco Central y reaparece la brecha cambiaria.', multiplicadores: { controles_capital: 2.5 } },
  { id: 'AR-provincias', iso2: 'AR', tono: 'alerta', titular: 'Gobernadores reclaman más control sobre el litio y amenazan con revisar concesiones.', multiplicadores: { expropiacion: 2, regulacion: 2 } },
  { id: 'AR-rigi', iso2: 'AR', tono: 'calma', titular: 'El régimen de incentivos a grandes inversiones garantiza estabilidad fiscal por 30 años.', multiplicadores: { regulacion: 0.5, expropiacion: 0.5 } },
  // Vietnam
  { id: 'VN-aranceles', iso2: 'VN', tono: 'alerta', titular: 'Estados Unidos investiga si Vietnam reexporta chips y componentes chinos.', multiplicadores: { geopolitica: 2.5 } },
  { id: 'VN-anticorrupcion', iso2: 'VN', tono: 'alerta', titular: 'Campaña anticorrupción congela la firma de licencias en varias provincias.', multiplicadores: { regulacion: 2 } },
  { id: 'VN-socio', iso2: 'VN', tono: 'calma', titular: 'Vietnam y Estados Unidos elevan su relación a asociación estratégica en semiconductores.', multiplicadores: { geopolitica: 0.5, reforma: 2 } },
  // Indonesia
  { id: 'ID-exportacion', iso2: 'ID', tono: 'alerta', titular: 'El gobierno evalúa exigir más procesamiento local y participación estatal en minería.', multiplicadores: { expropiacion: 2, regulacion: 2 } },
  { id: 'ID-protestas', iso2: 'ID', tono: 'alerta', titular: 'Protestas contra la contaminación de fundiciones de níquel en Sulawesi.', multiplicadores: { conflicto_social: 2.5 } },
  { id: 'ID-acuerdo', iso2: 'ID', tono: 'calma', titular: 'Indonesia firma un acuerdo de protección de inversiones con la Unión Europea.', multiplicadores: { expropiacion: 0.5, geopolitica: 0.5 } },
  // Emiratos Árabes Unidos
  { id: 'AE-chips', iso2: 'AE', tono: 'alerta', titular: 'Washington condiciona nuevas licencias de chips avanzados a limitar vínculos con China.', multiplicadores: { geopolitica: 2.5 } },
  { id: 'AE-region', iso2: 'AE', tono: 'alerta', titular: 'Escalan las tensiones militares en el Golfo y suben los seguros de transporte.', multiplicadores: { geopolitica: 2, conflicto_social: 1.5 } },
  { id: 'AE-licencias', iso2: 'AE', tono: 'calma', titular: 'Se aprueban las licencias de exportación de chips para el campus de IA.', multiplicadores: { geopolitica: 0.4 } },
];

/** 3 señales por año, de 3 países distintos, sin repetir señales ya usadas. Mayoría de alertas. */
export function sortearSenales(usadas: string[], rng: Rng, cantidad = 3): Senal[] {
  const disponibles = SENALES.filter((s) => !usadas.includes(s.id));
  const elegidas: Senal[] = [];
  const paises = new Set<string>();
  const barajadas = [...disponibles].sort(() => rng() - 0.5);
  // Al menos 2 alertas: un informe tranquilo no enseña nada.
  const orden = [...barajadas.filter((s) => s.tono === 'alerta'), ...barajadas.filter((s) => s.tono === 'calma')];
  for (const s of orden) {
    if (elegidas.length >= cantidad) break;
    if (paises.has(s.iso2)) continue;
    if (s.tono === 'calma' && elegidas.filter((e) => e.tono === 'alerta').length < 2) continue;
    elegidas.push(s);
    paises.add(s.iso2);
  }
  return elegidas;
}
