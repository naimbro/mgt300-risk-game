import type { TipoEvento } from '../engine/tipos';

// Catálogo de eventos políticos. Los titulares son ESCENARIOS de ficción para el
// juego, cada uno inspirado en un tipo de episodio real del país (ver
// research/datos-paises-2026.json). El juego lo dice en pantalla.

export interface InfoEvento {
  nombre: string;
  icono: string; // nombre de ícono lucide
  explicacion: string;
  /** Qué hace el seguro de riesgo político con este evento. */
  seguro: string;
  /** Qué hace la relación con la comunidad. */
  comunidad?: string;
  positivo?: boolean;
}

export const EVENTOS: Record<TipoEvento, InfoEvento> = {
  expropiacion: {
    nombre: 'Expropiación',
    icono: 'Landmark',
    explicacion: 'El Estado toma el control del proyecto o revoca la concesión. Pierdes el 70% de lo invertido.',
    seguro: 'Cubierto: el seguro devuelve el 90% de la pérdida.',
  },
  regulacion: {
    nombre: 'Cambio regulatorio',
    icono: 'Scale',
    explicacion: 'Nuevas reglas, impuestos o permisos que cambian la rentabilidad. −20%.',
    seguro: 'No cubierto: MIGA no asegura regulación de aplicación general.',
    comunidad: 'Con socio local y comunidad el golpe es 25% menor.',
  },
  conflicto_social: {
    nombre: 'Conflicto social',
    icono: 'Megaphone',
    explicacion: 'Protestas o pérdida de licencia social que frenan el proyecto. −25%.',
    seguro: 'No cubierto.',
    comunidad: 'Con relación comunitaria el golpe es 60% menor.',
  },
  controles_capital: {
    nombre: 'Controles de capital',
    icono: 'Lock',
    explicacion: 'No puedes sacar utilidades o convertir la moneda. −30%.',
    seguro: 'Cubierto: inconvertibilidad y restricción de transferencias.',
  },
  geopolitica: {
    nombre: 'Golpe geopolítico',
    icono: 'Globe2',
    explicacion: 'Aranceles, sanciones o controles a la exportación de chips. −20%.',
    seguro: 'No cubierto.',
  },
  violencia: {
    nombre: 'Violencia política',
    icono: 'Flame',
    explicacion: 'Guerra, terrorismo o disturbios dañan los activos. −35%.',
    seguro: 'Cubierto: guerra y disturbios civiles.',
  },
  reforma: {
    nombre: 'Reforma pro inversión',
    icono: 'Sparkles',
    explicacion: 'Incentivos o acuerdos que mejoran el negocio. +12%.',
    seguro: '—',
    positivo: true,
  },
};

