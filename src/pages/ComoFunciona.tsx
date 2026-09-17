import { Link } from 'react-router-dom';
import { Bandera } from '../components/Bandera';
import { IconoEvento } from '../components/Icono';
import { EVENTOS } from '../content/eventos';
import { PAISES } from '../content/paises';
import { PARAMETROS, TIPOS_EVENTO, primaSeguro, probabilidadesBase, retornoEsperado, riesgoPais } from '../engine/modelo';
import { pct, pctSigno } from '../lib/formato';

export default function ComoFunciona() {
  const orden = [...PAISES].sort((a, b) => riesgoPais(a.indicadores) - riesgoPais(b.indicadores));
  return (
    <main className="min-h-screen bg-trama px-4 py-10">
      <article className="max-w-3xl mx-auto space-y-8">
        <header>
          <Link to="/" className="text-sm font-semibold underline underline-offset-4">← Volver</Link>
          <h1 className="font-display text-4xl mt-3">Cómo funciona</h1>
          <p className="text-lg text-ink-soft mt-2">
            Todo lo que calcula el juego está aquí. No hay bonos ocultos ni fórmulas secretas: si entiendes esta página, puedes jugar bien.
          </p>
        </header>

        <section className="card p-5">
          <h2 className="font-display text-xl">1. El retorno de un proyecto en un año</h2>
          <p className="mt-2">
            <strong>retorno = mercado + eventos políticos + lo que devuelve el seguro − costos de mitigación</strong>
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>El <strong>mercado</strong> combina un shock de la economía mundial (igual para todos), uno de la región y uno propio del país. Por eso diversificar entre regiones protege más que hacerlo dentro de una misma región.</li>
            <li>En promedio, un país más riesgoso rinde más: <strong>retorno esperado = {pct(PARAMETROS.tasaLibreDeRiesgo)} + {pct(PARAMETROS.primaPorPuntoDeRiesgo, 1)} × riesgo</strong>. Es la prima por riesgo. A cambio, tiene más volatilidad y más probabilidad de eventos graves.</li>
            <li>La caja rinde {pct(PARAMETROS.tasaLibreDeRiesgo)} seguro. Nunca pierdes más de lo invertido en un proyecto.</li>
            <li>Lo que pasa en el mundo se sortea una sola vez por año, después de que todos deciden. Es igual para todo el curso.</li>
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">2. El riesgo político (0-10)</h2>
          <p className="mt-2">
            Sale de tres indicadores del Banco Mundial (WGI 2024, escala 0-100): estabilidad política, calidad regulatoria y estado de derecho. Un puntaje de {PARAMETROS.wgiAlto} o más cuenta como gobernanza de primer nivel; {PARAMETROS.wgiBajo} o menos, como débil. El riesgo es cuánto le falta al promedio para ser de primer nivel.
          </p>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th className="py-1">País</th>
                <th>Riesgo</th>
                <th>Retorno esperado</th>
                <th>Prima del seguro</th>
              </tr>
            </thead>
            <tbody>
              {orden.map((p) => (
                <tr key={p.iso2} className="border-b border-line">
                  <td className="py-1.5">
                    <span className="flex items-center gap-2 font-semibold"><Bandera iso2={p.iso2} className="h-4" /> {p.nombre}</span>
                  </td>
                  <td className="tabular">{riesgoPais(p.indicadores).toLocaleString('es-CL')}</td>
                  <td className="tabular">{pct(retornoEsperado(p), 1)}</td>
                  <td className="tabular">{primaSeguro(p) === null ? 'No disponible' : pct(primaSeguro(p)!, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">3. Los eventos políticos</h2>
          <p className="mt-2">Cada año, cada país puede sufrir uno o más eventos. Su probabilidad depende de sus indicadores:</p>
          <p className="mt-2 text-sm text-ink-soft">
            Un año del juego concentra mucho más riesgo que un año real: si no, en cinco rondas casi nunca pasaría nada. Por eso las
            probabilidades y las primas del seguro son más altas que las de la vida real, donde una prima de MIGA ronda el 1% anual. Lo que
            importa es la comparación entre países, no el nivel.
          </p>
          <ul className="mt-3 space-y-3">
            {TIPOS_EVENTO.map((t) => (
              <li key={t} className="flex gap-3">
                <IconoEvento tipo={t} size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{EVENTOS[t].nombre} ({pctSigno(PARAMETROS.impacto[t])})</p>
                  <p className="text-sm">{EVENTOS[t].explicacion} {FORMULAS[t]}</p>
                  <p className="text-sm text-muted">Seguro: {EVENTOS[t].seguro} {EVENTOS[t].comunidad ?? ''}</p>
                </div>
              </li>
            ))}
          </ul>
          <details className="mt-4">
            <summary className="font-bold cursor-pointer">Probabilidades de un año normal, por país</summary>
            <div className="overflow-x-auto">
              <table className="w-full mt-3 text-xs">
                <thead>
                  <tr className="text-left border-b-2 border-ink">
                    <th className="py-1">País</th>
                    {TIPOS_EVENTO.map((t) => <th key={t} className="px-1">{EVENTOS[t].nombre}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orden.map((p) => {
                    const pb = probabilidadesBase(p.indicadores);
                    return (
                      <tr key={p.iso2} className="border-b border-line">
                        <td className="py-1 font-semibold">{p.nombre}</td>
                        {TIPOS_EVENTO.map((t) => <td key={t} className="px-1 tabular">{pct(pb[t])}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">4. Informe de riesgo, seguro y comunidad</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>El <strong>informe</strong> de cada año trae alertas y calmas. Una alerta multiplica (×2 o ×2,5) la probabilidad de un evento ese año; una calma la reduce. Después de un evento, el país queda más inestable al año siguiente (×{PARAMETROS.persistencia.toLocaleString('es-CL')}).</li>
            <li>El <strong>seguro de riesgo político</strong> funciona como el de MIGA (Banco Mundial): devuelve el 90% de lo perdido por expropiación, controles de capital o violencia política. No cubre cambios regulatorios de aplicación general, aranceles ni conflictos con la comunidad. MIGA solo opera en países en desarrollo, así que no hay seguro en Estados Unidos ni en Alemania. Su precio incluye el riesgo normal del país: asegurarse siempre cuesta un poco más de lo que devuelve, pero protege contra el desastre y rinde cuando hay alertas.</li>
            <li>La <strong>relación con la comunidad</strong> (socio local, acuerdos, licencia social) cuesta {pct(PARAMETROS.costoComunidad)} y reduce en {pct(PARAMETROS.mitigacionComunidadConflicto)} el daño de un conflicto social y en {pct(PARAMETROS.mitigacionComunidadRegulacion)} el de un cambio regulatorio.</li>
          </ul>
        </section>

        <section className="card p-5 text-sm">
          <h2 className="font-display text-xl">Fuentes</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Banco Mundial, Worldwide Governance Indicators (datos 2024, publicación 2025).</li>
            <li>V-Dem Institute, Democracy Report 2025 (Índice de Democracia Liberal).</li>
            <li>FMI, World Economic Outlook, abril y julio de 2026. Ratings soberanos S&P 2025-2026.</li>
            <li>MIGA, descripción de productos y Convenio (art. 11).</li>
            <li>Rice, C. y Zegart, A. (2018). Managing 21st-Century Political Risk. Harvard Business Review. Jensen, N. (2008). Political Risk, Democratic Institutions, and Foreign Direct Investment. Acemoglu, D. y Robinson, J. (2012). Por qué fracasan los países.</li>
          </ul>
          <p className="mt-3 text-muted">Los titulares de eventos y alertas son escenarios de ficción inspirados en episodios reales. Las exposiciones geopolítica y a conflicto armado son juicio editorial.</p>
        </section>
      </article>
    </main>
  );
}

const FORMULAS: Record<string, string> = {
  expropiacion: 'Más probable con estado de derecho débil y menos democracia (Jensen, 2008).',
  regulacion: 'Más probable con baja calidad regulatoria.',
  conflicto_social: 'Más probable con baja estabilidad política.',
  controles_capital: 'Más probable con peor rating soberano.',
  geopolitica: 'Depende de la exposición a aranceles, sanciones y controles de chips.',
  violencia: 'Depende de la estabilidad política y de la exposición a conflictos armados.',
  reforma: 'Un 8% al año en todos los países.',
};
