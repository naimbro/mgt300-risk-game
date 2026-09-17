import type { Pais } from '../engine/tipos';

// Datos verificados en research/datos-paises-2026.json (fuentes y fechas ahí).
// - WGI 2024 (Banco Mundial, publicación 2025): puntaje de gobernanza 0-100. NO es percentil.
// - V-Dem Democracy Report 2025: Índice de Democracia Liberal 0-1.
// - Solvencia desde el rating S&P: AAA 1 · AA+ 0,9 · AA 0,85 · A 0,7 · BBB 0,55 · BB+ 0,45 · B- 0,2.
// - exposicionGeopolitica y exposicionConflictoArmado son juicio editorial, justificado
//   con los episodios del JSON (aranceles 2025-26, licencias de chips, ataque a data center en EAU 2026).
// - seguroDisponible: MIGA solo asegura en países miembros en desarrollo (no EE.UU. ni Alemania).

export interface FichaPais extends Pais {
  regimen: string;
  rating: string;
  crecimiento2026: number;
}

export const PAISES: FichaPais[] = [
  {
    iso2: 'US', nombre: 'Estados Unidos', region: 'norteamerica', seguroDisponible: false,
    proyecto: 'Planta de empaquetado avanzado de chips en Arizona',
    regimen: 'Democracia electoral', rating: 'AA+', crecimiento2026: 2.3,
    indicadores: { estabilidadPolitica: 64.3, calidadRegulatoria: 76.2, estadoDeDerecho: 73.5, democraciaLiberal: 0.57, solvencia: 0.9, exposicionGeopolitica: 0.35, exposicionConflictoArmado: 0 },
  },
  {
    iso2: 'DE', nombre: 'Alemania', region: 'europa', seguroDisponible: false,
    proyecto: 'Data center de IA con reutilización de calor en Frankfurt',
    regimen: 'Democracia liberal', rating: 'AAA', crecimiento2026: 0.7,
    indicadores: { estabilidadPolitica: 68.0, calidadRegulatoria: 78.5, estadoDeDerecho: 84.9, democraciaLiberal: 0.78, solvencia: 1, exposicionGeopolitica: 0.25, exposicionConflictoArmado: 0 },
  },
  {
    iso2: 'CL', nombre: 'Chile', region: 'latam', seguroDisponible: true,
    proyecto: 'Data center hiperescala en Santiago',
    regimen: 'Democracia liberal', rating: 'A', crecimiento2026: 2.4,
    indicadores: { estabilidadPolitica: 68.0, calidadRegulatoria: 67.2, estadoDeDerecho: 68.9, democraciaLiberal: 0.78, solvencia: 0.7, exposicionGeopolitica: 0.15, exposicionConflictoArmado: 0 },
  },
  {
    iso2: 'MX', nombre: 'México', region: 'latam', seguroDisponible: true,
    proyecto: 'Ensamblaje de servidores de IA en Nuevo León',
    regimen: 'Autocracia electoral', rating: 'BBB', crecimiento2026: 1.2,
    indicadores: { estabilidadPolitica: 53.7, calidadRegulatoria: 51.8, estadoDeDerecho: 37.1, democraciaLiberal: 0.22, solvencia: 0.55, exposicionGeopolitica: 0.55, exposicionConflictoArmado: 0.15 },
  },
  {
    iso2: 'AR', nombre: 'Argentina', region: 'latam', seguroDisponible: true,
    proyecto: 'Planta de hidróxido de litio en Salta',
    regimen: 'Democracia electoral', rating: 'B-', crecimiento2026: 3.5,
    indicadores: { estabilidadPolitica: 63.0, calidadRegulatoria: 51.2, estadoDeDerecho: 52.6, democraciaLiberal: 0.52, solvencia: 0.2, exposicionGeopolitica: 0.1, exposicionConflictoArmado: 0 },
  },
  {
    iso2: 'VN', nombre: 'Vietnam', region: 'asia', seguroDisponible: true,
    proyecto: 'Ensamblaje y prueba de semiconductores en Bac Ninh',
    regimen: 'Autocracia cerrada', rating: 'BB+', crecimiento2026: 7.5,
    indicadores: { estabilidadPolitica: 66.0, calidadRegulatoria: 50.7, estadoDeDerecho: 51.6, democraciaLiberal: 0.1, solvencia: 0.45, exposicionGeopolitica: 0.6, exposicionConflictoArmado: 0 },
  },
  {
    iso2: 'ID', nombre: 'Indonesia', region: 'asia', seguroDisponible: true,
    proyecto: 'Refinería de níquel para baterías en Sulawesi',
    regimen: 'Autocracia electoral', rating: 'BBB', crecimiento2026: 5.0,
    indicadores: { estabilidadPolitica: 55.5, calidadRegulatoria: 56.8, estadoDeDerecho: 53.4, democraciaLiberal: 0.3, solvencia: 0.55, exposicionGeopolitica: 0.3, exposicionConflictoArmado: 0.05 },
  },
  {
    iso2: 'AE', nombre: 'Emiratos Árabes Unidos', region: 'golfo', seguroDisponible: true,
    proyecto: 'Campus de data centers de IA en Abu Dabi',
    regimen: 'Autocracia cerrada', rating: 'AA', crecimiento2026: 3.1,
    indicadores: { estabilidadPolitica: 79.4, calidadRegulatoria: 72.6, estadoDeDerecho: 65.5, democraciaLiberal: 0.08, solvencia: 0.85, exposicionGeopolitica: 0.55, exposicionConflictoArmado: 0.45 },
  },
];

export const paisPorIso = (iso2: string) => PAISES.find((p) => p.iso2 === iso2);