export const TITULARES: Record<string, Partial<Record<TipoEvento, string>>> = {
  US: {
    expropiacion: 'El gobierno exige una participación accionaria a cambio de mantener los subsidios a la planta.',
    regulacion: 'Se revocan de un día para otro los créditos fiscales a la manufactura de chips.',
    conflicto_social: 'Protestas contra el consumo de agua de la planta en pleno desierto de Arizona.',
    controles_capital: 'Nuevas restricciones a la repatriación de utilidades de filiales extranjeras.',
    geopolitica: 'Represalias comerciales contra EE.UU. golpean las exportaciones de la planta.',
    violencia: 'Disturbios tras una elección disputada dañan instalaciones industriales.',
    reforma: 'Se aprueba una ley que acelera permisos para la industria de semiconductores.',
  },
  DE: {
    expropiacion: 'El Estado interviene la operación del data center por razones de seguridad energética.',
    regulacion: 'Nuevas exigencias de eficiencia y de la ley europea de IA elevan los costos de operación.',
    conflicto_social: 'Huelga nacional del sector energético paraliza la puesta en marcha.',
    controles_capital: 'Tensiones financieras en la eurozona limitan transferencias fuera de la región.',
    geopolitica: 'Aranceles cruzados entre la UE y EE.UU. encarecen los servidores importados.',
    violencia: 'Sabotaje a infraestructura eléctrica deja fuera de servicio el campus.',
    reforma: 'Alemania simplifica los permisos para data centers que reutilizan calor.',
  },
  CL: {
    expropiacion: 'El Estado anuncia que tomará control mayoritario de la infraestructura digital estratégica.',
    regulacion: 'Un tribunal ambiental anula el permiso del data center y ordena reevaluar su uso de agua.',
    conflicto_social: 'Vecinos bloquean la construcción del data center por el consumo de agua.',
    controles_capital: 'Una crisis cambiaria lleva al Banco Central a restringir envíos de divisas.',
    geopolitica: 'La rivalidad EE.UU.–China obliga a cambiar proveedores de equipos a mitad de obra.',
    violencia: 'Un estallido de violencia urbana daña instalaciones del proyecto.',
    reforma: 'Chile aprueba una ley de permisos sectoriales que acorta los plazos de evaluación.',
  },
  MX: {
    expropiacion: 'Tras la reforma judicial, el gobierno cancela las concesiones del parque industrial.',
    regulacion: 'Nueva regulación energética obliga a comprar electricidad a la empresa estatal.',
    conflicto_social: 'Bloqueos carreteros y huelgas paralizan el corredor industrial del norte.',
    controles_capital: 'Presión sobre el peso lleva a limitar temporalmente la salida de dólares.',
    geopolitica: 'Estados Unidos impone aranceles a los servidores ensamblados en México.',
    violencia: 'El crimen organizado ataca el transporte de carga de la planta.',
    reforma: 'Se renueva el T-MEC con reglas de origen favorables a la electrónica.',
  },
  AR: {
    expropiacion: 'La provincia revoca la concesión de litio y crea una empresa estatal para explotarlo.',
    regulacion: 'Se suspenden los beneficios del régimen de grandes inversiones para proyectos nuevos.',
    conflicto_social: 'Comunidades de la Puna cortan el acceso al salar en reclamo por el agua.',
    controles_capital: 'Vuelve el cepo: prohibido girar dividendos al exterior.',
    geopolitica: 'Cambios en la política comercial china reducen la demanda de litio argentino.',
    violencia: 'Saqueos y disturbios en una crisis económica afectan las instalaciones.',
    reforma: 'El RIGI garantiza estabilidad fiscal y cambiaria por 30 años al proyecto.',
  },
  VN: {
    expropiacion: 'El Estado toma el control de la planta en una disputa con el socio local estatal.',
    regulacion: 'La campaña anticorrupción congela las licencias de operación de la planta.',
    conflicto_social: 'Huelga de trabajadores por salarios en los parques industriales del norte.',
    controles_capital: 'Restricciones a la compra de dólares retrasan la repatriación de utilidades.',
    geopolitica: 'EE.UU. aplica aranceles a chips vietnamitas por sospecha de reexportación china.',
    violencia: 'Protestas antichinas terminan en ataques a fábricas extranjeras.',
    reforma: 'Vietnam aprueba incentivos fiscales especiales para semiconductores.',
  },
  ID: {
    expropiacion: 'El gobierno obliga a ceder la mayoría de la refinería al fondo soberano Danantara.',
    regulacion: 'Nuevas exigencias de contenido local y de exportación a través de un canal estatal.',
    conflicto_social: 'Protestas contra la contaminación de las fundiciones de níquel en Sulawesi.',
    controles_capital: 'Se obliga a retener en el país las divisas de las exportaciones mineras.',
    geopolitica: 'EE.UU. excluye al níquel indonesio de sus incentivos a baterías.',
    violencia: 'Enfrentamientos entre trabajadores locales y extranjeros detienen la refinería.',
    reforma: 'Indonesia firma un acuerdo comercial con la UE que protege inversiones.',
  },
  AE: {
    expropiacion: 'El Estado reasigna el campus de IA a una empresa ligada a la familia gobernante.',
    regulacion: 'Nuevas reglas de soberanía de datos obligan a rediseñar el campus.',
    conflicto_social: 'Tensiones con trabajadores migrantes retrasan la construcción.',
    controles_capital: 'Se congelan transferencias vinculadas a sanciones regionales.',
    geopolitica: 'Washington suspende las licencias de exportación de chips avanzados al campus.',
    violencia: 'Un ataque con drones en la región daña un data center del campus.',
    reforma: 'Se aprueban nuevas licencias de chips y un acuerdo de garantías con EE.UU.',
  },
};

export const NOMBRE_REGION: Record<string, string> = {
  norteamerica: 'Norteamérica',
  europa: 'Europa',
  latam: 'Latinoamérica',
  asia: 'Asia',
  golfo: 'Golfo Pérsico',
};

/** Contexto narrativo de cada año (sin efecto en el cálculo). */
export function anioDeRonda(anioInicial: number, ronda: number) {
  return anioInicial + ronda - 1;
}
