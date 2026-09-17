# Simulador de riesgo político

Juego de clase sobre riesgo político e inversión en la era de la IA. Los alumnos forman el
directorio de una empresa que reparte US$ 100 M entre proyectos en ocho países —data
centers, chips, litio, níquel, nearshoring— durante varios años. Cada año traen un informe
de riesgo, deciden dónde invertir y si contratar seguro o invertir en la relación con la
comunidad. Después el mundo reparte economía y política, igual para todo el curso.

**Jugar:** https://naimbro.github.io/mgt300-risk-game/

## Para el docente

1. Abre el enlace y entra en **Soy docente** → **Crear partida**. Esa pantalla es la que se
   proyecta, y tu navegador conduce el juego: mantenla abierta.
2. Los alumnos escanean el QR o entran con el código de 5 letras desde su teléfono.
3. Cada año se cierra solo cuando se acaba el tiempo o cuando todos decidieron. También
   puedes cerrarlo a mano o dar 30 segundos más.
4. Al final queda un cierre para proyectar: podio, qué habría pasado con estrategias
   típicas en el mismo mundo, riesgo asumido contra resultado, los eventos año por año,
   preguntas para discutir y las recomendaciones que escribieron los alumnos.

Dura entre 20 y 30 minutos según cuántos años y cuánto tiempo por año elijas.

## Qué enseña

- El riesgo político se paga: en promedio, un país más riesgoso rinde más, con mucha más
  volatilidad y colas peores (Jensen 2008 sobre instituciones y expropiación).
- Se puede gestionar: seguro tipo MIGA, socio local y licencia social, diversificación
  entre regiones (Rice y Zegart 2018).
- Hay riesgos que no se aseguran: cambios regulatorios, aranceles y conflictos con la
  comunidad.
- Instituciones inclusivas y extractivas, y por qué una autocracia estable puede tener
  menos riesgo de expropiación que una democracia debilitada (Acemoglu y Robinson 2012).

Todas las fórmulas están a la vista en la página **¿Cómo funciona?**. Los indicadores son
reales y citados (Banco Mundial, V-Dem, FMI, S&P); los titulares de eventos son escenarios
de ficción inspirados en episodios reales.

## Desarrollo

Ver [CLAUDE.md](CLAUDE.md). Resumen: React 19, Vite 7, Tailwind, Firebase (Firestore y
auth anónima), despliegue automático a GitHub Pages al hacer push a `main`.

```bash
npm install
npm run dev
npm test          # motor
npm run simular   # calibración de estrategias
npm run test:rules
```
