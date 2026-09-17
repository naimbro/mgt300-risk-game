# Simulador de riesgo político (MGT300 · SCyP)

Juego de clase: los alumnos son el directorio de una empresa que invierte en proyectos
de la era de la IA en ocho países, durante cuatro o cinco "años". Se usa en la sesión
**"Taller integrador: gobernar e invertir en la era de la IA"** (clase 15, 17 de noviembre
de 2026), con Acemoglu y Robinson (cap. 3) y Rice y Zegart (HBR 2018).

- En vivo: https://naimbro.github.io/mgt300-risk-game/
- Proyecto Firebase: `mgt300-risk-game` (Firestore + auth anónima).
- Otros docentes de SCyP también lo usan; el enlace circula, así que **no se rompe la URL**.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/engine/` | Motor puro: modelo, resolución de una ronda, contrafactuales. Sin React ni Firebase. |
| `src/content/` | Países (datos verificados), señales del informe y titulares de eventos. |
| `src/lib/partida.ts` | Toda la conversación con Firestore. |
| `src/pages/` | `Entrar`, `CrearPartida`, `Anfitrion` (proyector), `Jugador` (teléfono), `ComoFunciona`. |
| `scripts/simular.ts` | Calibración: 14 estrategias en miles de partidas → `research/calibracion.md`. |
| `scripts/test-rules.mjs` | 66 pruebas de `firestore.rules` en el emulador. |
| `research/` | Datos 2026 con fuentes (`datos-paises-2026.json`) y notas de incertidumbre. |

## Cómo se trabaja acá

Node 20 desde WSL (no hay Node en Windows). Todo se corre desde `/mnt/c/...`:

```bash
npm run dev            # desarrollo contra Firebase de verdad
npm run emu            # emuladores de auth y firestore
npm run dev:emu        # app contra los emuladores
npm test               # pruebas del motor
npm run simular        # recalibrar y reescribir research/calibracion.md
npm run test:rules     # reglas en emulador
npx firebase deploy --only firestore:rules --project mgt300-risk-game
```

## Decisiones que no conviene deshacer

**El motor es puro y está calibrado por simulación.** Cualquier cambio de parámetros
(`PARAMETROS` en `src/engine/modelo.ts`) se valida con `npm run simular`. Lo que se busca:

- El retorno esperado **sube** con el riesgo (en la versión 2025 bajaba, y el juego
  enseñaba lo contrario de la clase).
- Ninguna estrategia trivial domina: leer el informe y mitigar donde hay alerta debe
  quedar arriba en percentil medio; concentrarse en el país más riesgoso puede ganar el
  torneo, pero con alta probabilidad de perder plata.
- Los números deben ser creíbles en pantalla. Si los impactos de los eventos son muy
  grandes, el retorno de un año normal tiene que compensarlos y los países riesgosos
  muestran retornos absurdos (+40% anual) en los años sin eventos.

**El mundo se sortea una vez por ronda, en el navegador del profesor, después de cerrar
las inversiones.** Así todo el curso vive el mismo año (hay algo que comentar) y nadie
puede calcular su resultado antes de decidir. En 2025 el cálculo estaba en el teléfono del
alumno y dependía del monto: se podían probar montos en la consola hasta encontrar uno
ganador.

**El navegador del profesor es el motor.** Si se cierra, reabrir el mismo enlace retoma la
partida. Ojo: la sesión anónima vive en el navegador, así que un profesor que entre desde
otro equipo no puede conducir esa partida.

**Las carteras son privadas hasta que se resuelve el año** (`carteras` solo las lee su
dueño y el profesor), pero quién ya decidió es público (`respuestas`), que es lo que
alimenta el contador del proyector.

## Trampas encontradas (y cómo se arreglaron)

- **Firestore no direcciona elementos de un arreglo.** `players.uid.submissions.0.result`
  convertía el arreglo en mapa y **borraba** la inversión. Verificado en el emulador. Se
  reescribe el arreglo completo.
- **Chrome frena los temporizadores de pestañas en segundo plano.** El profesor pasa a sus
  diapositivas y el año no se cierra solo. `useAhora` también escucha `visibilitychange` y
  `focus`.
- **El contador de "ya decidieron" arrastraba la ronda anterior** y cerraba el año recién
  abierto al instante. `useRespuestas` se vacía al cambiar de ronda, y el cierre automático
  exige 5 segundos desde `faseIniciadaEn`.
- **Acciones del profesor releen el documento** (`leerFresca`) antes de actuar: la pantalla
  puede ir un snapshot atrasada y cerrar dos veces el mismo año sortearía otro mundo.
- **Candados sincrónicos con `useRef`**, no con estado, para envíos y acciones del profesor.
- **Probar con el recarga-en-caliente de Vite da falsos positivos**: dejó árboles de React a
  medias (paneles que desaparecen). Para probar en serio, compilar y servir
  (`vite preview`) y no editar código durante la partida.
- **Las banderas emoji no se dibujan en Chrome sobre Windows**, que es justo el computador
  del proyector. Se usan SVG de `flag-icons`.
- **El emulador responde a `Authorization: Bearer owner`**, útil para inspeccionar datos sin
  pelear con las reglas.

## Contenido

Cada dato de país sale de `research/datos-paises-2026.json`, con fuente y año. Las
exposiciones geopolítica y a conflicto armado son juicio editorial, documentado con
episodios reales. **Los titulares de eventos y las señales son escenarios de ficción**
inspirados en episodios que sí ocurrieron; la pantalla lo dice.

Al actualizar para otro semestre: revisar WGI, V-Dem, FMI y ratings, y revisar que los
episodios sigan siendo el mejor ejemplo de su tipo. Después correr `npm run simular`.

## Presupuesto de tiempo

Reloj de cada año + ~2 minutos de resultados + cierre. Con 4 años de 60 segundos son unos
20 minutos; con 5 de 90, unos 30. El primer año suma 30 segundos porque las fichas se leen
por primera vez.
