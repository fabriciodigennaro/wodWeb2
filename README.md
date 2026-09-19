# wodWeb2 (WWII)

Temporizador de WODs de CrossFit, mobile-first y PWA. Siete tipos de timer: AMRAP, EMOM, For Time, Tabata, Interval, Countdown y Stopwatch.

## Características

- Timer engine por **timestamps reales** (sin drift), con estados PREP/WORK/REST, pause/resume, reset y finals.
- **Precisión y sonido**: beeps para ticks, GO y final con Web Audio API; vibración opcional (Vibration API); Screen Wake Lock mientras corre.
- **PWA**: installable, manifest, service worker y funcionamiento offline tras la primera carga.
- **Persistencia local** (localStorage): recientes de los últimos 5 timers usados.
- UI tactical/military con contraste alto, pensada para usarse durante el entrenamiento (números enormes, thumb-friendly, landscape).

## Stack

- Angular 22 (standalone, zoneless, Signals, strict mode, OnPush)
- Tailwind CSS v4
- TypeScript (strict)
- Vitest (tests de unidad ejecutados vía `ng test`)
- ESLint (flat config) + Prettier

## Desarrollo local

```bash
npm install
npm start            # dev server en http://localhost:4200
```

## Testing

```bash
npm run format       # Prettier en modo escritura
npm run lint         # ESLint
npx ng test --watch=false
```

## Build

```bash
npm run build        # genera dist/wodWeb2/browser (incluye service worker y manifest)
```

## Deploy

El proyecto no requiere backend. Se despliega como hosting estático.

El build de Angular emite la app en `dist/wodWeb2/browser`.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist/wodWeb2/browser`
- El fichero `public/_redirects` (copiado al build) redirige todas las rutas a `index.html`, por lo que el routing de Angular funciona sin configuración extra.

### GitHub Pages

- Build con `ng build` (si el proyecto vive en un subdirectorio, ajustar `baseHref` en `angular.json`).
- Subir el contenido de `dist/wodWeb2/browser` a la rama `gh-pages`.
- El fichero `public/404.html` (copiado al build) hace que el routing funcione en GitHub Pages: cualquier ruta desconocida carga la app.

## Arquitectura

- `src/app/core/timer` — dominio puro del timer (config, estados, engine con Signals). Sin dependencias de Angular salvo Signals; testeable sin DOM.
- `src/app/core/services` — gateways de audio, haptics, wake lock y store, más servicios de feedback y recientes.
- `src/app/features` — home, setup y screen del timer, más el servicio de sesión (config temporal entre setup y screen).
- `src/app/shared` — utilidades (formato de tiempo mm:ss y etiquetas).

Decisiones clave:

- Pausa disponible en todos los timers excepto AMRAP (la ronda AMRAP solo se incrementa manualmente con `+1`).
- Tabata/Interval no ejecutan el descanso final después del último trabajo (fin al terminar el último work).
- For Time corre en count-up; el time cap es opcional y finaliza el crono si el cap no es null.
- El motor no lleva timers internos: la UI hace `engine.refresh()` sobre el reloj del sistema.

## Notas

- Durante el WOD, "el timer es el producto": la pantalla de running muestra solo lo imprescindible y se adapta a horizontal (landscape).
- Sin backend: audio, vibración, wake lock y persistencia son 100% locales.
