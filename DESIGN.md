---
name: Calculadora de Faltas
description: Sistema visual editorial limpio para control académico de faltas y horas lectivas.
colors:
  cobalt-accent: "#2151d6"
  cobalt-fill: "#2151d6"
  cobalt-fill-hover: "#1b44b8"
  cobalt-fill-active: "#16389a"
  cobalt-dark-fill: "#2b5de0"
  cobalt-dark-accent: "#7ca6ff"
  paper-canvas: "#f7f7f5"
  obsidian-canvas: "#151514"
  card-surface: "#ffffff"
  card-surface-dark: "#1d1d1b"
  subtle-track: "#efefed"
  subtle-track-dark: "#161614"
  ink-primary: "#181817"
  ink-primary-dark: "#f3f2ee"
  ink-secondary: "#5a5a54"
  ink-secondary-dark: "#a8a79f"
  ink-muted: "#6c6c65"
  hairline-border: "#e5e5e0"
  hairline-border-dark: "#2e2e2b"
  error-ink: "#b91c1c"
  error-border: "#dc2626"
  error-surface: "#fef2f2"
typography:
  headline:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0em"
    fontFeature: "\"tnum\""
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  space-1: "0.25rem"
  space-2: "0.5rem"
  space-3: "0.75rem"
  space-4: "1rem"
  space-5: "1.25rem"
  space-6: "1.5rem"
  space-8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-fill}"
    textColor: "{colors.card-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "3rem"
    padding: "0 1rem"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-fill-hover}"
  button-secondary:
    backgroundColor: "{colors.subtle-track}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "3rem"
    padding: "0 1rem"
  input-field:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "3rem"
    padding: "0.5rem 0.75rem"
  auth-card:
    backgroundColor: "{colors.card-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.xl}"
    padding: "2rem"
    width: "26.25rem"
  mode-switcher:
    backgroundColor: "{colors.subtle-track}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    padding: "0.25rem"
---

# Design System: Calculadora de Faltas

## Overview

**Creative North Star: "The Academic Ledger"**

Calculadora de Faltas adopta la claridad editorial y la economía visual de **Notion** aplicada al seguimiento académico de estudiantes de FP e instituto. La interfaz elimina adornos, reclamos promocionales e ilustraciones de relleno para centrar toda la atención en datos verificables y controles táctiles directos.

Cada pantalla se organiza sobre papel neutro cálido y superficies definidas por bordes de un píxel, reservando un único acento azul cobalto para identidad geométrica, foco de teclado, enlace inline y acción principal. Tanto el modo claro como el oscuro funcionan de forma nativa mediante `color-scheme: light dark` y `light-dark()`.

**Key Characteristics:**
- Lienzo neutro cálido sin saturación superflua ni degradados decorativos.
- Jerarquía tipográfica directa basada en Geist Sans con cifras tabulares en Geist Mono.
- Arquitectura estricta de componentes bajo **Atomic Design** (`atoms` → `molecules` → `organisms` → `templates`) gobernada únicamente por tokens CSS.
- Áreas táctiles mínimas de 48 px (`3rem`) en pestañas, campos, botones, selectores y enlaces secundarios.

## Colors

La paleta combina un fondo de papel cálido, superficies ligeramente escalonadas y un azul cobalto contenido para dirigir la acción sin ruido visual.

### Primary
- **Cobalt Accent & Fill**: Identifica el isotipo geométrico, el estado activo de foco (`:focus-visible`), los enlaces inline y el botón principal de envío; en modo oscuro separa la tinta de enlaces (`cobalt-dark-accent`) del relleno del botón (`cobalt-dark-fill`) para preservar contraste WCAG AA superior a 4.5:1 con texto blanco.

