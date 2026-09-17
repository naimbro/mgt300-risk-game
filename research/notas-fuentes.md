# Notas de fuentes: datos-paises-2026.json

Generado: 2026-09-17. Todas las fuentes se consultaron el 2026-09-17, salvo que se indique otra fecha.

## 1. Fuentes principales y cómo se obtuvieron

| Dato | Fuente | Método | Año de datos |
|---|---|---|---|
| WGI | API del Banco Mundial, fuente 3 (`GOV_WGI_{PV,RQ,RL,VA}.{SC,EST}`), https://api.worldbank.org/v2/sources/3/indicators | Consulta directa a la API (fuente actualizada el 2026-03-18) | 2024 |
| V-Dem | Democracy Report 2026, https://www.v-dem.net/documents/75/V-Dem_Institute_Democracy_Report_2026_lowres.pdf | PDF descargado; columna LDI leída por coordenadas (pp. 48-49); régimen desde Tabla 1 (p. 15) | 2025 |
| FMI crecimiento/inflación (abril) | WEO abril 2026, Statistical Appendix Tables A, https://www.imf.org/-/media/files/publications/weo/2026/april/english/tablea.pdf | PDF parseado (Tablas A2, A4, A6, A7) | proyección 2026 |
| FMI crecimiento (julio) | WEO Update julio 2026, https://www.imf.org/-/media/files/publications/weo/2026/update/july/english/text.pdf | PDF parseado (Tabla 1, Annex Table 1, texto) | proyección 2026 |
| Coface | Fichas de país en coface.com | HTML descargado | según "last updated" de cada ficha |
| Allianz Trade | Informes de país en allianz-trade.com | HTML descargado (texto alternativo de la imagen del rating y nombres de archivo de los gráficos) | según "Updated in" de cada informe |
| MIGA | miga.org (páginas de productos), MIGA at a Glance (2019), Convenio MIGA (versión feb-2016) | Páginas web y PDF | ver cada ítem |

## 2. Incertidumbres y advertencias (leer antes de usar en clase)

### WGI
- **No hay percentiles.** Tras el cambio de metodología, la API del Banco Mundial ya no expone `*.PER.RNK` (la consulta devuelve "Invalid value"). Se reportan el **puntaje 0-100** (`.SC`) y la **estimación -2.5..+2.5** (`.EST`). El puntaje 0-100 **no es un percentil**, así que no hay que presentarlo como "percentil X".
- No hay datos de 2025 en la API. 2024 es lo más reciente.

### V-Dem
- EE.UU. pasó de democracia liberal a **democracia electoral (ED+)** en el informe 2026.
- México e Indonesia aparecen como **autocracia electoral (EA+)**, en zona gris con democracia electoral. Argentina, EE.UU., México e Indonesia muestran un declive estadísticamente significativo en 10 años (flecha en la tabla).
- El ranking tiene 179 países (dato tomado del formato de la tabla; el número total no se verificó por separado).

### FMI
- `crecimiento_2026` usa el **Update de julio 2026** cuando el país aparece en él (EE.UU., Alemania, México, Argentina, Indonesia, Vietnam). Para **Chile y EAU** se usa **abril 2026**. Ambos valores quedan en el JSON.
- Vietnam 7,5% viene del **texto** del Update de julio ("revisado al alza en 0,4 pp"), no de una tabla. El valor de abril (7,1%) sí está en la Tabla A4.
- **EAU 3,1% probablemente está desactualizado.** El Update de julio bajó el crecimiento 2026 de Medio Oriente y Asia Central a 0,7% por un cierre más prolongado del Estrecho de Ormuz, pero no publica cifra para EAU.
- Inflación 2026 = IPC promedio anual de abril 2026. El FMI subió la inflación mundial 2026 en 0,3 pp en julio, pero no publicó cifras por país.
- La API del DataMapper del FMI estaba bloqueada (403). Los resúmenes de WebFetch de esa API **no eran confiables**: dieron dos valores distintos para Vietnam, ambos incorrectos. Por eso se usaron los PDF.

### Calificaciones soberanas (S&P)
- **Chile (A, estable):** la última acción verificada es la ratificación del 24-oct-2025. No encontré acción de S&P en 2026. La revisión anual suele ser cerca de octubre.
- **Vietnam (BB+, estable):** la última ratificación verificada es de agosto de 2025. Una nota de Reuters de abril de 2026 (republicada por wkzo.com) confirma que seguía vigente. Que Fitch lo subiera a BBB- en enero de 2026 viene de un resumen de búsqueda y no se verificó en fuente primaria.
- **EAU (AA, estable, 4-sep-2026):** la fecha y el contenido vienen de Investing.com (publicado el 5-sep-2026). No pude abrir el comunicado de WAM ni el de S&P (403). La ratificación previa fue el 6-mar-2026.
- **Argentina (B-, estable, 10-jun-2026):** Bloomberg y Rio Times coinciden. Un resumen automático de Buenos Aires Times dio otra fecha (sept-2026), que se descartó por inconsistente.
- **México:** perspectiva **negativa** desde el 12-may-2026, con BBB ratificado.
- **Indonesia:** S&P ratificó BBB estable el 13-jul-2026. Fitch pasó a perspectiva negativa a comienzos de 2026; para Moody's solo lo dice Xinhua.
- **Alemania:** la fecha 24-abr-2026 es la del último informe de S&P según la Deutsche Finanzagentur.
- Las páginas de S&P (spglobal.com) devolvieron 403. Ninguna calificación se verificó directamente en S&P.