### Neutral
- **Paper Canvas / Obsidian Canvas**: Fondo general de ventana en claro y oscuro respectivamente, aportando reposo visual alrededor del contenedor principal.
- **Card Surface / Card Surface Dark**: Superficie elevada para formularios, resúmenes de sesión y segmento activo del conmutador.
- **Subtle Track / Subtle Track Dark**: Contenedor rebajado para el carril del conmutador de acceso, listas de resumen y botones secundarios.
- **Ink Primary, Ink Secondary & Ink Muted**: Tintas neutras con subtono cálido para títulos, etiquetas, placeholders y textos de ayuda.
- **Hairline Border**: Divisores estructurales de 1 px que delimitan tarjetas, campos y filas de datos sin peso visual.

### Error Semantics
- **Error Ink, Error Border & Error Surface**: Reservados exclusivamente para mensajes de error tras interacción del usuario (`:user-invalid` o `[aria-invalid="true"]`) y alertas de fallo del servidor (`StatusBanner`).

### Named Rules
**The Single Accent Rule.** El acento azul cobalto se reserva únicamente para foco, enlace inline, isotipo y el CTA principal de la tarjeta; nunca ocupa grandes superficies ni múltiples acciones rivales.

## Typography

**Display & Body Font:** Geist (`Geist, system-ui, -apple-system, sans-serif`)
**Numeric / Mono Font:** Geist Mono (`Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace`)

**Character:** Escala compacta, geométrica y legible pensada para formularios densos en móvil y escritorio sin sacrificar serenidad visual ni activar zoom automático en iOS (inputs a `1rem`).

### Hierarchy
- **Headline** (`600`, `1.375rem` / `22px`, line-height `1.25`, tracking `-0.025em`): Título principal `<h1>` de cada tarjeta (`Iniciar sesión`, `Crear cuenta` o nombre de usuario activo), siempre directo y sin kickers encima.
- **Title** (`600`, `1.125rem` / `18px`, line-height `1.25`, tracking `-0.02em`): Nombre de la aplicación junto al isotipo de marca.
- **Body** (`400`, `1rem` / `16px`, line-height `1.5`): Texto introducido en inputs, selects nativos y botones de acción.
- **Label** (`500`, `0.875rem` / `14px`, line-height `1.4`): Etiquetas de campo situadas encima de cada control, subtítulos breves y pestañas de navegación.
- **Mono / Tabular** (`500`, `0.8125rem` / `13px`, `font-variant-numeric: tabular-nums`): Duraciones oficiales de cursos y métricas horarias (p. ej. `960 h`).

### Named Rules
**The Direct Heading Rule.** Todo `<h1>` abre el bloque sin etiquetas previas (`kicker` o `eyebrow`) encima para respetar la lectura editorial inmediata.

## Layout

Los flujos de entrada y resumen se centran verticalmente en escritorio sobre una única columna contenida en `26.25rem` (`420px`) con relleno interno de `2rem` (`32px`), margen de seguridad lateral constante de `1rem` (`16px`) y separación vertical constante entre campos (`1.25rem` / `20px`).

En pantallas compactas (`<= 30rem` / `480px`), el contenedor alinea el inicio cerca del borde superior (`1.5rem` / `24px`) y reduce el relleno interno de la tarjeta a `1.5rem` (`24px`) garantizando cero desbordamiento horizontal (`scrollWidth === innerWidth`).

## Elevation & Depth

El sistema utiliza **capas tonales con borde fino de 1 px** como mecanismo principal de jerarquía; las sombras tienen función estrictamente ambiental y discreta para separar la tarjeta y la pestaña activa del plano base.

### Shadow Vocabulary
- **Card Ambient Shadow**: Sombra difusa mínima definida en `--shadow-card` (variante clara sutil y variante oscura reforzada).
- **Active Segment Shadow**: Micro-elevación de 1 px definida en `--shadow-tab-active` sobre la pestaña activa del conmutador.

### Named Rules
**The Hairline-First Rule.** La estructura visual depende de contraste tonal y bordes de 1 px (`--border-subtle`), evitando sombras pesadas o efectos de cristal (`backdrop-filter`).

## Shapes

Sistema de esquinas suavizadas por jerarquía espacial: radios medianos en controles interactivos (`0.5rem` / `8px`), radios amplios en contenedores de conmutador (`0.625rem` / `10px`) y tarjetas principales (`0.875rem` / `14px`), y radio menor en badges y enlaces (`0.375rem` / `6px`). Toda la iconografía emplea trazos uniformes de `1.5px` (`1.75px` en el isotipo de marca) con terminaciones redondeadas.

## Components

Cada componente implementa estrictamente la jerarquía Atomic Design (`atoms`, `molecules`, `organisms`, `templates`), sin estilos inline ni valores crudos fuera de tokens.

### Buttons
- **Shape:** Rectángulo suavizado (`0.5rem` radius), altura mínima táctil de `3rem` (`48px`), ancho completo en acciones de tarjeta.
- **Primary:** Fondo cobalto (`--accent-fill`) con texto blanco (`--accent-ink`), transición suave de `180ms cubic-bezier(0.22, 1, 0.36, 1)`.
- **Secondary:** Fondo neutro sutil (`--surface-subtle`) con borde de 1 px y tinta principal para acciones de salida o soporte (`Cerrar sesión`).
- **Focus / Loading:** Halo accesible `:focus-visible` de 2 px con 2 px de separación y estado `disabled` con cursor `wait` e icono rotatorio sujeto a `prefers-reduced-motion`.

### Inputs / Fields & Native Select
- **Style:** Fondo dedicado (`--surface-input`), borde de 1 px (`--border-subtle`), tipografía `1rem` (`16px`) y altura táctil de `3rem` (`48px`).
- **Password Toggle:** Botón integrado a la derecha de `48px × 48px` (`IconButton`) con `aria-pressed` y descripción en español.
- **Validation & Focus:** Borde en `--accent-primary` con halo suave de 3 px al enfocar; borde rojo `--status-error-border` únicamente tras interacción (`:user-invalid` o `aria-invalid="true"`) acompañado de mensaje debajo del control y anuncio único accesible.

### Navigation Switcher & Inline Links
- **Mode Switcher:** Carril de dos columnas iguales (`--surface-track`) con relleno de `0.25rem` y segmentos de `48px` de altura; el enlace activo recibe superficie elevada (`--surface-segment-active`) y `aria-current="page"`.
- **Footer Inline Links:** Enlaces con caja flex centrada y altura táctil mínima garantizada de `3rem` (`48px`).

### Cards & Summary List
- **Auth Card:** Tarjeta única con borde de 1 px, `padding: 2rem` (`1.5rem` en móvil) y separación de secciones de `1.5rem`.
- **Summary List:** Lista neutra para sesión activa con filas flexibles, divisor superior de 1 px entre filas, texto en alto contraste para nombres de curso y `Badge` monospace tabular para horas oficiales.

## Do's and Don'ts

### Do:
- **Do** utilizar siempre variables CSS de `app/tokens.css` y clases semánticas de `app/components.css` manteniendo los componentes presentacionales libres de `fetch`, lógica de negocio o valores hexadecimales/píxeles fijos.
- **Do** conservar `color-scheme: light dark`, altura táctil mínima de `48px` y tamaño `>= 1rem` en todo control de formulario o enlace principal.
- **Do** mostrar validación solo después de la interacción (`:user-invalid` + estado tras blur/envío) y eliminar el error tan pronto el valor vuelva a ser válido.

### Don't:
- **Don't** añadir `kicker`, `eyebrow`, degradados decorativos, ilustraciones de relleno ni iconos emoji sobre formularios o tarjetas.
- **Don't** introducir componentes que mezclen llamadas `fetch` con átomos/moléculas/organismos presentacionales; toda orquestación reside en `components/containers/`.
- **Don't** permitir crear cursos nuevos desde pantallas de autenticación ni emitir mensajes de validación en inglés.