### Coface / Allianz Trade
- **Coface** mide riesgo de impago empresarial (A1-E). **No es un rating de riesgo político.** La fecha es el "last updated" de la ficha, y la nota puede ser más reciente que el texto de la ficha. Indonesia (mar-2025), México (nov-2025), Chile y Argentina (dic-2025) tienen fichas antiguas.
- **Allianz Trade:** el rating país (p. ej. BB1) sale del texto alternativo de la imagen. El nivel de **riesgo político (1-6)** se **infirió** del nombre de archivo del gráfico de barras (`Histogram6_LevelN`) y no está publicado como número. Los informes de EAU, Vietnam, Indonesia y Alemania son de feb-2026, así que **EAU no refleja la guerra de marzo de 2026**.
- No se consultó Atradius.

### Episodios
- **Tipos:** dos episodios no calzan con ninguna categoría y llevan `nota_tipo`: la cancelación de Intel en Magdeburgo y los ataques de Irán a data centers en EAU. Considerar agregar un tipo `guerra_violencia_politica`.
- **Aranceles de EE.UU. (México 2025, Vietnam 2025):** los aranceles IEEPA fueron **anulados por la Corte Suprema el 20-feb-2026** y reemplazados por un 10% bajo la Sección 122 desde el 24-feb-2026. Según un título de Skadden (mayo 2026), el Tribunal de Comercio Internacional también rechazó el arancel de la Sección 122 y hay apelación en curso. Este último punto no se leyó en detalle. Las tasas de 2025 **ya no están vigentes tal cual**.
- **México, reglas de origen del T-MEC:** no se verificó la exención de marzo de 2025 para bienes que cumplen el T-MEC, así que se omitió.
- **Argentina 2025:** no se verificó el detalle de la habilitación de dividendos a no residentes (restricciones por ejercicio), así que se describió de forma general.
- **Indonesia DSI 2026:** las fuentes difieren sobre el níquel. Reccessary menciona "coal, palm oil and nickel" y otras fuentes mencionan "ferroaleaciones". Se usó "carbón, aceite de palma y ferroaleaciones", con calendario escalonado (1-jun-2026, sept-2026, 1-ene-2027) según un resumen de búsqueda.
- **EAU 2026 (ataques a data centers):** hay varias fuentes (Asia Society Policy Institute, 1-abr-2026; Reuters vía Ground News, ~11-sep-2026; RUSI). No hay fecha exacta del ataque a AWS, solo "marzo 2026".
- **Chile, Google Cerrillos:** según resultados de búsqueda de septiembre de 2026, Google retomó el plan y hay un nuevo cuestionamiento ambiental (ohmygeek.net, 8-sep-2026; laserenaradio.cl, 4-sep-2026). No se verificó y no se incluyó como episodio.
- **Unión Europea, AI Act:** el Consejo y el Parlamento anunciaron el 7-may-2026 un acuerdo para "simplificar" las reglas (ómnibus digital; posible postergación de obligaciones de alto riesgo). No pude abrir el comunicado (403), así que no se incluye el calendario modificado. **No afirmar que las obligaciones de alto riesgo aplican desde agosto de 2026 sin revisarlo.**
- **Intel Magdeburg:** no se verificó el monto del subsidio alemán comprometido, así que se omitió.

### MIGA
- La prima "aprox. 1% anual del monto asegurado" y el plazo "hasta 15 años (a veces 20)" provienen de *MIGA at a Glance* (**2019**). Pueden no estar al día. La página de términos y condiciones de miga.org devolvió 403.
- MIGA hoy comercializa sus productos bajo "World Bank Group Guarantees". Los nombres de productos en miga.org/products cambiaron (p. ej. "Non-honoring of Public Debt").
- La exclusión de cambios regulatorios de buena fe viene del **Convenio MIGA, art. 11(a)(ii)**. Los contratos modernos amplían la redacción (seguridad pública, recaudación, medio ambiente). Esa formulación salió de un resultado de búsqueda sobre formularios de contrato de MIGA y no se leyó en el contrato mismo.
- "No cubre riesgo comercial en general" es una **inferencia** del alcance del producto, no una exclusión textual.
- **Elegibilidad:** según el Anexo A del Convenio (versión 2016), EE.UU. y Alemania son "Categoría Uno", así que no son anfitriones elegibles. Los otros seis países son "Categoría Dos".

### Rice & Zegart (2018)
- El texto completo de HBR está tras muro de pago. Las cuatro competencias y la definición ampliada vienen de la descripción oficial en store.hbr.org. Las preguntas asociadas a cada competencia vienen de un **resumen secundario** (leadershipreview.net). El caso SeaWorld viene de la parte visible de hbr.org y de la ficha de Stanford GSB.

## 3. Lo que no se pudo verificar (null o ausente)
- Percentiles WGI: no existen en la publicación actual (ver arriba).
- Crecimiento 2026 de Chile y EAU en el Update de julio 2026: no publicados.
- Inflación 2026 actualizada a julio por país: no publicada.
- Calificación de Atradius: no consultada.
- Primas de seguro de riesgo político por país: no existe una fuente pública con tarifas por país.
